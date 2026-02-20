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
- **Reports detected by heading pattern** (`# 🩺` / `# 🔍` / `# 🧭`) — render as cards, not inline chat
- **All outputs include Calendly CTA** in footer
- **Respond in user's language** — French ↔ English
- **Free tier outputs include branding** — every shared report is distribution

---

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16                       |
| Language  | TypeScript                       |
| Styling   | Tailwind CSS v4 + shadcn/ui      |
| AI        | Claude API                       |
| i18n      | next-intl v4                     |
| Testing   | Vitest + Testing Library         |
| Git Hooks | Husky + lint-staged + commitlint |

---

## Architecture

```
app/
  [locale]/
    (marketing)/        # Public marketing pages
      page.tsx          # Homepage
      layout.tsx        # Marketing layout
    (chat)/             # Chat experience (to build)
      page.tsx          # Persona selection → chat
      layout.tsx        # Chat layout
    layout.tsx          # Root layout
    not-found.tsx       # Locale-aware 404
  api/
    chat/               # Chat API route (to build)
      route.ts          # Assembles system prompt + streams response
  layout.tsx
  globals.css
  not-found.tsx
  robots.ts
  sitemap.ts
i18n/
  routing.ts            # Locale routing config (SSOT)
  request.ts            # Server request config
messages/
  fr.json               # French translations (default)
  en.json               # English translations
proxy.ts                # Locale detection & redirect
components/
  ui/                   # shadcn/ui components
  marketing/            # Marketing page components
  chat/                 # Chat components (to build)
  layout/               # Shared layout components
prompts/                # Production prompt files (sent to API)
  system-prompt-core.md
  prompt-doctor.md
  prompt-critic.md
  prompt-guide.md
docs/                   # Design documentation (reference only)
  product-concept.md
  persona-design.md
  persona-doctor.md
  persona-critic.md
  persona-guide.md
  claude-code-transition.md
lib/
  utils.ts              # cn() utility
  constants/            # App constants
  ai/                   # AI client & prompt assembly (to build)
types/
tests/
```

---

## Key Scripts

| Script         | Description              |
| -------------- | ------------------------ |
| `dev`          | Start development server |
| `build`        | Build for production     |
| `lint`         | Run ESLint checks        |
| `lint:fix`     | Fix ESLint issues        |
| `typecheck`    | TypeScript type checking |
| `format`       | Format with Prettier     |
| `format:check` | Check formatting         |
| `test`         | Run tests (watch mode)   |
| `test:run`     | Run tests once           |

---

## Git Hooks & Commits

**Pre-commit:** lint-staged (format + lint) + tests.
**Commit-msg:** Conventional commits.

```
type(scope): description
# Example: feat(chat): add persona selection screen
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

---

## Coding Conventions

- **No `any` types** — always define proper types
- **No magic numbers** — use named constants
- **No commented-out code** — delete it, git remembers
- **Files**: kebab-case (`persona-selector.tsx`)
- **Components**: PascalCase (`PersonaSelector`)
- **Functions**: camelCase (`assembleSystemPrompt`)
- **Constants**: UPPER_SNAKE (`MAX_CONVERSATIONS_PER_DAY`)
- **Booleans**: prefix with `is`, `has`, `can`
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
