# Fullstackhuman - Development Guidelines

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16                       |
| Language  | TypeScript                       |
| Styling   | Tailwind CSS v4 + shadcn/ui      |
| i18n      | next-intl v4                     |
| Testing   | Vitest + Testing Library         |
| Git Hooks | Husky + lint-staged + commitlint |

---

## Architecture

### Current: Marketing-only (bilingual FR/EN)

```
app/
  [locale]/          # Locale segment (fr default, en)
    (marketing)/     # Public marketing pages
      page.tsx       # Homepage
      layout.tsx     # Marketing layout
    layout.tsx       # Root layout (fonts, metadata, NextIntlClientProvider)
    not-found.tsx    # Locale-aware 404
  layout.tsx         # Minimal root layout (passthrough)
  globals.css        # Tailwind + theme variables
  not-found.tsx      # Root fallback 404 (invalid locales)
  robots.ts          # SEO
  sitemap.ts         # SEO (locale-aware)
i18n/
  routing.ts         # Locale routing config (SSOT)
  request.ts         # Server request config
messages/
  fr.json            # French translations (default)
  en.json            # English translations
proxy.ts             # Locale detection & redirect
components/
  ui/              # shadcn/ui components (added via CLI)
  marketing/       # Marketing page components
  layout/          # Shared layout components
lib/
  utils.ts         # cn() utility
  constants/       # App constants
types/             # TypeScript types
tests/             # Test files
```

### Planned Sections (future)

- `app/[locale]/(auth)/` -- Authentication flows
- `app/[locale]/(app)/` or `app/[locale]/dashboard/` -- Authenticated app
- `app/api/` -- API routes
- `lib/supabase/` -- Database client
- `hooks/` -- Custom React hooks

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

## Git Hooks

**Pre-commit:** Runs lint-staged (format + lint) + tests.
**Commit-msg:** Enforces conventional commits.

```
type(scope): description
# Example: feat(marketing): add hero section
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

---

## Coding Conventions

- **No `any` types** -- Always define proper types
- **No magic numbers** -- Use named constants
- **No commented-out code** -- Delete it, git remembers
- **Files**: kebab-case (`product-card.tsx`)
- **Components**: PascalCase (`ProductCard`)
- **Functions**: camelCase (`getProductById`)
- **Constants**: UPPER_SNAKE (`MAX_RETRIES`)
- **Booleans**: Prefix with `is`, `has`, `can`
- **Prettier**: No semicolons, single quotes, trailing commas (es5)

---

## Internationalization

- **Default locale**: French (`fr`) -- clean URLs, no prefix
- **Secondary locale**: English (`en`) -- prefixed with `/en/`
- **Routing**: `as-needed` prefix strategy via `next-intl`
- **Translations**: JSON files in `messages/` with ICU syntax
- **SSOT**: Locale list defined in `i18n/routing.ts` only
- **Server Components**: Use `getTranslations()` from `next-intl/server`
- **Client Components**: Use `useTranslations()` hook from `next-intl`
- **No hardcoded user-facing strings** -- All text in `messages/*.json`
- **TypeScript**: Translation keys are type-checked via `global.d.ts`
- **Adding a new string**: Add to BOTH `messages/fr.json` and `messages/en.json`
- **Links**: Use `Link` from `@/i18n/routing`, not `next/link`

---

## Detailed Standards & Workflow

@docs/claude/code-standards.md
@docs/claude/workflow-rules.md
