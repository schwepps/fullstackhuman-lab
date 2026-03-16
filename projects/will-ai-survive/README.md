# Will AI Survive your job?

Users describe their workplace chaos. AI evaluates whether it could survive — generating a chaos rating, mental breakdown timeline, and dramatic resignation letter. Screenshot-optimized results for LinkedIn/X sharing.

## Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Framework | Next.js 16                     |
| Language  | TypeScript                     |
| Styling   | Tailwind CSS v4                |
| AI        | Claude API (@anthropic-ai/sdk) |
| Cache     | Upstash Redis                  |
| OG Images | @vercel/og                     |
| Testing   | Vitest                         |

## Setup

```bash
# From monorepo root
cp projects/will-ai-survive/.env.example projects/will-ai-survive/.env.local
# Fill in ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

pnpm install
pnpm --filter will-ai-survive dev
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

## Architecture

```
app/
  layout.tsx                  # Root layout (corporate dystopia theme)
  page.tsx                    # Home — input form + streaming results
  not-found.tsx               # 404 page
  result/[id]/page.tsx        # Shareable result (SSR from Redis)
  api/
    evaluate/route.ts         # POST: stream evaluation via SSE
    og/route.tsx              # GET: dynamic OG image (1200x630)
  globals.css                 # Corporate dystopia theme
components/
  input-form.tsx              # Textarea + Zod validation + example chips
  result-card.tsx             # Orchestrates all result sub-components
  chaos-meter.tsx             # Animated chaos rating bar (1-10)
  timeline.tsx                # Mental breakdown timeline with sanity levels
  resignation-letter.tsx      # Styled resignation letter on "paper" card
  share-buttons.tsx           # LinkedIn/X/copy/native share
hooks/
  use-evaluation.ts           # SSE client hook (progressive state)
lib/
  types.ts                    # EvaluationResult, TimelineEntry, SSE events
  constants.ts                # Rate limits, Redis keys, models, app config
  upstash.ts                  # Redis client singleton (Cloudflare adapter)
  security.ts                 # Input sanitization + unified Haiku gate
  rate-limiter.ts             # Per-IP + global rate limiting
  prompt-builder.ts           # System prompt + tool definitions for Claude
  evaluator.ts                # Streaming evaluation (tool use → SSE)
  result-store.ts             # Redis result storage + retrieval
  share-text.ts               # Pre-filled share text generators
```

## Deployment

1. Create a Vercel project pointing to this monorepo
2. Set root directory to `projects/will-ai-survive`
3. Set environment variables: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Deploy

## Rate Limits

| Scope               | Limit | Window   |
| ------------------- | ----- | -------- |
| Per IP, evaluations | 5     | 1 hour   |
| Per IP, daily       | 15    | 24 hours |
| Global evaluations  | 30    | 1 minute |

## Security

Three-layer defense with two AI calls total per request:

1. **Regex fast-path** — blocks known injection patterns (zero latency)
2. **Unified Haiku gate** — single AI call classifies input as SAFE/BLOCKED/INJECTION/OFFTOPIC (~200ms)
3. **Output guardrails** — system prompt constraints ensure humor targets situations, not people
