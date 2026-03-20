# Prompt Golf

Word golf for code — describe functions in natural language using the fewest words possible. AI writes the code, an AI judge evaluates it, and you learn prompt engineering through play.

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
cp projects/prompt-golf/.env.example projects/prompt-golf/.env.local
# Fill in ANTHROPIC_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

pnpm install
pnpm --filter prompt-golf dev
```

## Scripts

| Script      | Description                                           |
| ----------- | ----------------------------------------------------- |
| `dev`       | Start Next.js dev server                              |
| `build`     | Build for production                                  |
| `lint`      | Run ESLint                                            |
| `typecheck` | TypeScript type checking                              |
| `test`      | Run tests (watch)                                     |
| `test:run`  | Run tests once                                        |
| `reset`     | Reset all Redis data (leaderboard, results, attempts) |

## The Front 9 — Prompt Engineering Challenges

Each challenge teaches a distinct prompting principle validated against 2026 research.

| #   | Challenge        | Target | Principle                                         |
| --- | ---------------- | ------ | ------------------------------------------------- |
| 1   | Chunk Array      | 7      | AI knows common utility patterns by name          |
| 2   | Capitalize Words | 6      | Describe the output, not the steps                |
| 3   | Flatten Array    | 6      | Precision adjectives disambiguate behavior        |
| 4   | Debounce         | 6      | Domain vocabulary compresses intent               |
| 5   | Group By         | 6      | Describe behavior, not implementation             |
| 6   | Matrix Transpose | 7      | Show, don't tell — I/O examples beat descriptions |
| 7   | Immutable Update | 7      | Constraints narrow the solution space             |
| 8   | Memoize          | 5      | Domain names carry implicit specifications        |
| 9   | Pipe/Compose     | 6      | Jargon unlocks patterns language can't compress   |

## Game Flow

1. **Practice Mode** — 2 free tries to calibrate your language with the AI
2. **Scored Attempt** — AI generates code from your prompt, a judge evaluates it
3. **Score** = word count × attempt penalty (lower is better)
4. **Analysis** — key words, removable words, and tips parsed into visual chips
5. **Pro Prompt** — after a pass, see the optimal prompt + why it works
6. **Leaderboard** — auto-submitted after every win, per-hole best scores

## Architecture

```
app/
  layout.tsx                      # Root layout (golf course theme)
  page.tsx                        # Home — course map with progress
  play/[challengeId]/page.tsx     # Play a challenge
  result/[id]/page.tsx            # Shareable result (SSR from Redis)
  leaderboard/page.tsx            # Course rankings
  support/page.tsx                # Ko-fi donation page
  api/
    swing/route.ts                # POST: SSE stream (validate → generate → judge → analyze)
    leaderboard/route.ts          # GET: leaderboard rankings
    og/route.tsx                  # GET: dynamic OG image (prompt-centric)
  globals.css                     # Country club theme (greens, cream, gold, serif)
components/
  prompt-input.tsx                # Textarea with live word counter + color coding
  code-output.tsx                 # Streaming code display (fences stripped)
  swing-result.tsx                # Victory card + analysis chips + Pro Prompt
  course-map.tsx                  # Home page challenge grid with progress
  share-buttons.tsx               # LinkedIn, X, clipboard
  support-cta.tsx                 # Ko-fi CTA (inline + card)
hooks/
  use-swing.ts                    # SSE client (state machine)
  use-session.ts                  # localStorage session with per-hole progress
lib/
  types.ts                        # All types (challenges, scoring, SSE events)
  constants.ts                    # Redis keys, rate limits, models, costs
  challenges/                     # Challenge registry + definitions
    front-9/hole-1...hole-9.ts    # 9 challenge files with test cases + analyzerContext
  word-counter.ts                 # Unicode-aware tokenizer (NFKC normalized)
  anti-gaming.ts                  # Prompt validation (code detection)
  code-generator.ts               # Claude Haiku: prompt → TypeScript
  judge.ts                        # Hybrid: structural checks + Claude Sonnet
  swing-analyzer.ts               # Claude Haiku: analysis + optimalPrompt + concept
  scoring.ts                      # Word golf scoring (par, penalty, labels)
  rate-limiter.ts                 # IP + session rate limiting + budget + mulligans
  leaderboard-client.ts           # Per-hole Redis sorted set with auto-accumulation
  result-store.ts                 # Redis result persistence for sharing
  claude-client.ts                # Anthropic streaming client with retry
  upstash.ts                      # Redis client singleton
```

## Deployment

1. Create a Vercel project pointing to this monorepo
2. Set root directory to `projects/prompt-golf`
3. Set environment variables: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Deploy

## Rate Limits

| Scope                 | Limit | Window |
| --------------------- | ----- | ------ |
| Per IP, global        | 30    | 15 min |
| Per IP, per challenge | 8     | 15 min |
| Per IP, practice      | 6     | 15 min |

## Cost Controls

- Code generation uses Haiku (~$0.0003/call), judge uses Sonnet (~$0.003/call)
- ~$0.004 per scored attempt, ~$0.001 per practice
- Daily budget counter with warning at 2K and shutdown at 4K calls
- Kill switch: `DISABLE_API_CALLS=true`

## Reset leaderboard and results (for testing or restarting the game):

```bash
pnpm reset
```

Clears all Redis keys under `fsh:pg:*`. Remember to also clear `prompt-golf-session` from browser localStorage.
