import { APP_URL, BOOK_PATH } from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'
import { escapeHtml } from '@/lib/email/escape-html'

interface BookingConfirmationData {
  bookerName: string
  meetingType: string
  date: string
  time: string
  timezone: string
  durationMinutes: number
  bookingId: string
  bookerEmail: string
  meetLink: string | null
  locale: string
}

const LABELS = {
  en: {
    subject: 'Your booking is confirmed',
    greeting: (name: string) => `Hi ${name},`,
    confirmed: 'Your call is booked!',
    details: 'Meeting details',
    type: 'Type',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    minutes: 'minutes',
    meetLink: 'Google Meet',
    joinMeet: 'Join meeting',
    cancelText: 'Need to cancel or reschedule?',
    cancelLink: 'Cancel booking',
    footer: `${BRAND_NAME_DISPLAY} — Product thinking, tech depth, delivery instinct.`,
  },
  fr: {
    subject: 'Votre réservation est confirmée',
    greeting: (name: string) => `Bonjour ${name},`,
    confirmed: 'Votre appel est réservé !',
    details: 'Détails du rendez-vous',
    type: 'Type',
    date: 'Date',
    time: 'Heure',
    duration: 'Durée',
    minutes: 'minutes',
    meetLink: 'Google Meet',
    joinMeet: 'Rejoindre la réunion',
    cancelText: "Besoin d'annuler ou de reprogrammer ?",
    cancelLink: 'Annuler la réservation',
    footer: `${BRAND_NAME_DISPLAY} — Vision produit, expertise technique, instinct de livraison.`,
  },
} as const

export function bookingConfirmationSubject(locale: string) {
  return locale === 'fr' ? LABELS.fr.subject : LABELS.en.subject
}

export function bookingConfirmationHtml(data: BookingConfirmationData) {
  const l = data.locale === 'fr' ? LABELS.fr : LABELS.en
  const cancelUrl = `${APP_URL}${BOOK_PATH}/cancel?id=${data.bookingId}&email=${encodeURIComponent(data.bookerEmail)}`
  const meetRow = data.meetLink
    ? `<tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.meetLink}</td><td style="padding:6px 0;font-size:14px;"><a href="${data.meetLink}" style="color:#22d3ee;">${data.meetLink}</a></td></tr>`
    : ''
  const meetButton = data.meetLink
    ? `<div style="text-align:center;margin-top:20px;">
        <a href="${data.meetLink}" style="display:inline-block;background:#22d3ee;color:#0a0a0c;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none;">${l.joinMeet}</a>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#22d3ee;font-family:monospace;font-size:20px;font-weight:bold;">{FSH}</span>
    </div>
    <div style="background:#111113;border:1px solid #22d3ee30;border-radius:8px;padding:24px;">
      <p style="color:#e2e8f0;margin:0 0 8px;">${l.greeting(escapeHtml(data.bookerName))}</p>
      <p style="color:#22d3ee;font-size:18px;font-weight:600;margin:0 0 20px;">${l.confirmed}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.type}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${escapeHtml(data.meetingType)}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.date}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.date}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.time}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.time} (${data.timezone})</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.duration}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.durationMinutes} ${l.minutes}</td></tr>
        ${meetRow}
      </table>
    </div>
    ${meetButton}
    <div style="text-align:center;margin-top:20px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">${l.cancelText}</p>
      <a href="${cancelUrl}" style="color:#22d3ee;font-size:13px;">${l.cancelLink}</a>
    </div>
    <div style="text-align:center;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">
      <p style="color:#64748b;font-size:12px;margin:0;">${l.footer}</p>
    </div>
  </div>
</body>
</html>`
}
