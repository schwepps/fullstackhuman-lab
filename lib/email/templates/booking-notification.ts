import { APP_URL } from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY, FOUNDER_NAME } from '@/lib/constants/brand'

interface BookingNotificationData {
  bookerName: string
  bookerEmail: string
  bookerMessage: string | null
  meetingType: string
  date: string
  time: string
  timezone: string
  durationMinutes: number
  hasConversationContext: boolean
  bookingId: string
}

export function bookingNotificationSubject(data: BookingNotificationData) {
  return `New booking: ${data.meetingType} with ${data.bookerName}`
}

export function bookingNotificationHtml(data: BookingNotificationData) {
  const dashboardUrl = `${APP_URL}/admin/dashboard`
  const contextLine = data.hasConversationContext
    ? '<tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Context</td><td style="color:#22d3ee;padding:6px 0;font-size:14px;">AI conversation attached</td></tr>'
    : ''
  const messageLine = data.bookerMessage
    ? `<div style="margin-top:16px;padding:12px;background:#0a0a0c;border-radius:6px;border:1px solid #1e293b;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Message:</p>
        <p style="color:#e2e8f0;font-size:14px;margin:0;">${data.bookerMessage}</p>
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
      <p style="color:#22d3ee;font-size:18px;font-weight:600;margin:0 0 16px;">New booking!</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Name</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.bookerName}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Email</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;"><a href="mailto:${data.bookerEmail}" style="color:#22d3ee;">${data.bookerEmail}</a></td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Type</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.meetingType}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Date</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.date}</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Time</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.time} (${data.timezone})</td></tr>
        <tr><td style="color:#94a3b8;padding:6px 0;font-size:14px;">Duration</td><td style="color:#e2e8f0;padding:6px 0;font-size:14px;">${data.durationMinutes} min</td></tr>
        ${contextLine}
      </table>
      ${messageLine}
    </div>
    <div style="text-align:center;margin-top:20px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#22d3ee;color:#0a0a0c;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;">View in dashboard</a>
    </div>
    <div style="text-align:center;margin-top:32px;border-top:1px solid #1e293b;padding-top:16px;">
      <p style="color:#64748b;font-size:12px;margin:0;">${BRAND_NAME_DISPLAY} — ${FOUNDER_NAME}</p>
    </div>
  </div>
</body>
</html>`
}
