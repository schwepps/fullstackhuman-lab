/**
 * Reset all Prompt Golf Redis data (leaderboard, results, rate limits, attempts).
 * Usage: pnpm reset
 */
import * as readline from 'node:readline'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  console.error(
    'Error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in .env.local'
  )
  process.exit(1)
}

// Confirmation guard — prevent accidental production wipes
const skipConfirm = process.argv.includes('--force')
if (!skipConfirm) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const answer = await new Promise<string>((resolve) =>
    rl.question(
      `Delete ALL Prompt Golf data from ${url}? (type YES): `,
      resolve
    )
  )
  rl.close()
  if (answer !== 'YES') {
    console.log('Aborted.')
    process.exit(0)
  }
}

const redis = new Redis({ url, token })

const PATTERNS = [
  'fsh:pg:leaderboard:*',
  'fsh:pg:result:*',
  'fsh:pg:best:*',
  'fsh:pg:attempts:*',
  'fsh:pg:global:*',
  'fsh:pg:mulligans:*',
  'fsh:pg:budget:*',
]

async function deleteByPattern(pattern: string): Promise<number> {
  let cursor = 0
  let deleted = 0
  do {
    const [next, keys] = await redis.scan(cursor as number, {
      match: pattern,
      count: 100,
    })
    cursor = Number(next)
    if (keys.length > 0) {
      const pipeline = redis.pipeline()
      for (const key of keys) pipeline.del(key as string)
      await pipeline.exec()
      deleted += keys.length
    }
  } while (Number(cursor) !== 0)
  return deleted
}

async function main() {
  console.log('Resetting Prompt Golf Redis data...\n')

  for (const pattern of PATTERNS) {
    const count = await deleteByPattern(pattern)
    console.log(`  DEL ${pattern} → ${count} keys`)
  }

  console.log('\nDone.')
  console.log(
    '\nNOTE: Clear browser localStorage to reset client-side progress.' +
      "\n  → DevTools → Application → Local Storage → delete 'prompt-golf-session'"
  )
}

main().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})
