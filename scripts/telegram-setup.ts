/**
 * Register the Telegram webhook with BotFather.
 *
 * Usage: pnpm telegram:setup
 *
 * Requires TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and TELEGRAM_WEBHOOK_URL
 * in .env.local.
 */

const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const url = process.env.TELEGRAM_WEBHOOK_URL

if (!token || !secret || !url) {
  console.error(
    'Missing required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_WEBHOOK_URL'
  )
  process.exit(1)
}

async function setup() {
  const apiUrl = `https://api.telegram.org/bot${token}/setWebhook`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }),
  })

  const result = await response.json()

  if (result.ok) {
    console.log('Webhook registered successfully!')
    console.log(`  URL: ${url}`)
    console.log(`  Allowed updates: message, callback_query`)
  } else {
    console.error('Failed to register webhook:', result.description)
    process.exit(1)
  }
}

setup()
