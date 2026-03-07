import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/service'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import { GOOGLE_TOKEN_ROW_ID } from '@/lib/constants/booking'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

/**
 * Generate the Google OAuth consent URL for admin setup.
 */
export function getAuthorizationUrl(state: string) {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  })
}

/**
 * Exchange authorization code for tokens and store in DB.
 */
export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client()
  const { tokens } = await client.getToken(code)

  const supabase = createServiceClient()
  const { error } = await supabase.from('google_oauth_tokens').upsert(
    {
      id: GOOGLE_TOKEN_ROW_ID,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      token_type: tokens.token_type ?? 'Bearer',
      expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      scope: tokens.scope ?? SCOPES.join(' '),
    },
    { onConflict: 'id' }
  )

  if (error) {
    log('error', LOG_EVENT.GOOGLE_TOKEN_STORE_FAILED, { error: error.message })
    throw new Error('Failed to store Google tokens')
  }
}

/**
 * Get a valid OAuth2 client with fresh tokens.
 * Refreshes automatically if expired.
 */
async function getAuthorizedClient() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .single()

  if (error || !data) {
    throw new Error(
      'Google Calendar not connected. Complete OAuth setup first.'
    )
  }

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expires_at
      ? new Date(data.expires_at).getTime()
      : undefined,
  })

  // Check if token needs refresh
  const isExpired =
    data.expires_at && new Date(data.expires_at).getTime() < Date.now() + 60_000
  if (isExpired && data.refresh_token) {
    const { credentials } = await client.refreshAccessToken()
    client.setCredentials(credentials)

    await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq('id', GOOGLE_TOKEN_ROW_ID)
  }

  return client
}

interface CreateEventParams {
  summary: string
  description: string
  startsAt: string
  endsAt: string
  attendeeEmail: string
  timezone: string
}

interface CalendarEventResult {
  eventId: string
  meetLink: string | null
}

/**
 * Create a Google Calendar event with Google Meet for a booking.
 * Returns the event ID and Meet link, or null if calendar is not configured.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CalendarEventResult | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return null

  try {
    const auth = await getAuthorizedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const { data } = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.startsAt, timeZone: params.timezone },
        end: { dateTime: params.endsAt, timeZone: params.timezone },
        attendees: [{ email: params.attendeeEmail }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    })

    const meetLink =
      data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video'
      )?.uri ?? null

    return { eventId: data.id ?? '', meetLink }
  } catch (error) {
    log('error', LOG_EVENT.GOOGLE_CALENDAR_CREATE_FAILED, {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Delete a Google Calendar event (for cancellations).
 */
export async function deleteCalendarEvent(eventId: string) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return

  try {
    const auth = await getAuthorizedClient()
    const calendar = google.calendar({ version: 'v3', auth })
    await calendar.events.delete({ calendarId, eventId })
  } catch (error) {
    log('error', LOG_EVENT.GOOGLE_CALENDAR_DELETE_FAILED, {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Batch-check Google Calendar availability for an entire day.
 * Returns busy time ranges as [start, end] tuples (ISO strings).
 * Returns empty array when GCal is not configured (all slots free).
 * Returns null when GCal is configured but auth/query fails (caller decides).
 */
export async function getDayBusyTimes(
  date: string,
  timezone: string
): Promise<Array<{ start: string; end: string }> | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return []

  try {
    const auth = await getAuthorizedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    // Build RFC3339 timestamps by resolving local midnight in the target timezone
    const dayStart = localToUtcIso(date, '00:00:00', timezone)
    const dayEnd = localToUtcIso(date, '23:59:59', timezone)

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart,
        timeMax: dayEnd,
        items: [{ id: calendarId }],
      },
    })

    return (data.calendars?.[calendarId]?.busy ?? []).map((b) => ({
      start: b.start ?? dayStart,
      end: b.end ?? dayEnd,
    }))
  } catch (error) {
    log('error', LOG_EVENT.GOOGLE_CALENDAR_FREEBUSY_FAILED, {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Convert a local date + time + IANA timezone to a UTC ISO 8601 string.
 * e.g. localToUtcIso('2026-03-09', '00:00:00', 'Europe/Paris') → '2026-03-08T23:00:00.000Z'
 */
function localToUtcIso(date: string, time: string, timezone: string): string {
  // Intl.DateTimeFormat gives us the UTC offset for the target timezone
  const fake = new Date(`${date}T${time}Z`)
  const utcStr = fake.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = fake.toLocaleString('en-US', { timeZone: timezone })
  const diffMs = new Date(utcStr).getTime() - new Date(tzStr).getTime()
  return new Date(fake.getTime() + diffMs).toISOString()
}
