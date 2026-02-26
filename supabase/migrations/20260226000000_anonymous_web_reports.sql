-- ============================================================
-- Anonymous Web Reports
-- ============================================================
-- Allow reports without a conversation FK (anonymous web users).
-- Extends the Telegram pattern: reports can now have three sources:
--   1. Web conversation (conversation_id NOT NULL)
--   2. Telegram conversation (telegram_conversation_id NOT NULL)
--   3. Anonymous web (both NULL, is_anonymous = TRUE)
--
-- Anonymous reports are claimed during signup migration by setting
-- conversation_id and clearing is_anonymous.

-- Add column first (referenced by the CHECK constraint below)
ALTER TABLE public.reports
  ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- Relax the source constraint to allow anonymous (both FKs NULL)
ALTER TABLE public.reports DROP CONSTRAINT reports_one_source;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_one_source CHECK (
    (conversation_id IS NOT NULL AND telegram_conversation_id IS NULL AND is_anonymous = FALSE)
    OR (conversation_id IS NULL AND telegram_conversation_id IS NOT NULL AND is_anonymous = FALSE)
    OR (conversation_id IS NULL AND telegram_conversation_id IS NULL AND is_anonymous = TRUE)
  );

-- Partial index for periodic cleanup of unclaimed anonymous reports
CREATE INDEX idx_reports_anonymous
  ON public.reports(created_at)
  WHERE is_anonymous = TRUE;
