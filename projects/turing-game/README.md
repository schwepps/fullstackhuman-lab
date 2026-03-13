# Turing Game

A real-time multiplayer Turing test. Players join a 2D arena, chat with each other, and vote to identify the AI agents hiding among them. Built with Next.js, Partykit (WebSockets on Cloudflare Workers), Pixi.js for canvas rendering, and Claude API for AI agent behavior.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Anthropic API key
- Upstash Redis instance

## Setup

```bash
# From repo root
pnpm install

# Configure environment
cp projects/turing-game/.env.example projects/turing-game/.env
# Fill in your API keys

# Start dev servers
pnpm dev                                        # Next.js (port 3000)
pnpm --filter turing-game partykit:dev           # Partykit (port 1999)
```

## Scripts

| Script            | Description                           |
| ----------------- | ------------------------------------- |
| `dev`             | Start Next.js dev server              |
| `build`           | Production build                      |
| `lint`            | ESLint check                          |
| `typecheck`       | TypeScript type check                 |
| `test`            | Run tests (watch mode)                |
| `test:run`        | Run tests once                        |
| `partykit:dev`    | Start Partykit dev server             |
| `partykit:deploy` | Deploy Partykit to Cloudflare Workers |

## Deployment

- **Next.js**: Vercel (set env vars in project settings)
- **Partykit**: Cloudflare Workers (`pnpm --filter turing-game partykit:deploy`)

Both services deploy independently.
