# FullStackHuman Lab — Development Guidelines

## Project Context

Public lab monorepo for FullStackHuman standalone projects. Each project lives in `projects/<name>/` with its own package.json.

Current projects:

- **turing-game** — Real-time multiplayer Turing test game

---

## Monorepo Structure

```
projects/
  turing-game/       # Turing Game (Next.js + Partykit)
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
