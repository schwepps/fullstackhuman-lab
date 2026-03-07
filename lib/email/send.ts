import { createTransport, type Transporter } from 'nodemailer'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

let transport: Transporter | null = null

function getTransport(): Transporter {
  if (!transport) {
    transport = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transport
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email via SMTP (ImprovMX).
 * Fire-and-forget: logs errors but never throws.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const from = process.env.SMTP_FROM
  if (!from || !process.env.SMTP_HOST) {
    log('warn', LOG_EVENT.EMAIL_SEND_SKIPPED, {
      reason: 'SMTP not configured',
    })
    return
  }

  try {
    await getTransport().sendMail({ from, to, subject, html })
    log('info', LOG_EVENT.EMAIL_SENT, { to, subject })
  } catch (error) {
    log('error', LOG_EVENT.EMAIL_SEND_FAILED, {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
