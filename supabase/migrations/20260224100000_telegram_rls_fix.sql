-- ============================================================
-- Fix: Enable RLS on Telegram tables (defense-in-depth)
-- ============================================================
-- These tables are only accessed via service role client.
-- RLS enabled with no policies = deny-all for anon/authenticated.

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_users FROM anon, authenticated;

ALTER TABLE public.telegram_conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_conversations FROM anon, authenticated;
