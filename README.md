# Full Stack Human

AI consulting tool that productizes a product & tech leader's expertise through three AI personas. Users select a path, the AI runs a structured conversation, and generates a professional shareable report designed to drive consulting bookings.

> The AI is not the end product. It's the proof of concept that makes consulting tangible and sellable. Every free-tier report with branding is distribution.

## How it works

| Persona    | Trigger                        | Verb      | Output                    |
| ---------- | ------------------------------ | --------- | ------------------------- |
| The Doctor | "My project is stuck"          | Diagnoses | Project Diagnostic Report |
| The Critic | "I need a second opinion"      | Reviews   | Review Brief              |
| The Guide  | "Just curious what you can do" | Reframes  | Framework Brief           |

Each persona follows a structured intake flow (warm opening, targeted questions, sharp pivot) then generates a branded report with visual components (radar charts, risk gauges, priority matrices, flow diagrams, spectrum visualizations).

Reports are shareable via public URLs and exportable as PDF.

## Tech stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16                                  |
| Language      | TypeScript                                  |
| Styling       | Tailwind CSS v4 + shadcn/ui                 |
| AI            | Claude API (Anthropic SDK)                  |
| Auth          | Supabase Auth (email + Google OAuth)        |
| Database      | Supabase (PostgreSQL + RLS)                 |
| Rate limiting | Upstash Redis (sliding window)              |
| i18n          | next-intl v4 (French default, English)      |
| PDF           | @react-pdf/renderer                         |
| Analytics     | PostHog (consent-gated)                     |
| Testing       | Vitest + Testing Library                    |
| Git hooks     | Husky + lint-staged + commitlint            |
| Realtime      | Partykit (WebSockets on Cloudflare Workers) |
| 2D Canvas     | Pixi.js 8                                   |

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (for local DB)
- [Anthropic API key](https://console.anthropic.com/settings/keys)
- [Partykit](https://docs.partykit.io/) (for Turing Game — `npx partykit dev` runs automatically)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd fullstackhuman
pnpm install

# Start local Supabase (Docker required)
pnpm supabase:start

# Configure environment
cp .env.example .env.local
# Fill in values from Supabase local output + your Anthropic key

# Seed dev database (optional — creates test user with sample conversations)
pnpm seed

# Start dev server
pnpm dev

# (Optional) Start Partykit for the Turing Game
pnpm partykit:dev
```

After seeding, log in with `seed@dev.local` / `SeedDev123!` to see 9 sample conversations covering all personas and visual components.

### Local Supabase URLs

After `pnpm supabase:start`, these are available at their default ports:

| Service     | URL                    | Description                                       |
| ----------- | ---------------------- | ------------------------------------------------- |
| Studio      | http://127.0.0.1:54323 | Database GUI, table editor, SQL runner            |
| Mailpit     | http://127.0.0.1:54324 | Email inbox for auth emails (confirmation, reset) |
| Project API | http://127.0.0.1:54321 | REST + Auth API (used by the app)                 |

Run `pnpm supabase:status` to see actual ports if they differ from defaults.

### Environment variables

See [`.env.example`](.env.example) for all variables with descriptions. Required for local dev:

| Variable                               | Source                                                               |
| -------------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `pnpm supabase:status`                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `pnpm supabase:status`                                               |
| `SUPABASE_SECRET_KEY`                  | `pnpm supabase:status`                                               |
| `ANTHROPIC_API_KEY`                    | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

Optional: `NEXT_PUBLIC_APP_URL` (default: `https://fullstackhuman.sh` — set to `http://localhost:3000` for local dev), PostHog (`NEXT_PUBLIC_POSTHOG_KEY`), Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Rate limiting falls back to in-memory without Redis.

## Project structure

```
app/
  [locale]/
    (marketing)/        # Landing page, legal pages
    (chat)/             # Persona selection, chat, conversation viewer
    (account)/          # Account settings, conversations library
    (sharing)/          # Public report pages (no auth)
    (auth)/             # Login, signup, password reset
  api/
    chat/               # Streaming chat + quota endpoint
    conversations/      # Conversation CRUD
    report/[token]/pdf/ # PDF generation
components/
  ui/                   # shadcn/ui primitives
  chat/                 # Chat interface components
  report/               # Report template, sections, visuals
  visuals/web/          # 7 SVG visual components (web)
  visuals/pdf/          # 7 SVG visual components (react-pdf)
  marketing/            # Landing page components
  auth/                 # Auth forms
  account/              # Account management
  shared/               # Cross-route components
prompts/                # Production AI prompts (sent to API)
messages/               # i18n translations (fr.json, en.json)
lib/
  ai/                   # Client, prompt assembly
  auth/                 # Actions, schemas, types (SSOT)
  conversations/        # Persistence actions + queries
  reports/              # Report persistence
  visuals/              # Visual types, validators, geometry
  pdf/                  # PDF document assembly
  seo/                  # JSON-LD schema generators
  supabase/             # Client variants (browser, server, service)
  hooks/                # Custom React hooks
  constants/            # App constants
docs/                   # Design documentation (reference only)
scripts/                # Quality checks + seed script
tests/                  # Test suite
app/game/               # Turing Game (outside [locale] — no i18n)
  api/game/moderate/    # Internal moderation endpoint
components/game/        # Game UI: canvas, chat, lobby, voting, reveal
lib/game/               # Game logic: types, constants, agents, scoring
partykit/               # Partykit WebSocket server (Cloudflare Workers)
```

## Scripts

| Command                | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`             | Start development server                                                      |
| `pnpm build`           | Production build                                                              |
| `pnpm lint`            | ESLint checks                                                                 |
| `pnpm typecheck`       | TypeScript type checking                                                      |
| `pnpm test`            | Run tests (watch mode)                                                        |
| `pnpm test:run`        | Run tests once                                                                |
| `pnpm seed`            | Seed dev database with test data                                              |
| `pnpm pre-review`      | All quality checks (i18n, auth strings, SEO, duplication, lint, types, tests) |
| `pnpm partykit:dev`    | Start Partykit dev server (WebSocket, port 1999)                              |
| `pnpm partykit:deploy` | Deploy Partykit to Cloudflare Workers                                         |
| `pnpm db:reset`        | Reset local Supabase database                                                 |

### Quality checks (included in `pre-review`)

| Check                | What it catches                                      |
| -------------------- | ---------------------------------------------------- |
| `check:i18n`         | Missing/extra keys between fr.json and en.json       |
| `check:auth-strings` | Magic auth string literals (must use SSOT constants) |
| `check:seo`          | SEO data consistency (personas, URLs, schemas)       |
| `check:duplicates`   | Copy-paste code detection (jscpd)                    |

## Architecture decisions

**Prompt assembly** — System prompt is assembled per conversation: `system-prompt-core.md` + persona-specific prompt. One persona per conversation, never mixed.

**Report detection** — Reports are detected by emoji-prefixed heading patterns in the AI's streamed response. The parser extracts sections and visual components automatically.

**Visual system** — 7 visual types split into prompt-driven (AI authors JSON in fenced code blocks) and template-driven (auto-detected from markdown patterns like tables and numbered lists). Shared geometry layer for web SVG and react-pdf SVG rendering.

**Auth model** — Three tiers: anonymous (3/day, localStorage), free account (15/month, DB), paid (unlimited). Reports persist in a separate table with public read access via share token.

**Turing Game** — Real-time multiplayer game where players identify AI agents among humans. Built on Partykit (WebSocket server on Cloudflare Workers) with Pixi.js 2D canvas. Separate service from Next.js, communicating via WebSocket (client↔Partykit) and HTTP (Partykit→Next.js moderation). See [`.claude/TURING_GAME_BRIEF.md`](.claude/TURING_GAME_BRIEF.md) for the full technical spec.

**i18n** — French default (clean URLs), English prefixed (`/en/`). AI responses are not translated via i18n — the AI handles language detection and responds in the user's language.

## Deployment

The main app deploys to **Vercel** (auto-deploy on push). The Turing Game adds a second service — **Partykit** on Cloudflare Workers — deployed separately.

### Two-service architecture

| Service                   | Platform           | Deploy method                   |
| ------------------------- | ------------------ | ------------------------------- |
| Next.js app               | Vercel             | `git push` (auto)               |
| Partykit WebSocket server | Cloudflare Workers | `pnpm partykit:deploy` (manual) |

### Production setup

#### 1. Generate shared secret

```bash
openssl rand -hex 32
```

#### 2. Deploy Partykit (first)

```bash
pnpm partykit:deploy
```

Outputs your host URL (e.g. `turing-game.your-username.partykit.dev`). First deploy prompts Cloudflare login.

Set Partykit env vars:

```bash
npx partykit env add ANTHROPIC_API_KEY     # same key as Vercel
npx partykit env add GAME_INTERNAL_TOKEN   # shared secret from step 1
npx partykit env add NEXTJS_URL            # https://fullstackhuman.sh
```

#### 3. Set Vercel env vars

| Variable                    | Value                                    |
| --------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | `turing-game.your-username.partykit.dev` |
| `GAME_INTERNAL_TOKEN`       | Same shared secret as Partykit           |

`ANTHROPIC_API_KEY` and other vars should already be set on Vercel.

#### 4. Deploy Next.js

Push to main — Vercel auto-deploys.

#### 5. Verify

- Visit `/game` — create a room, check WebSocket connects
- Send a chat message — moderation works (Partykit→Next.js via `NEXTJS_URL/api/game/moderate`)
- AI agents respond (Partykit uses `ANTHROPIC_API_KEY` via `lib/game/model-registry.ts`)

> **Note:** Deploy Partykit first to get the host URL for `NEXT_PUBLIC_PARTYKIT_HOST`. After initial setup, the two services can be updated independently as long as the WebSocket protocol doesn't change.

## Conventions

- **Commits**: `type(scope): description` ([commitlint conventional](https://www.conventionalcommits.org/))
- **Branches**: `feat/*`, `fix/*`, `chore/*`
- **Files**: kebab-case. Components: PascalCase. Functions: camelCase
- **Styling**: Theme tokens only (`bg-primary`, `text-success`), never hardcoded colors
- **Forms**: Zod validation with `.trim().min(1)` on strings, httpUrl refinement on URLs
- **Server actions**: Rate limit, validate, authenticate, check identity, return typed codes
- **Hooks**: Wrap returned functions in `useCallback`, objects in `useMemo`

See [`docs/claude/code-standards.md`](docs/claude/code-standards.md) and [`docs/claude/workflow-rules.md`](docs/claude/workflow-rules.md) for the full development guide.

## License

Proprietary. All rights reserved.
