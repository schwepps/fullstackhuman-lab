# FullStackHuman Lab — Development Guidelines

## Project Context

Public lab monorepo for FullStackHuman standalone projects. Each project lives in `projects/<name>/` with its own package.json.

Current projects:

- **turing-game** — Real-time multiplayer Turing test game
- **will-ai-survive** — Satirical app where AI evaluates workplace chaos survival
- **prompt-wars** — CTF-style game where players craft prompts to extract secrets from AI with 7 levels of defenses

---

## Monorepo Structure

```
projects/
  turing-game/       # Turing Game (Next.js + Partykit)
  will-ai-survive/   # Will AI Survive your job? (Next.js)
  prompt-wars/       # Prompt Wars — AI Security CTF (Next.js)
package.json         # Workspace root (delegates to projects)
pnpm-workspace.yaml  # Workspace config
```

---

## Turing Game

Real-time multiplayer game where players identify AI agents among humans. Players move around a 2D canvas, chat in proximity-based zones, and vote to eliminate suspected AIs.

### Tech Stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Framework | Next.js 16                                  |
| Language  | TypeScript                                  |
| Styling   | Tailwind CSS v4                             |
| AI        | Claude API (@anthropic-ai/sdk)              |
| Testing   | Vitest + Testing Library                    |
| Realtime  | Partykit (WebSockets on Cloudflare Workers) |
| 2D Canvas | Pixi.js 8                                   |
| Cache     | Upstash Redis                               |

### Route Architecture

```
projects/turing-game/
  app/
    layout.tsx              # Root layout (game HTML shell)
    page.tsx                # Lobby — create/join rooms
    [roomId]/page.tsx       # Game room — canvas, chat, voting
    [roomId]/reveal/page.tsx # Post-game reveal screen
    api/game/moderate/      # Internal moderation API (Partykit → Next.js)
    not-found.tsx           # 404 page
    globals.css             # Cyberpunk theme + CRT effects
  components/game/          # Game UI: canvas, chat, lobby, voting, reveal
  hooks/game/               # useGameSocket WebSocket hook
  lib/game/                 # Types, constants, agents, scoring, moderation
  lib/upstash.ts            # Upstash Redis client (rate limiting + room store)
  partykit/src/             # Partykit WebSocket server (Cloudflare Workers)
  tests/                    # Game tests
```

### Deployment

- **Next.js** — Vercel (game pages + moderation API)
- **Partykit** — Cloudflare Workers (WebSocket server, deployed separately)
- `NEXT_PUBLIC_PARTYKIT_HOST` connects the two

### Key Scripts (from projects/turing-game/)

| Script            | Description                           |
| ----------------- | ------------------------------------- |
| `dev`             | Start Next.js dev server              |
| `build`           | Build for production                  |
| `lint`            | Run ESLint                            |
| `typecheck`       | TypeScript type checking              |
| `test`            | Run tests (watch)                     |
| `test:run`        | Run tests once                        |
| `partykit:dev`    | Start Partykit dev server (port 1999) |
| `partykit:deploy` | Deploy Partykit to Cloudflare         |

### Coding Conventions

- **Prettier**: no semicolons, single quotes, trailing commas (es5)
- **English-only** — no i18n, no locale routing
- **No auth** — game is public, no Supabase

---

## Will AI Survive your job?

Users describe workplace chaos. AI (Claude Sonnet) evaluates whether it could survive — generating a chaos rating, mental breakdown timeline, and dramatic resignation letter. Results are streamed progressively via SSE. Shareable via LinkedIn/X with dynamic OG images.

### Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Framework | Next.js 16                  |
| Language  | TypeScript                  |
| Styling   | Tailwind CSS v4             |
| AI        | Claude API (Sonnet + Haiku) |
| Testing   | Vitest                      |
| Cache     | Upstash Redis               |
| OG Images | @vercel/og                  |

### Route Architecture

```
projects/will-ai-survive/
  app/
    layout.tsx              # Root layout (corporate dystopia theme)
    page.tsx                # Home — input form + streaming results
    not-found.tsx           # 404 page
    result/[id]/page.tsx    # Shareable result (SSR from Redis)
    api/evaluate/route.ts   # POST: stream evaluation via SSE
    api/og/route.tsx        # GET: dynamic OG image (1200x630)
    globals.css             # Corporate dystopia theme
  components/               # UI: input-form, result-card, chaos-meter, timeline, etc.
  hooks/                    # useEvaluation SSE client hook
  lib/                      # Types, constants, security, rate-limiter, evaluator, etc.
  tests/                    # Unit tests
```

### Deployment

- **Next.js** — Vercel
- Env vars: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Key Scripts (from projects/will-ai-survive/)

| Script      | Description              |
| ----------- | ------------------------ |
| `dev`       | Start Next.js dev server |
| `build`     | Build for production     |
| `lint`      | Run ESLint               |
| `typecheck` | TypeScript type checking |
| `test`      | Run tests (watch)        |
| `test:run`  | Run tests once           |

### Coding Conventions

- Same as turing-game: Prettier (no semis, single quotes, trailing commas)
- **English-only**, no auth
- Redis keys prefixed `fsh:wais:` (lab namespace `fsh:`, project `wais:`)

---

## Prompt Wars

CTF-style web app where players craft prompts to extract secrets from AI with 7 levels of increasingly hardened defenses (keyword filter → output validation → constitutional AI check → multi-model pipeline). Educational explainers after each win.

### Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Framework | Next.js 16                  |
| Language  | TypeScript                  |
| Styling   | Tailwind CSS v4             |
| AI        | Claude API (Haiku + Sonnet) |
| Testing   | Vitest                      |
| Cache     | Upstash Redis               |
| OG Images | @vercel/og                  |

### Route Architecture

```
projects/prompt-wars/
  app/
    layout.tsx              # Root layout (green terminal theme)
    page.tsx                # Landing — level select grid
    play/[levelId]/page.tsx # Play a level (core game loop)
    result/[id]/page.tsx    # Shareable result (SSR from Redis)
    leaderboard/page.tsx    # Anonymous leaderboard
    api/
      attempt/route.ts      # POST: SSE stream defense pipeline
      leaderboard/route.ts  # GET/POST: leaderboard
      og/route.tsx          # GET: dynamic OG image
    not-found.tsx
    globals.css             # Green terminal CRT theme
  components/               # UI: prompt, response, defense visualizer, victory/failure
  hooks/                    # useAttempt (SSE), useSession (localStorage)
  lib/                      # Types, constants, defense engine, levels, scoring
  tests/                    # Unit tests
```

### Deployment

- **Next.js** — Vercel
- Env vars: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Key Scripts (from projects/prompt-wars/)

| Script      | Description              |
| ----------- | ------------------------ |
| `dev`       | Start Next.js dev server |
| `build`     | Build for production     |
| `lint`      | Run ESLint               |
| `typecheck` | TypeScript type checking |
| `test`      | Run tests (watch)        |
| `test:run`  | Run tests once           |

### Coding Conventions

- Same as turing-game: Prettier (no semis, single quotes, trailing commas)
- **English-only**, no auth
- Redis keys prefixed `fsh:pw:` (lab namespace `fsh:`, project `pw:`)
