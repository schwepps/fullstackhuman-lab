# Workflow Rules

## Planning & Scope

### Default to Minimal Scope

When planning changes, start with the SMALLEST possible scope:

- Default to fixing the specific bug/issue with minimal file changes
- Do NOT propose multi-file refactors, DB migrations, or new abstractions unless explicitly asked
- If scope seems large (>5 files), ask the user before proceeding
- Show the file list before any implementation

### Plan Mode Discipline

- Stay in plan mode until the user explicitly approves the plan
- If the user gives feedback, revise the plan — do NOT start implementing
- Never exit plan mode prematurely

### Self-Critique

When asked for "honest feedback" on a plan, genuinely critique scope and complexity:

- Could this be done in fewer files?
- Am I introducing unnecessary abstractions?
- Is a DB migration really needed? (Default answer: probably not)

### Scope Interpretation

Interpret CLAUDE.md rules narrowly. "Feature X out of scope" does NOT mean all related concepts are blocked — verify with the user before pushing back on a request.

---

## CSS & Layout Strategy

- Prefer simple solutions: `max-h` + `overflow-auto`, basic flexbox, CSS grid
- Avoid complex nested flex approaches that cascade breakage
- Test that changes don't break mobile or other viewport sizes
- **Two-strike rule:** If a CSS approach fails twice, STOP. Step back, propose 2-3 fundamentally different strategies, rank by simplicity, implement the simplest
- For responsive issues: check all breakpoints before marking done

---

## PR Feedback Resolution

When resolving PR review comments:

1. Read each comment carefully — understand what the reviewer is actually asking
2. Only change code that's actually wrong — push back on incorrect suggestions with explanations
3. Do NOT blindly apply Copilot/reviewer suggestions without verifying against actual SDK docs and types
4. After all fixes, run build + tests, commit once, push once
5. Verify all threads are resolved before finishing

---

## SSOT Drift Prevention

When the SSOT file defines a set of values (e.g., categories, roles) and DB constraints mirror that set, changes must update ALL related locations.

**Before writing a migration that changes a constraint, grep for all usages:**

```bash
grep -r "category.*CHECK\|category.*IN\|category.*enum" supabase/ lib/ types/
```

**Checklist for SSOT value changes:**

1. Update the SSOT file (e.g., `lib/constants/categories.ts`)
2. Update ALL DB CHECK constraints (every table that has one)
3. Verify Zod schemas use `z.enum(SSOT_ARRAY)`, not a hardcoded list
4. Update any prompt metadata that lists the values

---

## Boundary Consistency

When the same value is computed in multiple places (UI display + DB query), the computation must use identical logic. Don't floor/round in one place but use exact values in another.

```typescript
// ❌ Bad: UI says "180d" (fresh) but DB counts as stale
// display: Math.floor(diff / DAY_MS) → 180
// query:   last_verified_at < exactTimestamp → stale

// ✅ Good: same precision everywhere, floor only for display label
const days = diff / DAY_MS // un-floored for comparison
const label = `${Math.floor(days)}d` // floored only for display
```

---

## Pre-PR Checklist

Run through before opening any PR:

### Code Quality

- [ ] **Zero safety**: No `|| ''`, `|| null`, `!var` on numeric fields — use `??` or `== null`
- [ ] **SSOT types**: No `string` where a union type exists — use canonical type imports
- [ ] **Zod**: `.trim()` before `.min(1)` on strings, httpUrl refinement on URLs

### Forms

- [ ] **Arrays** filtered for empty/whitespace entries before submit
- [ ] **Labels** associated with inputs (`htmlFor`+`id` or wrapping `<label>`)

### Consistency

- [ ] **SSOT changes** reflected in ALL DB constraints and schemas
- [ ] **Shared calculations** use identical logic in display and comparison

### Final

- [ ] `pnpm lint && pnpm typecheck && pnpm test:run` passes
- [ ] `git diff` reviewed — no debug code, no console.log

---

## File Editing

Before editing a file, always re-read it first to get the current state. Never edit based on stale file contents. This is especially important during multi-file changes.
