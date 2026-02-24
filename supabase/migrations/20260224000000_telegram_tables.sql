-- ============================================================
-- Telegram Bot Integration
-- ============================================================
-- Separate identity and conversation space for Telegram users.
-- Not linked to auth.users — Telegram users are a distinct identity space.
-- All access via service role client only (no RLS, no grants to anon/authenticated).

-- ============================================================
-- Telegram Users table
-- ============================================================

-- Minimal data for GDPR compliance: only telegram_id and language preference.
-- No username or display_name stored — Telegram provides these on every update.
CREATE TABLE public.telegram_users (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id                 BIGINT NOT NULL UNIQUE,
  language_code               TEXT NOT NULL DEFAULT 'fr',
  tier                        TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  conversation_count_month    INTEGER NOT NULL DEFAULT 0,
  conversation_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()) + INTERVAL '1 month',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defense-in-depth: RLS enabled (deny-all by default) + explicit revoke.
-- These tables are only accessed via the service role client.
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_users FROM anon, authenticated;

-- ============================================================
-- Telegram Conversations table
-- ============================================================

-- Mirrors public.conversations structure but references telegram_users instead of auth users.
-- Persona CHECK constraint mirrors PERSONA_IDS in lib/constants/personas.ts.
-- Status CHECK constraint mirrors CONVERSATION_STATUSES in types/conversation.ts.
CREATE TABLE public.telegram_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id UUID NOT NULL REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL,
  persona          TEXT NOT NULL CHECK (persona IN ('doctor', 'critic', 'guide')),
  title            TEXT,
  messages         JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_report       BOOLEAN NOT NULL DEFAULT FALSE,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  message_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for "recent conversations" list query (user's conversations by date)
CREATE INDEX idx_tg_conversations_user
  ON public.telegram_conversations(telegram_user_id, updated_at DESC);

ALTER TABLE public.telegram_conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_conversations FROM anon, authenticated;

-- Reuse handle_updated_at() trigger function from initial schema
CREATE TRIGGER tg_conversations_updated_at
  BEFORE UPDATE ON public.telegram_conversations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- Reports table modification — support Telegram as report source
-- ============================================================

-- Make conversation_id nullable (Telegram reports have telegram_conversation_id instead)
ALTER TABLE public.reports
  ALTER COLUMN conversation_id DROP NOT NULL;

-- Add Telegram conversation FK
ALTER TABLE public.reports
  ADD COLUMN telegram_conversation_id UUID UNIQUE
    REFERENCES public.telegram_conversations(id) ON DELETE CASCADE;

-- Ensure exactly one source (web OR telegram, never both, never neither)
ALTER TABLE public.reports
  ADD CONSTRAINT reports_one_source CHECK (
    (conversation_id IS NOT NULL AND telegram_conversation_id IS NULL)
    OR (conversation_id IS NULL AND telegram_conversation_id IS NOT NULL)
  );

-- ============================================================
-- Atomic conversation quota function for Telegram users
-- ============================================================

-- Mirrors use_conversation() but without auth.uid() check.
-- Only callable via service role client (no grants to anon/authenticated).
-- IMPORTANT: Limit values must match TIER_QUOTAS in lib/constants/quotas.ts
CREATE OR REPLACE FUNCTION public.use_telegram_conversation(
  p_telegram_user_id UUID
)
RETURNS TABLE(was_allowed BOOLEAN, new_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_tier TEXT;
  v_limit INTEGER;
BEGIN
  -- Lock the row and read tier + count atomically
  SELECT conversation_count_month, conversation_count_reset_at, tier
  INTO v_count, v_reset_at, v_tier
  FROM public.telegram_users
  WHERE id = p_telegram_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Reset counter if past reset date
  IF v_reset_at <= NOW() THEN
    v_count := 0;
    UPDATE public.telegram_users
    SET conversation_count_month = 0,
        conversation_count_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE id = p_telegram_user_id;
  END IF;

  -- Derive limit from tier (must match TIER_QUOTAS in lib/constants/quotas.ts)
  v_limit := CASE v_tier
    WHEN 'free' THEN 15
    WHEN 'paid' THEN NULL
    ELSE 15  -- unknown tiers default to free limits
  END;

  -- Unlimited tier (null limit): always allow
  IF v_limit IS NULL THEN
    UPDATE public.telegram_users
    SET conversation_count_month = v_count + 1
    WHERE id = p_telegram_user_id;
    RETURN QUERY SELECT TRUE, v_count + 1;
    RETURN;
  END IF;

  -- Check limit
  IF v_count >= v_limit THEN
    RETURN QUERY SELECT FALSE, v_count;
    RETURN;
  END IF;

  -- Increment
  UPDATE public.telegram_users
  SET conversation_count_month = v_count + 1
  WHERE id = p_telegram_user_id;

  RETURN QUERY SELECT TRUE, v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

-- No grants to anon or authenticated — only accessible via service role
