# Sinews — Agence de presse officielle du FlURSS

A humorous propaganda news landing page for the fictional **FlURSS** (Federation Libre et Unifiee des Republiques Socialistes du Signal) — a wordplay on **flux RSS** + **URSS**.

Real French news headlines rewritten as Soviet-style propaganda. Modern news site layout meets constructivist poster aesthetics.

## Screenshots

> Landing page with breaking ticker, hero banner, article grid, state decrees sidebar, and anthem player.

## Tech Stack

| Layer     | Technology      |
| --------- | --------------- |
| Framework | Next.js 16      |
| Language  | TypeScript      |
| Styling   | Tailwind CSS v4 |
| OG Images | @vercel/og      |

## Getting Started

```bash
# From the monorepo root
pnpm install

# Start dev server
pnpm --filter flurss dev

# Open http://localhost:3000/lab/flurss
```

## Project Structure

```
projects/flurss/
  app/
    layout.tsx              # Root layout (Soviet propaganda theme)
    page.tsx                # Landing page — full news site
    not-found.tsx           # 404 ("Camarade, vous avez devie de la ligne du Parti")
    icon.svg                # Favicon: red star with RSS signal arcs
    globals.css             # Soviet propaganda theme + animations
    api/og/route.tsx        # Dynamic OG image (edge runtime)
  components/
    logo.tsx                # SVG: "SINEWS" branding + red star/RSS icon
    breaking-ticker.tsx     # Scrolling urgent news ticker
    hero-banner.tsx         # Lead story with hero image
    article-card.tsx        # Individual article card
    article-grid.tsx        # Responsive article grid
    state-announcements.tsx # Sidebar: state decrees & citizen metrics
    anthem-player.tsx       # Audio player: FlURSS national anthem
    footer.tsx              # Ministry-approved footer
  lib/
    types.ts                # TypeScript types
    constants.ts            # Site config, image paths, ministries
    articles.ts             # Hardcoded propaganda articles
    announcements.ts        # Hardcoded state decrees
  public/
    images/                 # Optimized WebP (Nano Banana 2 artwork)
    audio/                  # FlURSS national anthem
```

## Visual Identity

The design blends a **modern 2026 continuous news site** with **Soviet constructivist propaganda**:

- **Colors**: deep red-black (`#1a0a0a`), Soviet red (`#cc0000`), gold (`#d4a017`), warm ivory (`#f5e6d0`)
- **Typography**: Oswald (headlines, Soviet poster feel) + Merriweather (body, newspaper authority)
- **Imagery**: Nano Banana 2 constructivist illustrations, optimized as WebP (41MB raw → 712KB)
- **Animations**: Breaking ticker scroll, article fade-in, urgent badge pulse

## Content

10 propaganda articles based on real French news (March 2026), each assigned to a FlURSS Ministry:

- Ministere de la Verite Numerique
- Ministere de la Planification Economique
- Ministere des Relations Exterieures
- Ministere de la Production Culturelle
- Ministere de la Solidarite Populaire
- Bureau du Sport Heroique

All content is hardcoded — no runtime API calls, no database, zero cost.

## Scripts

| Script      | Description              |
| ----------- | ------------------------ |
| `dev`       | Start Next.js dev server |
| `build`     | Build for production     |
| `lint`      | Run ESLint               |
| `typecheck` | TypeScript type checking |
| `test`      | Run tests (watch)        |
| `test:run`  | Run tests once           |

## Deployment

Deployed on Vercel with basePath `/lab/flurss`. No environment variables required.

## Credits

- Artwork generated with Nano Banana 2
- Anthem composed by AI
- A [FullStackHuman](https://fullstackhuman.sh) lab project
