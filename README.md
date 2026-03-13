# fsh-lab

Experiments by [François Schuers](https://fullstackhuman.sh) — engineer, product leader, AI practitioner.

This is not a product repo. It's a lab: a place to build fast, think out loud, and ship things that might become something — or might just be interesting.

---

## Philosophy

**Experiments, not products.**

Each project here starts as a question, not a roadmap. The constraint is intentional: no roadmap, no support SLA, no backwards compatibility promise. Just working code and honest documentation of what was learned.

If something gets traction, it earns its own repo. Until then, it lives here.

---

## Projects

### [turing-game](./projects/turing-game)

> A real-time multiplayer Turing test — spot the AI imposters among human players.

Built on Next.js, Partykit (WebSockets on Cloudflare Workers), Pixi.js, and Claude API. Players move around a 2D arena, chat with each other, and vote to identify the AI agents.

Status: `prototype`

---

## Stack defaults

Most experiments here share the same foundation:

- **Claude API** (Anthropic) — reasoning, generation
- **Next.js / Vercel** — when a frontend is needed
- **Upstash Redis** — when persistence is needed
- **pnpm workspaces** — monorepo management

Not a mandate. Just what's already running.

---

## Usage

Each project has its own README with setup instructions. Nothing here assumes a shared environment — every experiment is self-contained.

```bash
pnpm install          # install all workspace deps
pnpm dev              # run default project (turing-game)
pnpm -r build         # build all projects
pnpm -r lint          # lint all projects
pnpm -r typecheck     # typecheck all projects
pnpm -r test:run      # test all projects
```

---

## License

MIT. Fork freely, credit optionally, ship something.

---

_Part of the [fullstackhuman.sh](https://fullstackhuman.sh) universe — AI product strategy, without the filter._
