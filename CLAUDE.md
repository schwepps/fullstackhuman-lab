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

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 16                         |
| Language  | TypeScript                         |
| Styling   | Tailwind CSS v4 + shadcn/ui        |
| AI        | Claude API (+ built-in web search) |
| i18n      | next-intl v4                       |
| PDF       | @react-pdf/renderer                |
| Telegram  | Telegraf v4 (webhook bot)          |
| Testing   | Vitest + Testing Library           |
| Git Hooks | Husky + lint-staged + commitlint   |

---

## Route Architecture

```
app/[locale]/
  (marketing)/     # Public pages: homepage, privacy, terms, legal
  (chat)/          # Chat: persona selection → conversation → report
  (account)/       # Account settings + conversations library (auth required)
  (sharing)/       # Public report pages (no auth): /report/[token]
  (auth)/          # Login, signup, forgot/reset password
  api/
    chat/          # Streaming AI endpoint + quota check
    conversations/ # Conversation CRUD
    report/        # PDF generation
    telegram/      # Telegram bot webhook
components/
  report/          # Report template, sections, share button
  visuals/web/     # 7 SVG visual components (web)
  visuals/pdf/     # 7 react-pdf SVG visual components (PDF)
lib/
  ai/              # AI client, prompt assembly, conversation limits, tools
  conversations/   # Persistence (actions, queries)
  telegram/        # Bot handlers, services, formatting, i18n
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

## Detailed Standards & Workflow

@docs/claude/code-standards.md
@docs/claude/workflow-rules.md
