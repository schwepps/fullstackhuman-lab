# Fullstackhuman - Development Guidelines

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16                       |
| Language  | TypeScript                       |
| Styling   | Tailwind CSS v4 + shadcn/ui      |
| Testing   | Vitest + Testing Library         |
| Git Hooks | Husky + lint-staged + commitlint |

---

## Architecture

### Current: Marketing-only

```
app/
  (marketing)/     # Public marketing pages
    page.tsx       # Homepage
    layout.tsx     # Marketing layout (header/footer)
  layout.tsx       # Root layout (fonts, metadata)
  globals.css      # Tailwind + theme variables
  not-found.tsx    # 404 page
  robots.ts        # SEO
  sitemap.ts       # SEO
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

- `app/(auth)/` -- Authentication flows
- `app/(app)/` or `app/dashboard/` -- Authenticated app
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

## Detailed Standards & Workflow

@docs/claude/code-standards.md
@docs/claude/workflow-rules.md
