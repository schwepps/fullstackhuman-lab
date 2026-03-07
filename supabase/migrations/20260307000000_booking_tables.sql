-- ============================================================
-- Booking feature: AI-native scheduling with context carry-over
-- ============================================================

-- Add is_admin column to users table
ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- Meeting types (seeded, public read)
-- ============================================================
-- Slug CHECK constraint mirrors MEETING_TYPES in lib/constants/booking.ts

CREATE TABLE public.meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug IN ('intro', 'deep-dive')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO public.meeting_types (slug, duration_minutes) VALUES
  ('intro', 30),
  ('deep-dive', 60);

-- RLS: public read, no client writes
ALTER TABLE public.meeting_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_types_select_public" ON public.meeting_types
  FOR SELECT USING (true);

GRANT SELECT ON public.meeting_types TO anon, authenticated;

-- ============================================================
-- Availability configuration (single row, public read)
-- ============================================================
-- Weekly schedule: JSONB array of { day: 0-6, start: "HH:MM", end: "HH:MM" }
-- Blocked dates: JSONB array of ISO date strings ["2026-04-01", ...]

CREATE TABLE public.availability_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  buffer_minutes INTEGER NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0),
  weekly_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_advance_days INTEGER NOT NULL DEFAULT 60 CHECK (max_advance_days > 0),
  min_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (min_notice_hours >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER availability_config_updated_at
  BEFORE UPDATE ON public.availability_config
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Seed default config (Mon-Fri 9:00-17:00, Europe/Paris)
INSERT INTO public.availability_config (timezone, buffer_minutes, weekly_schedule, blocked_dates, max_advance_days, min_notice_hours)
VALUES (
  'Europe/Paris',
  15,
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb,
  60,
  24
);

-- RLS: public read, no client writes (service client only for updates)
ALTER TABLE public.availability_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_config_select_public" ON public.availability_config
  FOR SELECT USING (true);

GRANT SELECT ON public.availability_config TO anon, authenticated;

-- ============================================================
-- Bookings table (core)
-- ============================================================
-- Status CHECK constraint mirrors BOOKING_STATUSES in lib/constants/booking.ts

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type_id UUID NOT NULL REFERENCES public.meeting_types(id),
  -- Optional link to conversation (context carry-over)
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  -- Booker info (no auth required to book)
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL CHECK (booker_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  booker_message TEXT,
  -- Schedule
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  -- Google Calendar
  google_event_id TEXT,
  -- AI briefing
  briefing TEXT,
  briefing_generated_at TIMESTAMPTZ,
  -- Email tracking
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (ends_at > starts_at)
);

-- Indexes
CREATE INDEX idx_bookings_starts_at ON public.bookings(starts_at)
  WHERE status = 'confirmed';
CREATE INDEX idx_bookings_conversation ON public.bookings(conversation_id)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_bookings_booker_email ON public.bookings(booker_email);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see bookings linked to their conversations
CREATE POLICY "bookings_select_own_conversation" ON public.bookings
  FOR SELECT USING (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.user_id = (SELECT auth.uid())
    )
  );

-- Public insert (booking form does not require auth)
-- Rate-limited at the API layer, not RLS
CREATE POLICY "bookings_insert_public" ON public.bookings
  FOR INSERT WITH CHECK (true);

GRANT SELECT ON public.bookings TO authenticated;
GRANT INSERT ON public.bookings TO anon, authenticated;
-- No UPDATE/DELETE grants. Status changes via service client only.

-- ============================================================
-- Google OAuth tokens (service client only, deny-all RLS)
-- ============================================================

CREATE TABLE public.google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER google_oauth_tokens_updated_at
  BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Deny all access via RLS (no policies = deny all for non-service clients)
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Atomic booking creation function (SECURITY DEFINER)
-- ============================================================
-- Prevents double-booking race conditions by validating slot
-- availability and inserting in a single locked transaction.
-- Buffer time between meetings is enforced.
-- IMPORTANT: Meeting type slugs must match MEETING_TYPES in lib/constants/booking.ts

CREATE OR REPLACE FUNCTION public.create_booking(
  p_meeting_type_slug TEXT,
  p_starts_at TIMESTAMPTZ,
  p_booker_name TEXT,
  p_booker_email TEXT,
  p_booker_message TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE(booking_id UUID, was_created BOOLEAN) AS $$
DECLARE
  v_meeting_type_id UUID;
  v_duration INTEGER;
  v_ends_at TIMESTAMPTZ;
  v_conflict_count INTEGER;
  v_buffer INTEGER;
  v_booking_id UUID;
BEGIN
  -- Resolve meeting type
  SELECT id, duration_minutes INTO v_meeting_type_id, v_duration
  FROM public.meeting_types
  WHERE slug = p_meeting_type_slug AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE;
    RETURN;
  END IF;

  v_ends_at := p_starts_at + (v_duration || ' minutes')::INTERVAL;

  -- Get buffer from config
  SELECT buffer_minutes INTO v_buffer FROM public.availability_config LIMIT 1;
  v_buffer := COALESCE(v_buffer, 15);

  -- Check for overlapping bookings (including buffer)
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b.starts_at < (v_ends_at + (v_buffer || ' minutes')::INTERVAL)
    AND (b.ends_at + (v_buffer || ' minutes')::INTERVAL) > p_starts_at
  FOR UPDATE;

  IF v_conflict_count > 0 THEN
    RETURN QUERY SELECT NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Create booking
  INSERT INTO public.bookings (
    meeting_type_id, conversation_id, booker_name, booker_email,
    booker_message, starts_at, ends_at, timezone, status
  ) VALUES (
    v_meeting_type_id, p_conversation_id, p_booker_name, p_booker_email,
    p_booker_message, p_starts_at, v_ends_at, p_timezone, 'confirmed'
  ) RETURNING id INTO v_booking_id;

  RETURN QUERY SELECT v_booking_id, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_booking(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, UUID, TEXT) TO anon, authenticated;
