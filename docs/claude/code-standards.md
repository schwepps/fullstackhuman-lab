# Code Standards

## Up to date patterns

Use context7 for latest best practices.

---

## Theme-First Styling

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

If you need a new semantic color, add it to `globals.css` in both `:root` and `.dark` sections using OKLCH format, then register it in the `@theme inline` block.

---

## State Management

- **Local state (useState):** For component-specific UI state
- **Server data:** Fetch in Server Components when possible
- **Forms:** Use controlled inputs with useState or react-hook-form
- **Avoid:** Global state, complex reducers, state management libraries

---

## Prohibited Patterns (project-specific)

- **No hardcoded colors** — Use theme tokens (`bg-primary`, `text-success`) not Tailwind colors (`bg-blue-500`, `text-emerald-600`)
- **No duplicate definitions** — If you define the same constant, type, or configuration in multiple files, extract it to a shared location
- **No labels without association** — Every `<Label>` needs `htmlFor` + `id` on the input, or use a wrapping `<label>` element
- **No loose types for SSOT values** — Use the canonical type, not `string`, in props, form state, and mocks. Import from the SSOT source
- **No hardcoded user-facing strings** — All text must go through `useTranslations()` / `getTranslations()` via message files
