-- Users profile table (mirrors auth.users with extra profile fields)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~* '^https://'),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  conversation_count_month INTEGER NOT NULL DEFAULT 0,
  conversation_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

-- UPDATE restricted to safe columns only via column-level grants below.
-- Protected fields (tier, conversation_count_month, conversation_count_reset_at)
-- can only be modified via SECURITY DEFINER functions.
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- INSERT restricted: enforce default tier and zero conversation count
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = id
    AND tier = 'free'
    AND conversation_count_month = 0
  );

CREATE POLICY "users_delete_own" ON public.users
  FOR DELETE USING ((SELECT auth.uid()) = id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Column-level grants: authenticated users can only update safe columns.
-- tier, conversation_count_month, conversation_count_reset_at are managed
-- exclusively via the use_conversation() SECURITY DEFINER function.
GRANT SELECT, DELETE ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
-- email is synced by handle_new_user() trigger only — not directly updatable by clients
GRANT UPDATE (display_name, avatar_url) ON public.users TO authenticated;

-- Atomic conversation increment function.
-- Handles monthly reset, limit check, and count increment in a single
-- locked transaction to prevent race conditions.
-- Tier-to-limit mapping is resolved inside the lock to prevent TOCTOU races.
-- IMPORTANT: Limit values must match TIER_QUOTAS in lib/constants/quotas.ts
CREATE OR REPLACE FUNCTION public.use_conversation(
  p_user_id UUID
)
RETURNS TABLE(was_allowed BOOLEAN, new_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_tier TEXT;
  v_limit INTEGER;
BEGIN
  -- Prevent IDOR: only allow users to consume their own conversations
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Lock the row and read tier + count atomically
  SELECT conversation_count_month, conversation_count_reset_at, tier
  INTO v_count, v_reset_at, v_tier
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Reset counter if past reset date
  IF v_reset_at <= NOW() THEN
    v_count := 0;
    UPDATE public.users
    SET conversation_count_month = 0,
        conversation_count_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE id = p_user_id;
  END IF;

  -- Derive limit from tier (must match TIER_QUOTAS in lib/constants/quotas.ts)
  v_limit := CASE v_tier
    WHEN 'free' THEN 15
    WHEN 'paid' THEN NULL
    ELSE 15  -- unknown tiers default to free limits
  END;

  -- Unlimited tier (null limit): always allow
  IF v_limit IS NULL THEN
    UPDATE public.users
    SET conversation_count_month = v_count + 1
    WHERE id = p_user_id;
    RETURN QUERY SELECT TRUE, v_count + 1;
    RETURN;
  END IF;

  -- Check limit
  IF v_count >= v_limit THEN
    RETURN QUERY SELECT FALSE, v_count;
    RETURN;
  END IF;

  -- Increment
  UPDATE public.users
  SET conversation_count_month = v_count + 1
  WHERE id = p_user_id;

  RETURN QUERY SELECT TRUE, v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION public.use_conversation(UUID) TO authenticated;

-- Auto-create public.users profile when a new auth user is created.
-- Handles all auth pathways (email/password, OAuth) atomically,
-- preventing orphaned auth users without profile rows.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name'
    ),
    CASE
      WHEN NEW.raw_user_meta_data->>'avatar_url' ~* '^https://'
      THEN NEW.raw_user_meta_data->>'avatar_url'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Conversations table
-- ============================================================

-- Persists chat sessions. Messages stored as JSONB array (read/written atomically).
-- Persona CHECK constraint mirrors PERSONA_IDS in lib/constants/personas.ts.
-- Status CHECK constraint mirrors CONVERSATION_STATUSES in types/conversation.ts.
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL CHECK (persona IN ('doctor', 'critic', 'guide')),
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_report BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for "recent conversations" list query (user's conversations by date)
CREATE INDEX idx_conversations_user_updated
  ON public.conversations(user_id, updated_at DESC);

-- Partial index for report library filter (only conversations with reports)
CREATE INDEX idx_conversations_user_report
  ON public.conversations(user_id)
  WHERE has_report = TRUE;

-- Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_own" ON public.conversations
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "conversations_update_own" ON public.conversations
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "conversations_delete_own" ON public.conversations
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Reuse handle_updated_at() trigger function defined above
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grants: authenticated users only (no anon access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;

-- ============================================================
-- Reports table — shareable report URLs (roadmap item #12)
-- ============================================================

-- Stores extracted report content with a public share_token.
-- One-to-one with conversations (UNIQUE on conversation_id).
-- Public read via share_token (no auth required).
-- Persona CHECK constraint mirrors PERSONA_IDS in lib/constants/personas.ts.

CREATE TABLE public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  persona         TEXT NOT NULL CHECK (persona IN ('doctor', 'critic', 'guide')),
  content         TEXT NOT NULL,
  share_token     TEXT NOT NULL UNIQUE,
  is_branded      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup by share_token (public page query — the hot path)
CREATE INDEX idx_reports_share_token ON public.reports(share_token);

-- Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (including anon) can read a report.
-- The share_token itself is the access control — knowing the token grants read access.
CREATE POLICY "reports_select_public" ON public.reports
  FOR SELECT USING (true);

-- Insert: only authenticated users can create reports for their own conversations.
-- Ownership verified via subquery on conversations table.
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- No UPDATE or DELETE policies — reports are immutable once created.
-- Cleanup happens via ON DELETE CASCADE when the conversation is deleted.

-- Grants
GRANT SELECT ON public.reports TO anon, authenticated;
GRANT INSERT ON public.reports TO authenticated;
