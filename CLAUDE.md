# Full Stack Human — Development Guidelines

## Project Context

AI consulting tool that productizes François (product & tech leader, 15+ years) through three personas. Users select a path, the AI runs a structured conversation, and generates a shareable report. The AI is a proof of concept that drives consulting bookings.

| Persona       | Trigger                        | Verb      | Output                    |
| ------------- | ------------------------------ | --------- | ------------------------- |
| The Doctor 🩺 | "My project is stuck"          | Diagnoses | Project Diagnostic Report |
| The Critic 🔍 | "I need a second opinion"      | Reviews   | Review Brief              |
| The Guide 🧭  | "Just curious what you can do" | Reframes  | Framework Brief           |

**Product vision & business model:** `@docs/product-concept.md`
**Persona overview & shared design rules:** `@docs/persona-design.md`

---

## Prompt Architecture

System prompt is assembled dynamically per conversation:

```
system_prompt = prompts/system-prompt-core.md + prompts/prompt-[persona].md
```

Never send all three persona files at once. One persona per conversation.

| File                            | Purpose                                              | When sent                                 |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `prompts/system-prompt-core.md` | François's identity, expertise, tone, shared rules   | Always                                    |
| `prompts/prompt-doctor.md`      | Doctor flow: opening, intake, pivot, report template | User picks "My project is stuck"          |
| `prompts/prompt-critic.md`      | Critic flow: opening, intake, pivot, report template | User picks "I need a second opinion"      |
| `prompts/prompt-guide.md`       | Guide flow: opening, intake, pivot, report template  | User picks "Just curious what you can do" |

**Token budget:** ~5,200–5,900 tokens per assembled prompt.

### Design docs (reference only — not sent to API)

Full specs with design rationale, stress test scenarios, and golden-path validations:

| File                     | Content                             |
| ------------------------ | ----------------------------------- |
| `docs/persona-doctor.md` | Doctor design spec — 4 golden paths |
| `docs/persona-critic.md` | Critic design spec — 4 golden paths |
| `docs/persona-guide.md`  | Guide design spec — 4 golden paths  |

---

## Product Rules

- **AI sends first message** — user never sees an empty chat
- **One persona per conversation** — no mid-conversation switching. Suggest and link to new conversation.
- **Reports detected by heading pattern** (`# Project Diagnostic Report` / `# Review Brief` / `# Framework Brief`) — render as cards, not inline chat
- **All outputs include booking CTA** in footer
- **Respond in user's language** — French ↔ English
- **Free tier outputs include branding** — every shared report is distribution
- **Telegram bot mirrors web experience** — same personas, same prompts, same report quality. Reports shared via the same `/report/{token}` URLs
- **Conversation depth limit: 15 user turns max** — 3-phase wrap-up (normal → wrap-up → force report) ensures every conversation produces a report. Shared logic in `lib/ai/conversation-limits.ts`.
- **Web search** — opt-in via `ANTHROPIC_ENABLE_WEB_SEARCH=true`. Uses Anthropic's built-in `web_search_20260209` server-side tool (max 2 searches/request). AI searches only for unknown tools/products, never for general strategy. Config in `lib/ai/tools.ts`, constant in `lib/constants/chat.ts`.

---

## Tech Stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Framework | Next.js 16                                  |
| Language  | TypeScript                                  |
| Styling   | Tailwind CSS v4 + shadcn/ui                 |
| AI        | Claude API (+ built-in web search)          |
| i18n      | next-intl v4                                |
| PDF       | @react-pdf/renderer                         |
| Email     | nodemailer (ImprovMX SMTP)                  |
| Calendar  | Google Calendar API (googleapis)            |
| Telegram  | Telegraf v4 (webhook bot)                   |
| Testing   | Vitest + Testing Library                    |
| Git Hooks | Husky + lint-staged + commitlint            |
| Realtime  | Partykit (WebSockets on Cloudflare Workers) |
| 2D Canvas | Pixi.js 8                                   |

---

## Route Architecture

```
app/[locale]/
  (marketing)/     # Public pages: homepage, privacy, terms, legal
  (chat)/          # Chat: persona selection → conversation → report
  (booking)/       # Public booking flow: /book (no auth required)
  (admin)/         # Admin dashboard + availability settings (is_admin guard)
  (account)/       # Account settings + conversations library (auth required)
  (sharing)/       # Public report pages (no auth): /report/[token]
  (auth)/          # Login, signup, forgot/reset password
  api/
    chat/          # Streaming AI endpoint + quota check
    conversations/ # Conversation CRUD
    report/        # PDF generation
    telegram/      # Telegram bot webhook
    booking/       # Booking creation + slot availability + Google OAuth
    game/moderate/ # Internal moderation API (Partykit→Next.js, token-secured)
components/
  booking/         # Multi-step booking form components
  admin/           # Admin dashboard, meeting cards, availability form
  report/          # Report template, sections, share button
  visuals/web/     # 7 SVG visual components (web)
  visuals/pdf/     # 7 react-pdf SVG visual components (PDF)
lib/
  ai/              # AI client, prompt assembly, conversation limits, tools
  booking/         # Booking logic: slots, actions, admin queries, Google Calendar, briefing
  conversations/   # Persistence (actions, queries)
  email/           # SMTP client + email templates (confirmation, notification, cancellation)
  telegram/        # Bot handlers, services, formatting, i18n
  game/            # Turing Game: types, constants, agents, scoring, moderation
app/game/          # Turing Game pages (outside [locale] — no i18n, no auth)
components/
  game/            # Game UI: canvas, chat, lobby, voting, reveal
partykit/          # Partykit WebSocket server (deployed separately to Cloudflare Workers)
```

---

## Key Scripts

| Script                 | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `dev`                  | Start development server                                                           |
| `build`                | Build for production                                                               |
| `lint`                 | Run ESLint checks                                                                  |
| `lint:fix`             | Fix ESLint issues                                                                  |
| `typecheck`            | TypeScript type checking                                                           |
| `format`               | Format with Prettier                                                               |
| `format:check`         | Check formatting                                                                   |
| `test`                 | Run tests (watch mode)                                                             |
| `test:run`             | Run tests once                                                                     |
| `check:seo`            | SEO/discovery data consistency (personas, URLs, schemas)                           |
| `check:service-client` | CI guard: verify no unauthorized service client imports                            |
| `telegram:setup`       | Register Telegram webhook with BotFather                                           |
| `pre-review`           | All quality checks (i18n parity, auth strings, SEO, jscpd, lint, typecheck, tests) |
| `partykit:dev`         | Start Partykit dev server (port 1999)                                              |
| `partykit:deploy`      | Deploy Partykit to Cloudflare Workers                                              |

---

## Coding Conventions

- **Prettier**: no semicolons, single quotes, trailing commas (es5)

---

## Internationalization

- **Default locale**: French (`fr`) — clean URLs, no prefix
- **Secondary locale**: English (`en`) — prefixed with `/en/`
- **Routing**: `as-needed` prefix strategy via `next-intl`
- **Translations**: JSON files in `messages/` with ICU syntax
- **SSOT**: Locale list in `i18n/routing.ts` only
- **Server Components**: `getTranslations()` from `next-intl/server`
- **Client Components**: `useTranslations()` from `next-intl`
- **No hardcoded user-facing strings** — all text in `messages/*.json`
- **TypeScript**: Translation keys type-checked via `global.d.ts`
- **Adding a new string**: add to BOTH `messages/fr.json` and `messages/en.json`
- **Links**: use `Link` from `@/i18n/routing`, not `next/link`
- **Chat messages from AI are NOT translated via i18n** — the AI handles language switching itself based on user's language

---

## Turing Game

Real-time multiplayer game where players identify AI agents among humans. Separate service architecture: Partykit (WebSocket server on Cloudflare Workers) + Next.js (game pages + moderation API). Deployed independently from the main Vercel deployment.

**Full technical spec:** `.claude/TURING_GAME_BRIEF.md`

**Key constraints:**

- Game routes (`app/game/`) live outside `[locale]` — no i18n, no Supabase auth
- Partykit server shares types from `lib/game/types.ts` with Next.js
- AI agents use the same `ANTHROPIC_API_KEY` as the consulting tool

---

## Detailed Standards & Workflow

@docs/claude/code-standards.md
@docs/claude/workflow-rules.md
