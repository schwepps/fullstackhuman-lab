# Code Standards

## Core Principles

**1. Simplicity First**

- Prefer obvious code over clever code
- If a junior developer can't understand it in 30 seconds, simplify it

**2. Single Responsibility**

- Each file does ONE thing, each function does ONE thing
- If you're using "and" to describe what something does, split it

**3. Single Source of Truth**

- Define constants, types, and configuration in ONE place
- When data drifts between files, consolidate immediately

**4. DRY** — Abstract on the third occurrence, not the second

**5. Small Units**

- Files: Max 200 lines | Functions: Max 30 lines | Components: Max 150 lines

**6. Up to date patterns** — Use context7 for latest best practices

**7. Mobile-First Responsive Design**

Design for mobile (default), then enhance for `sm:`, `md:`, `lg:`, `xl:`:

- Touch targets: Minimum 44px (h-11) on mobile
- Touch optimization: `touch-manipulation` class
- Active states: `active:` for touch feedback
- Typography: Larger on mobile (`text-base`), refined on desktop (`sm:text-sm`)
- Viewport: `min-h-svh` instead of `min-h-screen`
- Safe areas: `pb-safe` for notched devices

| Breakpoint | Width    | Use case          |
| ---------- | -------- | ----------------- |
| (default)  | < 640px  | Mobile phones     |
| `sm:`      | ≥ 640px  | Large phones      |
| `md:`      | ≥ 768px  | Tablets           |
| `lg:`      | ≥ 1024px | Laptops, desktops |
| `xl:`      | ≥ 1280px | Large desktops    |

```typescript
// ✅ Good: Mobile-first with proper touch targets
<Button className="h-12 w-full touch-manipulation sm:h-10 sm:w-auto" />
<Input className="h-12 text-base sm:h-10 sm:text-sm" />

// ✅ Good: Active states for touch feedback
<Card className="active:scale-[0.98] sm:active:scale-100" />

// ❌ Bad: Desktop-first, no touch considerations
<Button className="h-10 w-auto" />
```

**8. Theme-First Styling**

All colors must use CSS variables from `globals.css` — never hardcode color values:

| Token         | Usage                                     |
| ------------- | ----------------------------------------- |
| `primary`     | Main action buttons, links, focus states  |
| `secondary`   | Secondary buttons, less prominent actions |
| `muted`       | Backgrounds, disabled states              |
| `accent`      | Highlights, hover states                  |
| `destructive` | Delete actions, errors                    |
| `success`     | Confirmations, completed states           |
| `warning`     | Cautions, draft states, low limits        |
| `foreground`  | Primary text                              |
| `background`  | Page/container backgrounds                |
| `border`      | Borders, dividers                         |
| `card`        | Card backgrounds                          |

```typescript
// ✅ Good: Use semantic theme tokens
<div className="bg-success/10 text-success border-success/20" />
<Badge className="bg-warning/10 text-warning" />
<Button className="bg-primary text-primary-foreground" />

// ❌ Bad: Hardcoded Tailwind colors bypass theming
<div className="bg-emerald-50 text-emerald-600" />
<Badge className="bg-amber-100 text-amber-700" />

// ❌ Bad: Hardcoded hex/rgb values
<div style={{ backgroundColor: '#10b981' }} />
<div className="bg-[#f59e0b]" />
```

If you need a new semantic color, add it to `globals.css` in both `:root` and `.dark` sections using OKLCH format, then register it in the `@theme inline` block.

---

## Patterns

### Components

Extract when: used in multiple places, has own state, makes parent cleaner, testable independently.

```typescript
// ✅ Good: Small, focused components
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Card>
      <FeatureHeader title={feature.title} />
      <FeatureDescription text={feature.description} />
    </Card>
  )
}
```

### Functions

Extract when: used more than once, makes calling code readable, can be named clearly.

```typescript
// ✅ Good: Single purpose, clear name
async function fetchUserWithPreferences(userId: string) {
  const user = await getUser(userId)
  const preferences = await getPreferences(userId)
  return { ...user, preferences }
}
```

### Error Handling

- API routes: Return consistent `{ error: "message" }` shape
- Components: Show user-friendly messages, log technical details
- Never swallow errors silently or show raw errors to users

### State Management

- **Local state (useState):** For component-specific UI state
- **Server data:** Fetch in Server Components when possible
- **Forms:** Use controlled inputs with useState or react-hook-form
- **Avoid:** Global state, complex reducers, state management libraries

### Zod Schemas

All API input validation uses Zod. Follow these defaults for every schema:

- **Always `.trim()` before `.min(1)` on string fields** — rejects whitespace-only input

```typescript
// ❌ Bad: "   " passes validation
name: z.string().min(1)

// ✅ Good: trims first, then validates
name: z.string().trim().min(1).max(200)
```

- **URL fields must restrict to http/https** — prevents `javascript:` XSS

```typescript
// ❌ Bad: accepts any scheme
url: z.url()

// ✅ Good: explicit protocol check
url: z.url().refine((u) => /^https?:\/\//i.test(u), 'Must be HTTP(S)')
```

- **Filter empty entries from arrays before submit**

```typescript
// ❌ Bad: empty strings get persisted
tips: formData.tips

// ✅ Good: filter empties
tips: formData.tips.filter((s) => s.trim())
```

### File Organization

Group by feature, not by type:

```
# ✅ Good                    # ❌ Bad
components/                  components/
  feature/                     cards/
    feature-card.tsx             feature-card.tsx
    feature-detail.tsx           user-card.tsx
    feature-progress.tsx       details/
                                 feature-detail.tsx
```

### Internationalization

All user-facing strings live in `messages/fr.json` and `messages/en.json`. Never hardcode text in components.

**Client Components** (with `'use client'`):

```typescript
// ✅ Good: Translation hook with namespace
const t = useTranslations('hero')
return <h1>{t('headline')}</h1>

// ❌ Bad: Hardcoded string
return <h1>EXECUTE: full_stack_human.sh</h1>
```

**Server Components**:

```typescript
// ✅ Good: Async translation function
const t = await getTranslations('metadata')
return { title: t('title') }
```

**Adding a new translatable string**:

1. Add the key to BOTH `messages/fr.json` AND `messages/en.json`
2. Use the appropriate translation function in the component
3. TypeScript will catch missing keys via `global.d.ts` augmentation

**Locale-aware links** — Use `Link` from `@/i18n/routing`, not `next/link`, to auto-prefix locale in URLs.

---

## Prohibited Patterns

- **No `any` types** — Always define proper types
- **No magic numbers** — Use named constants
- **No commented-out code** — Delete it, git remembers
- **No console.log in production** — Use proper logging or remove
- **No nested ternaries** — Use if/else or extract to function
- **No prop drilling > 2 levels** — Extract to component or use composition
- **No hardcoded colors** — Use theme tokens (`bg-primary`, `text-success`) not Tailwind colors (`bg-blue-500`, `text-emerald-600`)
- **No duplicate definitions** — If you define the same constant, type, or configuration in multiple files, extract it to a shared location
- **No labels without association** — Every `<Label>` needs `htmlFor` + `id` on the input, or use a wrapping `<label>` element
- **No loose types for SSOT values** — Use the canonical type, not `string`, in props, form state, and mocks. Import from the SSOT source
- **No hardcoded user-facing strings** — All text must go through `useTranslations()` / `getTranslations()` via message files

---

## Zero & Falsy Safety

`0` is a valid value for numbers and costs. Never use operators that treat `0` as falsy.

**Use `??` not `||` when displaying optional numbers in inputs:**

```typescript
// ❌ Bad: 0 displays as empty string
value={data.cost || ''}

// ✅ Good: 0 displays as "0"
value={data.cost ?? ''}
```

**Use explicit `== null` not `!value` to check if an optional number is missing:**

```typescript
// ❌ Bad: disables button when cost is 0
disabled={!data.cost}

// ✅ Good: only disables when truly absent
disabled={data.cost == null}
```

**Use explicit empty-string check, not `||`, when coercing input values:**

```typescript
// ❌ Bad: drops 0
Number(e.target.value) || undefined

// ✅ Good: preserves 0
const raw = e.target.value
raw === '' || Number.isNaN(Number(raw)) ? undefined : Number(raw)
```

---

## Database & SQL Patterns

### PostgreSQL Functions

Always set `search_path` on functions to prevent schema pollution attacks:

```sql
-- ✅ Good: Explicit search_path (required for SECURITY DEFINER, recommended for all)
CREATE OR REPLACE FUNCTION my_function()
RETURNS VOID AS $$
BEGIN
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public;

-- ❌ Bad: Mutable search_path
CREATE OR REPLACE FUNCTION my_function()
RETURNS VOID AS $$
BEGIN
  -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies

Wrap `auth.uid()` in `(SELECT auth.uid())` so PostgreSQL evaluates it once per query, not per row:

```sql
-- ✅ Good: Scalar subquery evaluated once
CREATE POLICY "users_own" ON users FOR ALL
  USING ((SELECT auth.uid()) = id);

-- ❌ Bad: Re-evaluated for every row
CREATE POLICY "users_own" ON users FOR ALL
  USING (auth.uid() = id);
```

### Grants & Permissions

- Only grant `anon` access when anonymous users need direct client-side access
- If all operations go through a service role client, don't grant to `anon`
- Never use `WITH CHECK (true)` on INSERT policies — restrict to the minimum needed
