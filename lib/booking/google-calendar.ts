import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/service'
import { log } from '@/lib/logger'

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
export function getAuthorizationUrl() {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
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
      id: '00000000-0000-0000-0000-000000000001',
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
    log('error', 'google_token_store_failed', { error: error.message })
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
      .eq('id', '00000000-0000-0000-0000-000000000001')
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

/**
 * Create a Google Calendar event for a booking.
 * Returns the event ID or null if calendar is not configured.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<string | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return null

  try {
    const auth = await getAuthorizedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.startsAt, timeZone: params.timezone },
        end: { dateTime: params.endsAt, timeZone: params.timezone },
        attendees: [{ email: params.attendeeEmail }],
      },
    })

    return data.id ?? null
  } catch (error) {
    log('error', 'google_calendar_create_failed', {
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
    log('error', 'google_calendar_delete_failed', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Check Google Calendar availability using FreeBusy API.
 * Returns true if the time slot is free.
 */
export async function checkCalendarAvailability(
  start: string,
  end: string
): Promise<boolean> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return true

  try {
    const auth = await getAuthorizedClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: start,
        timeMax: end,
        items: [{ id: calendarId }],
      },
    })

    const busy = data.calendars?.[calendarId]?.busy ?? []
    return busy.length === 0
  } catch (error) {
    log('error', 'google_calendar_freebusy_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return true
  }
}
