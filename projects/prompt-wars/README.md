# Prompt Wars

A CTF-style game where players craft prompts to extract secrets from AI systems with 7 levels of increasingly hardened defenses. Educational explainers after each win teach real-world AI security concepts.

## Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Framework | Next.js 16                  |
| Language  | TypeScript                  |
| Styling   | Tailwind CSS v4             |
| AI        | Claude API (Haiku + Sonnet) |
| Cache     | Upstash Redis               |
| OG Images | @vercel/og                  |
| Testing   | Vitest                      |

## Setup

```bash
# From monorepo root
cp projects/prompt-wars/.env.example projects/prompt-wars/.env.local
# Fill in ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

pnpm install
pnpm --filter prompt-wars dev
```

## Scripts

| Script      | Description              |
| ----------- | ------------------------ |
| `dev`       | Start Next.js dev server |
| `build`     | Build for production     |
| `lint`      | Run ESLint               |
| `typecheck` | TypeScript type checking |
| `test`      | Run tests (watch)        |
| `test:run`  | Run tests once           |

## Defense Levels

| Level | Name                 | Defense                                                   | Model  |
| ----- | -------------------- | --------------------------------------------------------- | ------ |
| 1     | Naive Guard          | System prompt says "don't reveal"                         | Haiku  |
| 2     | Keyword Shield       | + Input keyword blocklist                                 | Haiku  |
| 3     | Output Scanner       | + Output validation (detect secret in response)           | Haiku  |
| 4     | Layered Fortress     | + Multi-layer system prompts with roleplay refusal        | Haiku  |
| 5     | Prompt Sandwich      | + User input wrapped between security reminders           | Haiku  |
| 6     | Constitutional Guard | + 2nd AI call reviews response for leaks                  | Sonnet |
| 7     | Maximum Security     | + Input classifier + semantic analysis (5-stage pipeline) | Sonnet |

## Architecture

```
app/
  layout.tsx                  # Root layout (green terminal CRT theme)
  page.tsx                    # Landing — level select grid
  play/[levelId]/page.tsx     # Play a level (core game loop)
  result/[id]/page.tsx        # Shareable result (SSR from Redis)
  leaderboard/page.tsx        # Anonymous leaderboard
  api/
    attempt/route.ts          # POST: SSE stream defense pipeline + response
    leaderboard/route.ts      # GET/POST: leaderboard (Redis sorted set)
    og/route.tsx              # GET: dynamic OG image (1200x630)
  globals.css                 # Green terminal theme (CRT scanlines, glitch)
components/
  terminal-prompt.tsx         # Input with blinking cursor + char count
  ai-response.tsx             # SSE streaming response display
  defense-visualizer.tsx      # Real-time pipeline stage visualization
  victory-screen.tsx          # ASCII art + score + share buttons
  failure-feedback.tsx        # Red flash + blocked stage + defense log
  defense-explainer.tsx       # Post-win educational modal
  hint-panel.tsx              # Progressive hints (unlock at 3/7/12 fails)
  attempt-history.tsx         # Past attempts with failure reasons
  share-buttons.tsx           # LinkedIn, X, clipboard
  level-card.tsx              # Level selector (locked/available/completed)
  leaderboard-table.tsx       # Leaderboard rankings
hooks/
  use-attempt.ts              # SSE client hook (state machine)
  use-session.ts              # localStorage session management
lib/
  types.ts                    # All types (DefenseStageResult, SSE events, etc.)
  constants.ts                # Secrets, rate limits, scoring, hints
  defense-engine.ts           # Core pipeline executor (per-stage results)
  secret-checker.ts           # Flexible leak detection (exact, separated, reversed)
  claude-client.ts            # Claude API wrapper with streaming + retry
  rate-limiter.ts             # Per-IP + per-level + budget rate limiting
  scoring.ts                  # Score calculation (base + efficiency + first-try)
  result-store.ts             # Redis result persistence for sharing
  upstash.ts                  # Redis client singleton
  levels/
    index.ts                  # Level registry
    level-1-naive.ts ... level-7-multi-model.ts
```

## Deployment

1. Create a Vercel project pointing to this monorepo
2. Set root directory to `projects/prompt-wars`
3. Set environment variables: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Deploy

## Rate Limits

| Scope              | Limit | Window |
| ------------------ | ----- | ------ |
| Per IP, global     | 30    | 15 min |
| Per IP, per level  | 10    | 15 min |
| Per IP, levels 6-7 | 5     | 15 min |

## Cost Controls

- Levels 1-5 use Haiku (~$0.001/attempt), levels 6-7 use Sonnet (~$0.01/attempt)
- Daily budget counter with auto-degradation: >5K calls/day disables levels 6-7, >10K enters maintenance mode
- Kill switch: `DISABLE_API_CALLS=true`
- Estimated cost at 1K daily visitors: ~$10/day

## Reset leaderboard and results (for testing or restarting the game):

```bash
npx @upstash/cli redis del fsh:pw:leaderboard
npx @upstash/cli redis del "fsh:pw:result:*"
npx @upstash/cli redis del "fsh:pw:win:*"
npx @upstash/cli redis del "fsh:pw:attempts:*"
npx @upstash/cli redis del "fsh:pw:leaderboard:idx:*"
```
