import { createClient } from '@supabase/supabase-js'
import { SEED_CONVERSATIONS } from './data'

// ─── Config ───

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY
const SEED_EMAIL = 'seed@dev.local'
const SEED_PASSWORD = 'SeedDev123!'
const SEED_DISPLAY_NAME = 'Test User'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local'
  )
  process.exit(1)
}

// Safety: refuse to run against non-local Supabase instances
const isLocal =
  SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1')
if (!isLocal) {
  console.error(
    '🚨 SUPABASE_URL does not point to localhost. Refusing to seed a remote database.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ─── Main ───

async function seed() {
  console.log('🌱 Starting seed...\n')

  await cleanup()
  const userId = await createUser()
  await insertConversations(userId)

  console.log('\n✅ Seed complete.')
  console.log(`   Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`)
}

// ─── Cleanup ───

async function cleanup() {
  const { data } = await supabase.auth.admin.listUsers()
  const existing = data.users.find((u) => u.email === SEED_EMAIL)
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id)
    console.log('🗑  Deleted existing seed user (cascade)')
  }
}

// ─── User creation ───

async function createUser(): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: SEED_DISPLAY_NAME },
  })
  if (error || !data.user) {
    throw new Error(`Failed to create user: ${error?.message}`)
  }
  console.log(`👤 Created seed user: ${data.user.id}`)
  return data.user.id
}

// ─── Insert conversations and reports ───

async function insertConversations(userId: string) {
  for (const conv of SEED_CONVERSATIONS) {
    const title = extractTitle(conv.messages)

    const { data: row, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        persona: conv.persona,
        title,
        messages: conv.messages,
        has_report: !!conv.report,
        status: conv.status,
        message_count: conv.messages.length,
      })
      .select('id')
      .single()

    if (convError || !row) {
      throw new Error(`Failed to insert conversation: ${convError?.message}`)
    }

    if (conv.report) {
      const shareToken = crypto.randomUUID().replace(/-/g, '')
      const { error: reportError } = await supabase.from('reports').insert({
        conversation_id: row.id,
        persona: conv.persona,
        content: conv.report.content,
        share_token: shareToken,
        is_branded: conv.report.isBranded,
      })
      if (reportError) {
        throw new Error(`Failed to insert report: ${reportError.message}`)
      }
      console.log(
        `   📄 ${conv.persona} [${conv.status}] → /report/${shareToken}`
      )
    } else {
      console.log(`   💬 ${conv.persona} [${conv.status}] — no report`)
    }
  }
}

// ─── Utility ───

function extractTitle(
  messages: Array<{ role: string; content: string }>
): string | null {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return null
  return first.content.slice(0, 100)
}

// ─── Run ───

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
