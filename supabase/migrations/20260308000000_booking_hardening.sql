-- ============================================================
-- Booking hardening: single-row constraint + RPC conversation validation
-- ============================================================

-- 1. Enforce single-row constraint on availability_config
-- Uses a fixed UUID to ensure only one config row can exist.
ALTER TABLE public.availability_config
  ADD CONSTRAINT availability_config_single_row
  CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Update existing row to use the fixed UUID
UPDATE public.availability_config
  SET id = '00000000-0000-0000-0000-000000000001'
  WHERE id != '00000000-0000-0000-0000-000000000001';

-- 2. Replace create_booking RPC with conversation ownership validation
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

  -- Validate conversation ownership if provided
  IF p_conversation_id IS NOT NULL THEN
    PERFORM 1 FROM public.conversations
    WHERE id = p_conversation_id AND user_id = auth.uid();
    IF NOT FOUND THEN
      RETURN QUERY SELECT NULL::UUID, FALSE;
      RETURN;
    END IF;
  END IF;

  v_ends_at := p_starts_at + (v_duration || ' minutes')::INTERVAL;

  -- Get buffer from config
  SELECT buffer_minutes INTO v_buffer FROM public.availability_config LIMIT 1;
  v_buffer := COALESCE(v_buffer, 15);

  -- Lock conflicting rows to prevent race conditions, then count
  PERFORM 1
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b.starts_at < (v_ends_at + (v_buffer || ' minutes')::INTERVAL)
    AND (b.ends_at + (v_buffer || ' minutes')::INTERVAL) > p_starts_at
  FOR UPDATE;

  GET DIAGNOSTICS v_conflict_count = ROW_COUNT;

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

-- Re-grant (function signature is the same, but CREATE OR REPLACE resets grants)
GRANT EXECUTE ON FUNCTION public.create_booking(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, UUID, TEXT) TO anon, authenticated;
