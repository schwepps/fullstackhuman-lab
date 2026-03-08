import { APP_URL, BOOK_PATH } from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'
import { escapeHtml } from '@/lib/email/escape-html'

interface BookingCancellationData {
  recipientName: string
  meetingType: string
  date: string
  time: string
  timezone: string
  cancellationReason: string | null
  locale: string
}

const LABELS = {
  en: {
    subjectBooker: 'Your booking has been cancelled',
    subjectAdmin: (name: string) => `Booking cancelled: ${name}`,
    greeting: (name: string) => `Hi ${name},`,
    cancelled: 'Your booking has been cancelled.',
    details: 'Cancelled meeting',
    type: 'Type',
    date: 'Date',
    time: 'Time',
    reason: 'Reason',
    rebookText: 'Want to reschedule?',
    rebookLink: 'Book a new time',
    footer: `${BRAND_NAME_DISPLAY} — Product thinking, tech depth, delivery instinct.`,
  },
  fr: {
    subjectBooker: 'Votre réservation a été annulée',
    subjectAdmin: (name: string) => `Réservation annulée : ${name}`,
    greeting: (name: string) => `Bonjour ${name},`,
    cancelled: 'Votre réservation a été annulée.',
    details: 'Rendez-vous annulé',
    type: 'Type',
    date: 'Date',
    time: 'Heure',
    reason: 'Raison',
    rebookText: 'Envie de reprogrammer ?',
    rebookLink: 'Réserver un nouveau créneau',
    footer: `${BRAND_NAME_DISPLAY} — Vision produit, expertise technique, instinct de livraison.`,
  },
} as const

export function bookingCancellationBookerSubject(locale: string) {
  return locale === 'fr' ? LABELS.fr.subjectBooker : LABELS.en.subjectBooker
}

export function bookingCancellationAdminSubject(
  bookerName: string,
  locale: string
) {
  const safeName = bookerName.replace(/[\r\n]/g, '').slice(0, 50)
  return locale === 'fr'
    ? LABELS.fr.subjectAdmin(safeName)
    : LABELS.en.subjectAdmin(safeName)
}

export function bookingCancellationHtml(data: BookingCancellationData) {
  const l = data.locale === 'fr' ? LABELS.fr : LABELS.en
  const bookUrl = `${APP_URL}${BOOK_PATH}`
  const reasonRow = data.cancellationReason
    ? `<tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.reason}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${escapeHtml(data.cancellationReason)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#22d3ee;font-family:monospace;font-size:20px;font-weight:bold;">{FSH}</span>
    </div>
    <div style="background:#111113;border:1px solid #ef444430;border-radius:8px;padding:24px;">
      <p style="color:#e2e8f0;margin:0 0 8px;">${l.greeting(escapeHtml(data.recipientName))}</p>
      <p style="color:#ef4444;font-size:18px;font-weight:600;margin:0 0 20px;">${l.cancelled}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.type}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${escapeHtml(data.meetingType)}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.date}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${escapeHtml(data.date)}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">${l.time}</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${escapeHtml(data.time)} (${escapeHtml(data.timezone)})</td></tr>
        ${reasonRow}
      </table>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">${l.rebookText}</p>
      <a href="${bookUrl}" style="color:#22d3ee;font-size:13px;">${l.rebookLink}</a>
    </div>
    <div style="text-align:center;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">
      <p style="color:#64748b;font-size:12px;margin:0;">${l.footer}</p>
    </div>
  </div>
</body>
</html>`
}
