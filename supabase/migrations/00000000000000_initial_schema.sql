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
