# Production Roadmap

Priority-tier roadmap for Full Stack Human commercial launch.

**Context:** France/EU first launch, 1-2 month timeline, primary KPI is consulting bookings (Calendly clicks). The AI is a lead magnet — free tier outputs with branding are distribution.

**What's already built:** Three-persona chat (Doctor, Critic, Guide) with streaming, email + Google OAuth auth, account management, 3-layer rate limiting with Upstash Redis (durable IP rate limiting), quota system (anon 3/day, free 15/mo, paid unlimited), i18n (FR/EN), database with RLS, security headers, CI/CD, test suite, landing page, `.env.example`, error boundaries, legal pages (privacy policy, terms, mentions légales), GDPR cookie consent banner with consent-gated rate-limit cookie, marketing footer, PostHog analytics (consent-gated, conversion funnel tracking), brand-consistent French translations, anonymous-to-signup CTA after reports, SEO/GEO/WebMCP for AI and search discoverability, loading skeletons (chat + account), branded email templates (Supabase Auth), locale-aware root 404 page, conversation persistence and history, explicit Calendly CTAs at key conversion moments (landing page, report card, conversations dashboard), shareable report URLs with public pages, OG meta, branding watermark, and Calendly CTAs, professional HTML report templates with persona-specific branding and 7 SVG visual types (radar, gauge, spectrum, matrix, priority matrix, flow, roadmap), one-click PDF export via `@react-pdf/renderer`, Telegram bot (webhook, persona selection, reports, GDPR), built-in web search for current tool/product knowledge (Anthropic `web_search_20260209`, feature-flagged).

**Complexity estimates:** S = hours | M = 1-2 days | L = 3-5 days | XL = 1-2 weeks
All estimates include writing tests to match the project's existing quality bar.

---

## Tier 1 — Blocking

Must complete before any commercial launch. Legal, compliance, and reliability requirements.

---

### ~~1. `.env.example`~~ DONE

Completed in PR #9. Documents all 7 environment variables with descriptions and setup links.

---

### ~~2. Error Boundary Components~~ DONE

Completed in PR #9. Shared `ErrorFallback` component with i18n support, 4 `error.tsx` files (locale root, chat, account, marketing). Chat boundary uses context-specific messaging. Forward-compatible with conversation persistence (item 10) for state recovery.

---

### ~~3. Legal Documentation~~ DONE

Completed in PR #10. Bilingual (FR/EN) privacy policy, terms of service, and mentions légales with real FSC Consulting company data. Shared `LegalPageLayout` component, marketing footer with legal links, `resolveLocale` utility for DRY locale resolution. Sitemap updated with legal paths.

---

### ~~4. Cookie Consent Banner~~ DONE

Completed in PR #10. GDPR-compliant cookie consent banner using `useSyncExternalStore` for reactive cookie state. `CookieConsentProvider` context for cross-cutting access. Rate-limit cookie (`fsh_conversations`) gated on consent — skipped when consent is absent or denied. Footer "Cookie settings" button for consent withdrawal. `fsh_consent` cookie with ~6-month expiry per CNIL recommendation.

---

### ~~5. Analytics (PostHog)~~ DONE

Completed in PR #11. Client-side PostHog integration gated behind cookie consent. Tracks page views (via `usePathname`), persona selection, report generation, report copy, Calendly link clicks, and hero CTA clicks. PostHog initializes on consent grant, shuts down and clears cookies/localStorage on consent withdrawal. SSOT event names in `lib/constants/analytics.ts`, wrapper module in `lib/analytics/posthog.ts`, consent lifecycle in `lib/hooks/use-posthog-lifecycle.ts`. CSP headers updated for PostHog domains. No server-side analytics (client-only).

---

## Tier 2 — Launch

Core value-add features that directly impact the primary KPI (consulting bookings). Ship these for launch.

---

### ~~6. French Translation Review~~ DONE

Completed in PR #12. Reviewed and warmed up all French translations in `messages/fr.json`. Hero and persona sections were already on-brand; auth, account, error, and utility sections revised from formal/generic to warm, direct copy matching François's voice. Key changes: dropped "Veuillez" constructions, used "On" instead of "Nous" for casual tone, warmer titles ("Content de vous revoir", "Rejoindre Full Stack Human"), more natural error messages ("Quelque chose a coincé"), shorter and more direct copy throughout. Kept "vous" register for professional consulting context.

---

### ~~7. Account Creation CTA for Anonymous Users~~ DONE

Completed in PR #12. `SignupCta` component renders after each report card in chat for anonymous users. Non-intrusive card with quota urgency display (ICU plural syntax). Links to `/auth/signup` via locale-aware routing. Analytics tracked via existing `CTA_CLICK` event with `signup_post_report` source. Quota props threaded from `ChatPage` through `ChatContainer` and `ChatMessageList`. 6 unit tests covering rendering, quota display, link target, and analytics tracking.

---

### ~~8. Redis Rate Limiting (Upstash)~~ DONE

Replaced both in-memory rate limiters (chat IP + auth actions) with Upstash Redis via `@upstash/ratelimit` sliding window. Redis client singleton in `lib/upstash.ts` following the Anthropic client pattern. Graceful degradation: falls back to in-memory when Redis is unavailable (local dev, outages). `consumeIpRequest` changed from sync to async. EU (Frankfurt) region for GDPR. Updated `.env.example` with Upstash credentials. Tests updated with Redis mocks and fallback coverage.

---

### ~~9. SEO, GEO, and WebMCP~~ DONE

JSON-LD structured data (Organization, ProfessionalService, WebApplication) on homepage via `MultiJsonLd` component. Dynamic OG image generation via `next/og` ImageResponse with locale-aware text (FR/EN). Twitter Card meta. Enhanced root layout metadata with OpenGraph, Twitter, canonical URLs, and hreflang alternates. AI bot rules in `robots.ts` for GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended, and anthropic-ai. `llms.txt` for LLM discoverability. WebMCP tool registration (`get_personas`, `start_consultation`) via `navigator.modelContext` with feature detection (Chrome 146+ early preview). SEO consistency check script (`pnpm check:seo`) added to pre-review pipeline. Report page OG meta fulfilled in shareable report URLs (item 12).

**Key files:**

- Create `lib/seo/schemas.ts` — JSON-LD schema generators
- Create `components/seo/json-ld.tsx` — JsonLd rendering components
- Create `app/[locale]/opengraph-image.tsx` — Dynamic OG image (locale-aware)
- Create `app/[locale]/twitter-image.tsx` — Twitter card image
- Create `public/llms.txt` — LLM-readable site description
- Create `components/seo/webmcp-registration.tsx` — WebMCP tool registration
- Create `types/webmcp.d.ts` — TypeScript declarations for WebMCP API
- Create `scripts/check-seo-consistency.sh` — SEO consistency check
- Update `app/[locale]/layout.tsx` — OG, Twitter, alternates, keywords, WebMCP
- Update `app/[locale]/(marketing)/page.tsx` — JSON-LD structured data
- Update `app/robots.ts` — AI bot crawler rules
- Update `messages/en.json` and `messages/fr.json` — SEO metadata keys

---

### ~~10. Conversation Persistence and History~~ DONE

Completed in PR #16. Conversations table (JSONB messages, RLS, status tracking) consolidated into initial migration. Auto-save on stream completion in `useChat()`. Progressive disclosure UX: recent conversations below persona cards on `/chat`, full library at `/conversations` (protected route), read-only viewer at `/chat/[id]`. Anonymous conversations persist in localStorage and auto-migrate to DB on first authenticated visit. Status badges (Report/In progress/Draft). Server actions with rate limiting, Zod validation, and auth checks. 18 new files, 14 modified.

**Key files:**

- `supabase/migrations/00000000000000_initial_schema.sql` — conversations table consolidated into initial migration
- `lib/conversations/actions.ts` — server actions (create, save, abandon, delete)
- `lib/conversations/queries.ts` — server queries (recent, single, paginated with filters)
- `lib/conversations/migrate.ts` — anonymous → authenticated migration
- `lib/hooks/use-chat.ts` — persistence integration (create/save/abandon on stream events)
- `app/[locale]/(chat)/chat/[id]/page.tsx` — read-only conversation viewer
- `app/[locale]/(account)/conversations/page.tsx` — full conversations library
- `components/chat/recent-conversations.tsx` — recent conversations section

---

### ~~11. Calendly Integration Outside Chat~~ DONE

Reusable `CalendlyCta` component with two variants (banner card and inline button) placed at three key conversion moments: landing page hero (secondary CTA below bio), report card footer (alongside copy button), and conversations dashboard (banner above library). Simple styled links opening Calendly in new tab — no embed widget, no CSP changes needed. `CALENDLY_URL` constant added as SSOT in `lib/constants/app.ts`, SEO schema updated to use it. Analytics `CalendlyClickProperties.source` expanded for new placements. Public report page CTA fulfilled in item 12.

**Key files:**

- Create `components/shared/calendly-cta.tsx` — reusable CTA with banner and inline variants
- Update `lib/constants/app.ts` — `CALENDLY_URL` constant (SSOT)
- Update `lib/constants/analytics.ts` — expanded `CalendlyClickProperties.source` union
- Update `lib/seo/schemas.ts` — uses `CALENDLY_URL` from SSOT
- Update `components/chat/report-card.tsx` — CTA button in footer
- Update `components/marketing/hero-section.tsx` — secondary CTA below bio
- Update `app/[locale]/(account)/conversations/page.tsx` — banner above library
- Update `messages/fr.json` and `messages/en.json` — `calendlyCta` namespace

---

### ~~12. Shareable Report URLs~~ DONE

Reports table (`reports`) with public read RLS (anon access via share_token). Auto-persisted on stream completion in `useChat()` — idempotent insert keyed on `conversation_id`. Public page at `/report/{share_token}` renders report with persona badge, Calendly CTA (inline + banner), and conditional branding footer (free tier). Persona-specific OG meta (title, description, OpenGraph, Twitter Card). Share button in chat report card copies public URL with analytics tracking. `(sharing)` route group with minimal branded layout (no auth required). `robots.ts` updated for AI bot indexing. Report page OG meta from item 9 fulfilled here.

**Key files:**

- Update `supabase/migrations/00000000000000_initial_schema.sql` — reports table consolidated into initial migration
- Create `types/report.ts` — Report and ReportRow interfaces
- Create `lib/constants/reports.ts` — report-specific constants (SHARE_TOKEN_LENGTH, OG_DESCRIPTION_MAX_LENGTH)
- Create `lib/reports/actions.ts` — `createReport()` server action (rate limit, validation, auth, idempotency, tier→branding)
- Create `lib/reports/queries.ts` — `getReportByToken()`, `getShareTokenForConversation()`
- Create `components/report/share-button.tsx` — copy share URL with analytics
- Create `components/report/report-view.tsx` — branded report renderer (server component)
- Create `app/[locale]/(sharing)/layout.tsx` — minimal branded shell for sharing
- Create `app/[locale]/(sharing)/report/[token]/page.tsx` — public report page with OG meta
- Update `lib/hooks/use-chat.ts` — auto-persist report on stream completion, load share token for past conversations
- Update `lib/constants/analytics.ts` — `REPORT_LINK_COPIED` event, extended `CalendlyClickProperties.source`
- Update `lib/hooks/use-analytics.ts` — `trackReportLinkCopied` callback
- Update `components/chat/report-card.tsx` — share button in footer
- Update `components/chat/chat-bubble.tsx`, `chat-message-list.tsx`, `chat-container.tsx` — thread `shareToken` prop
- Update `app/robots.ts` — `/report/` in AI bot allow rules
- Update `public/llms.txt` — document public report URLs
- Update `messages/fr.json` and `messages/en.json` — `report` namespace

---

### ~~13. HTML Report Templates and PDF Export~~ DONE

Completed in PR #19. Unified report template system with persona-specific branding (accent colors, gradient headers, signature treatments). Two-pass markdown parser detects structured sections and visual components from AI output. Seven SVG visual types (assessment radar, risk gauge, concept spectrum, framework matrix, action priority matrix, root-cause flow, priority roadmap) with shared pure geometry layer for both web SVG and react-pdf SVG rendering. PDF export via `@react-pdf/renderer` with server-side generation at `/api/report/[token]/pdf`. Professional typography (Helvetica family), accent-colored section headings, generous spacing, print stylesheet with accent color preservation. "Download PDF" button in report view and chat report card. UX polish pass: increased fill opacities, font sizes, section padding, signature background visibility, CTA footer emphasis, visual container borders.

**Key files:**

- Create `components/report/report-template.tsx` — unified template assembly (persona badge, gradient header, sections, CTA footer)
- Create `components/report/report-template-header.tsx` — header with gradient bar, persona badge, title, metadata
- Create `components/report/report-template-footer.tsx` — Calendly CTA footer
- Create `components/report/report-section-block.tsx` — section renderer (markdown, visuals, signature treatments)
- Create `components/report/professional-markdown.tsx` — light-themed markdown renderer (tables, blockquotes, lists)
- Create `lib/report-parser.ts` — two-pass report parser (heading detection, visual extraction)
- Create `lib/visuals/types.ts` — TypeScript interfaces for all 7 visual types
- Create `lib/visuals/validators.ts` — Zod validators for visual data
- Create `lib/visuals/constants.ts` — shared constants (colors, labels, truncation)
- Create `lib/visuals/geometry.ts` — pure math functions (arcs, polar coords, quadrant bounds)
- Create `components/visuals/web/` — 7 web SVG visual components
- Create `components/visuals/pdf/` — 7 react-pdf SVG visual components
- Create `components/visuals/visual-renderer.tsx` — web visual dispatcher
- Create `components/visuals/pdf/pdf-visual-renderer.tsx` — PDF visual dispatcher
- Create `lib/pdf/styles.ts` — shared PDF stylesheet (react-pdf)
- Create `lib/pdf/report-pdf-document.tsx` — full PDF document assembly
- Create `lib/pdf/pdf-markdown-renderer.tsx` — markdown-to-react-pdf renderer
- Create `app/api/report/[token]/pdf/route.ts` — PDF generation endpoint
- Update `components/report/report-view.tsx` — PDF download button, template integration
- Update `components/chat/report-card.tsx` — PDF download button in chat
- Update `app/globals.css` — print stylesheet for report accent colors

---

## Tier 3 — Post-Launch

Important features to ship within the first month after launch. The product can generate bookings without them.

---

### ~~24. Web Search for Current Knowledge~~ DONE

Completed in PR #33. Anthropic built-in `web_search_20260209` server-side tool enables the AI to search the web when users ask about tools, products, or services it doesn't recognize (knowledge cutoff gap). Feature-flagged via `ANTHROPIC_ENABLE_WEB_SEARCH` env var — disabled by default. Max 2 searches per request for cost control. Prompt enhanced with graceful fallback for knowledge recency gaps (transparent about cutoff, asks user to describe the tool, helps structurally) and web search guidance (when to search, when not to). Prompt injection defense for untrusted web content. Applied to both web chat and Telegram bot. 754 tests passing.

**Key files:**

- Create `lib/ai/tools.ts` — web search tool config with feature flag
- Update `lib/constants/chat.ts` — `WEB_SEARCH_MAX_USES` constant
- Update `lib/constants/logging.ts` — `WEB_SEARCH_USAGE` log event
- Update `app/api/chat/route.ts` — tools + search usage logging
- Update `lib/telegram/services/ai-service.ts` — tools + multi-block content handling
- Update `prompts/system-prompt-core.md` — recency gap handling + search guidance

---

### 14. Prompt Quality Improvements

**Complexity:** M
**What:** Review and iterate on the three persona prompts and core system prompt based on real tester feedback. Focus areas: sharper pivot moments, more specific CTAs, better adaptation to user's technical level, stronger report structure. Test against the golden paths documented in the persona design docs.
**Status:** First iteration done — knowledge recency gap handling added to core prompt (PR #33, see item 24). Remaining work is persona-specific tuning based on real usage data.
**Why post-launch:** Prompts are already good. Real tester feedback provides better signal for improvements than speculative iteration. This should be a continuous process informed by PostHog analytics and user conversations.
**Dependencies:** Analytics (5) for usage data. Real tester conversations for feedback.
**Key files:**

- Update `prompts/system-prompt-core.md`
- Update `prompts/prompt-doctor.md`
- Update `prompts/prompt-critic.md`
- Update `prompts/prompt-guide.md`
- Reference `docs/persona-doctor.md`, `docs/persona-critic.md`, `docs/persona-guide.md` for golden paths

---

### 15. Cross-Session Memory

**Complexity:** L
**What:** Build a per-user memory store that persists key context across conversations. When a user returns, the AI has context from previous interactions (company name, role, team size, past diagnoses). Implementation: store structured memory entries in a `user_memory` table, inject relevant context into the system prompt.
**Why post-launch:** Significantly improves returning user experience. However, most users will have 1-3 conversations before either booking or leaving. The ROI is highest for power users who return repeatedly — a smaller segment at launch.
**Dependencies:** Conversation persistence (10) — memory is derived from conversation history.
**Key files:**

- Create `supabase/migrations/YYYYMMDD_user_memory.sql`
- Create `lib/ai/memory.ts` — memory extraction and injection
- Update `lib/ai/prompt-assembler.ts` — inject memory into system prompt
- Update `app/api/chat/route.ts` — extract and store memory after conversations

---

### ~~16. Loading Skeletons and Suspense Boundaries~~ DONE

Completed in PR #15. Added shadcn `Skeleton` component (customized with `bg-primary/10` for brand-consistent cyan shimmer). Chat loading skeleton mirrors `PersonaSelector` layout (header bar + 3-card grid). Account loading skeleton mirrors form sections (profile, password, email, delete) with mobile-first input sizing (`h-12 sm:h-10`). Dashboard skeleton deferred to item 10 (route doesn't exist yet).

**Key files:**

- Create `components/ui/skeleton.tsx` — shadcn skeleton with brand-adjusted base color
- Create `app/[locale]/(chat)/chat/loading.tsx` — chat route loading skeleton
- Create `app/[locale]/(account)/account/loading.tsx` — account route loading skeleton

---

### ~~17. Branded Email Templates~~ DONE

Completed in PR #15. Three French HTML email templates (signup confirmation, password reset, email change) with light professional theme — white background, clean card layout, Electric Cyan CTA buttons, warm tone matching François's voice. Table-based layout for email client compatibility. Reference files in `emails/` with deployment README for Supabase dashboard configuration.

**Key files:**

- Create `emails/signup-confirmation.html` — signup confirmation template
- Create `emails/password-reset.html` — password reset template
- Create `emails/email-change.html` — email change template
- Create `emails/README.md` — Supabase deployment instructions

---

### ~~18. Root 404 Page Fix~~ DONE

Completed in PR #15. Root `app/not-found.tsx` now detects locale from `NEXT_LOCALE` cookie and `Accept-Language` header (defaults to French). Uses theme tokens (`text-muted-foreground`, `bg-primary`, `text-primary-foreground`) instead of hardcoded Tailwind colors. Visual parity with locale-aware 404 (decorative circles, cyan 404 number). Bilingual inline strings matching `notFound` i18n namespace.

**Key files:**

- Update `app/not-found.tsx` — locale-aware themed root 404

---

### ~~23. Telegram Bot Integration~~ DONE

Completed in PR #27. Telegram bot that mirrors the web chat experience. Users pick a persona via inline keyboard, have a full AI conversation, receive a shareable report link and Calendly CTA. Runs as a webhook handler inside the Next.js app at `/api/telegram/webhook`. Separate `telegram_users` and `telegram_conversations` tables with independent quota pool (15/month free). Professional MarkdownV2 formatting for AI responses. Security: timing-safe webhook verification, scoped service client, 4-layer rate limiting, GDPR compliance (`/deletedata` command). Includes conversation depth limiting (15 turns, 3-phase wrap-up) applied to both web chat and Telegram.

**Key files:**

- `lib/telegram/` — bot logic, handlers, services, formatting
- `app/api/telegram/webhook/route.ts` — webhook endpoint
- `supabase/migrations/20260224000000_telegram_tables.sql` — new tables + reports FK

---

### 19. Accessibility Audit (WCAG 2.1 AA)

**Complexity:** M
**What:** Conduct accessibility audit of all pages. Key areas: keyboard navigation in chat, screen reader support for streaming messages (ARIA live regions), focus management after persona selection, color contrast on the terminal/cyber theme, touch targets.
**Why post-launch:** EU Accessibility Act (EAA) increasingly requires WCAG 2.1 AA compliance for commercial services. Not a hard launch blocker today but a compliance risk that grows. The terminal aesthetic may conflict with contrast requirements.
**Dependencies:** None.
**Key files:**

- Audit all pages with axe-core / Lighthouse
- Update components as needed for remediation

---

## Tier 4 — Growth

Features for when the product is generating bookings and needs to scale or expand.

---

### 20. Stripe Payment Integration

**Complexity:** XL
**What:** Implement paid tier using Stripe Checkout and Customer Portal. Pricing page, webhook handler to upgrade/downgrade the `tier` column in `users` table (already supports `'free'` and `'paid'`). Paid users get: unlimited conversations, clean PDF exports (no branding), cross-session memory.
**Why growth:** The product can launch as free-only. Primary revenue is consulting bookings, not SaaS subscriptions. The paid tier covers infrastructure costs. Rushing Stripe delays features that directly drive bookings.
**Dependencies:** Conversation persistence (10), report templates (13), cross-session memory (15) as paid differentiators.
**Key files:**

- Install `stripe`
- Create `app/api/stripe/webhook/route.ts`
- Create `app/api/stripe/checkout/route.ts`
- Create `app/[locale]/(marketing)/pricing/page.tsx`
- Create `lib/stripe.ts` — Stripe client and helpers
- Update `supabase/migrations/` — add stripe_customer_id to users

---

### 21. ProductCompanion Integration

**Complexity:** M
**What:** ProductCompanion is a separate AI coaching product that already exists (business canvas, user journey maps, SMART goals, service maps). When a user's FSH conversation reveals they need structured product work, contextually suggest ProductCompanion as a next step. Implementation: add mention rules to persona prompts + CTA component linking to ProductCompanion.
**Why growth:** Cross-selling a separate product before the core FSH product is validated is high risk. Build this after FSH is generating bookings consistently.
**Dependencies:** Full FSH product validated (all Tier 1 and 2).
**Key files:**

- Update persona prompts — add ProductCompanion mention rules
- Create `components/shared/product-companion-cta.tsx`

---

### 22. Advanced Conversation Features

**Complexity:** M
**What:** Start a new conversation pre-loaded with context from a past report (context injection into prompt assembly, token budget management). Conversation search and filtering. Conversation tagging. Export full conversation history.
**Why growth:** Enhances power user experience but not critical for the initial booking funnel. Most users will have a small number of conversations before booking.
**Dependencies:** Conversation persistence (10).
**Key files:**

- Update `lib/hooks/use-chat.ts` — context injection from past report
- Update dashboard components — search, filter, tags
- Create `app/api/conversations/export/route.ts`

---

## Dependency Graph

```
Tier 1:
  3 Legal Docs ✅ ────→ 4 Cookie Consent ✅ ──→ 5 PostHog Analytics ✅

Tier 2:
  10 Conversations ✅ ──→ 12 Shareable URLs ✅ ──→ 13 Report Templates + PDF ✅
       │                     │
       │                     └──→ 9 SEO/GEO ✅ (report OG meta fulfilled in 12)
       │
       ├──→ 11 Calendly ✅ (dashboard CTA)
       └──→ 15 Cross-Session Memory (Tier 3)

Independent (no dependencies):
  1 .env.example ✅
  2 Error boundaries ✅
  3 Legal docs ✅
  4 Cookie consent ✅
  6 French translations ✅
  7 Anon signup CTA ✅
  8 Redis rate limiting ✅
  9 SEO/GEO/WebMCP ✅ (core done; report OG meta fulfilled in 12 ✅)
  16 Loading skeletons ✅
  17 Branded emails ✅
  18 Root 404 fix ✅
  24 Web Search ✅ (knowledge gap remediation)

  10 ✅ + 12 ✅ + 13 ✅ ──→ 23 Telegram Bot ✅

Tier 4:
  10 ✅ + 13 ✅ + 15 ──→ 20 Stripe (needs stable product + paid differentiators)
  All Tier 1+2 ──→ 21 ProductCompanion (needs validated core)
```

---

## Recommended Execution Sequence

### Tier 1 — Weeks 1-2

1. ~~`.env.example` (1)~~ DONE
2. ~~Error boundaries (2)~~ DONE
3. ~~Legal docs (3)~~ DONE
4. ~~Cookie consent (4)~~ DONE
5. ~~PostHog analytics (5)~~ DONE

### Tier 2 — Weeks 3-6

Parallel tracks:

**Track A (quick wins):**

1. ~~French translations (6)~~ DONE
2. ~~Anon signup CTA (7)~~ DONE
3. ~~Redis rate limiting (8)~~ DONE
4. ~~SEO/GEO/WebMCP (9)~~ DONE

**Track B (the big build):**

1. ~~Conversation persistence + history (10)~~ DONE
2. ~~Calendly integration (11)~~ DONE
3. ~~Shareable report URLs (12)~~ DONE
4. ~~HTML templates + PDF export (13)~~ DONE

### Tier 3 — Weeks 6-8 (post-launch)

- Prompt improvements (14) — ongoing based on tester feedback (first iteration done: knowledge gap handling)
- Cross-session memory (15) — major post-launch feature
- ~~Loading skeletons (16), branded emails (17), 404 fix (18)~~ DONE
- Accessibility audit (19) — when other polish is done
- ~~Telegram bot (23)~~ DONE
- ~~Web search (24)~~ DONE

### Tier 4 — Month 2+

- Stripe (20) — when bookings validate the product
- ProductCompanion (21) — when FSH is stable
- Advanced features (22) — based on user demand
