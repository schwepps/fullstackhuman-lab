# Production Roadmap

Priority-tier roadmap for Full Stack Human commercial launch.

**Context:** France/EU first launch, 1-2 month timeline, primary KPI is consulting bookings (Calendly clicks). The AI is a lead magnet — free tier outputs with branding are distribution.

**What's already built:** Three-persona chat (Doctor, Critic, Guide) with streaming, email + Google OAuth auth, account management, 3-layer rate limiting with Upstash Redis (durable IP rate limiting), quota system (anon 3/day, free 15/mo, paid unlimited), i18n (FR/EN), database with RLS, security headers, CI/CD, test suite, landing page, `.env.example`, error boundaries, legal pages (privacy policy, terms, mentions légales), GDPR cookie consent banner with consent-gated rate-limit cookie, marketing footer, PostHog analytics (consent-gated, conversion funnel tracking), brand-consistent French translations, anonymous-to-signup CTA after reports.

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

JSON-LD structured data (Organization, ProfessionalService, WebApplication) on homepage via `MultiJsonLd` component. Dynamic OG image generation via `next/og` ImageResponse with locale-aware text (FR/EN). Twitter Card meta. Enhanced root layout metadata with OpenGraph, Twitter, canonical URLs, and hreflang alternates. AI bot rules in `robots.ts` for GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, Google-Extended, and anthropic-ai. `llms.txt` for LLM discoverability. WebMCP tool registration (`get_personas`, `start_consultation`) via `navigator.modelContext` with feature detection (Chrome 146+ early preview). SEO consistency check script (`pnpm check:seo`) added to pre-review pipeline. Report page OG meta deferred to shareable report URLs (item 12).

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

### 10. Conversation Persistence and Dashboard

**Complexity:** XL
**What:** Store conversations in a new `conversations` table (id, user_id, persona, messages JSONB, title, created_at, updated_at) with RLS policies. Build a dashboard page at `/dashboard` showing past conversations as a read-only archive. Currently, `useChat` hook stores everything in `useState` — conversations are lost on page refresh. Also handle anonymous conversation migration: when an anonymous user signs up after a conversation, migrate their current conversation to the new account so the signup CTA (7) delivers on its promise.
**Why launch:** Core value proposition for signed-in users. Without persistence, there's no reason to create an account. The funnel is: anonymous user gets value → wants to save/revisit → creates account → email captured → nurture funnel. Also required for shareable reports (12) and cross-session memory (15).
**Dependencies:** None. But many Tier 2/3 features depend on this.
**Key technical decisions:**

- Messages stored as JSONB array (conversations are read/written as a unit)
- Auto-save on stream completion + periodic during long conversations
- Title: extract from first user message or AI-generated summary
- Anonymous conversations stored in localStorage, migrated to DB on signup
  **Key files:**
- Create `supabase/migrations/YYYYMMDD_conversations.sql` — conversations table + RLS
- Create `app/[locale]/(account)/dashboard/page.tsx`
- Create `components/dashboard/conversation-list.tsx`
- Create `lib/api/conversations.ts` — CRUD operations
- Update `lib/hooks/use-chat.ts` — save/load from DB
- Update `app/api/chat/route.ts` — conversation save on completion
- Update `messages/fr.json` and `messages/en.json` — dashboard namespace

---

### 11. Calendly Integration Outside Chat

**Complexity:** M
**What:** Currently Calendly links only appear inside AI-generated report markdown. Add explicit Calendly CTAs at key conversion moments: (a) landing page, (b) public report page, (c) dashboard, and (d) floating/sticky element during chat after report is generated. Use Calendly's embed widget or popup for seamless booking without leaving the page.
**Why launch:** Primary KPI is bookings. Relying solely on the AI including a Calendly link in markdown is fragile — the AI might format it differently, user might not scroll to the footer. Explicit, designed CTAs at key moments will directly increase bookings.
**Dependencies:** Shareable report URLs (12) for report page CTA. Dashboard (10) for dashboard CTA. Landing page CTA has no dependencies.
**Key files:**

- Create `components/shared/calendly-cta.tsx` — reusable CTA component
- Update `app/[locale]/(marketing)/page.tsx` — landing page CTA
- Update `components/chat/report-card.tsx` — post-report CTA
- Update `next.config.ts` — CSP header update for Calendly iframe/script
- Update `messages/fr.json` and `messages/en.json`

---

### 12. Shareable Report URLs

**Complexity:** L
**What:** When a report is generated, save it to a `reports` table (id, conversation_id, persona, content, share_token, created_at). Generate a public shareable URL like `/report/{share_token}`. The public page renders the report with FSH branding, persona badge, and Calendly CTA. No auth required to view. Free tier reports include branding watermark.
**Why launch:** Every shared report is organic distribution. The product concept explicitly states: free tier outputs with branding are more valuable than paid outputs without it. A report shared in Slack or forwarded to a CTO is a lead magnet with a built-in CTA. This is the viral loop.
**Dependencies:** Conversation persistence (10) — reports are linked to conversations.
**Key files:**

- Create `supabase/migrations/YYYYMMDD_reports.sql` — reports table + public read policy
- Create `app/[locale]/report/[token]/page.tsx` — public report page
- Create `components/report/report-view.tsx` — branded report renderer
- Update `components/chat/report-card.tsx` — add "Share" button with copy-to-clipboard
- Update `lib/hooks/use-chat.ts` — save report on detection
- Update `messages/fr.json` and `messages/en.json`

---

### 13. HTML Report Templates and PDF Export

**Complexity:** L
**What:** Design persona-specific HTML report templates that render markdown reports into professional, branded documents. Add PDF export via server-side rendering. Reports include: FSH branding, persona badge, date, structured sections, Calendly CTA footer. Free tier PDFs include branding; paid tier gets clean exports.
**Why launch:** The deliverable IS the product. Raw markdown in chat is functional but not shareable in professional contexts. A well-formatted PDF is what gets forwarded to CTOs and cofounders.
**Dependencies:** Shareable report URLs (12) — the HTML template is used for both the public URL and the PDF export.
**Key files:**

- Create `components/report/report-template-doctor.tsx`
- Create `components/report/report-template-critic.tsx`
- Create `components/report/report-template-guide.tsx`
- Create `app/api/report/[token]/pdf/route.ts` — PDF generation endpoint
- Update `components/report/report-view.tsx` — "Download PDF" button

---

## Tier 3 — Post-Launch

Important features to ship within the first month after launch. The product can generate bookings without them.

---

### 14. Prompt Quality Improvements

**Complexity:** M
**What:** Review and iterate on the three persona prompts and core system prompt based on real tester feedback. Focus areas: sharper pivot moments, more specific CTAs, better adaptation to user's technical level, stronger report structure. Test against the golden paths documented in the persona design docs.
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

### 16. Loading Skeletons and Suspense Boundaries

**Complexity:** S
**What:** Add `loading.tsx` files for key route segments (chat, dashboard, account). Implement skeleton components for persona selector, chat messages, and dashboard. Use React Suspense boundaries for async server components.
**Why post-launch:** Improves perceived performance and prevents CLS (layout shift). Not a launch blocker since current pages load fast, but affects Core Web Vitals (important for SEO).
**Dependencies:** None.
**Key files:**

- Create `app/[locale]/(chat)/chat/loading.tsx`
- Create `app/[locale]/(account)/dashboard/loading.tsx`
- Create `components/ui/skeleton.tsx` (if not already from shadcn)

---

### 17. Branded Email Templates

**Complexity:** S
**What:** Replace Supabase default email templates (signup confirmation, password reset, email change) with FSH-branded templates. Include logo, brand colors, and consistent tone.
**Why post-launch:** Default Supabase emails look generic and undermine brand credibility. Users see "Supabase" branding on password reset, which is confusing. Important for trust but not a launch blocker.
**Dependencies:** None.
**Key files:**

- Supabase dashboard configuration (email templates)
- Create HTML email templates with inline CSS

---

### 18. Root 404 Page Fix

**Complexity:** S
**What:** The root `app/not-found.tsx` is French-only with hardcoded strings and raw Tailwind colors. Should detect locale from request, use theme tokens, and match the site's visual identity.
**Why post-launch:** Minor UX issue. The root 404 only triggers for requests outside the `[locale]` segment (rare). The locale-aware `app/[locale]/not-found.tsx` handles most 404s correctly.
**Dependencies:** None.
**Key files:**

- Update `app/not-found.tsx`

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
  10 Conversations ──→ 12 Shareable URLs ──→ 13 PDF Export
       │                     │
       │                     └──→ 9 SEO/GEO ✅ (report OG meta deferred to 12)
       │
       ├──→ 11 Calendly (dashboard CTA)
       └──→ 15 Cross-Session Memory (Tier 3)

Independent (no dependencies):
  1 .env.example ✅
  2 Error boundaries ✅
  3 Legal docs ✅
  4 Cookie consent ✅
  6 French translations ✅
  7 Anon signup CTA ✅
  8 Redis rate limiting ✅
  9 SEO/GEO/WebMCP ✅ (core done; report OG meta depends on 12)

Tier 4:
  10 + 13 + 15 ──→ 20 Stripe (needs stable product + paid differentiators)
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

1. Conversation persistence + dashboard (10) — start early, largest item
2. Calendly integration (11) — landing page CTA immediately, others after dashboard
3. Shareable report URLs (12) — after conversation persistence
4. HTML templates + PDF export (13) — after shareable URLs

### Tier 3 — Weeks 6-8 (post-launch)

- Prompt improvements (14) — ongoing based on tester feedback
- Cross-session memory (15) — major post-launch feature
- Loading skeletons (16), branded emails (17), 404 fix (18) — parallel quick wins
- Accessibility audit (19) — when other polish is done

### Tier 4 — Month 2+

- Stripe (20) — when bookings validate the product
- ProductCompanion (21) — when FSH is stable
- Advanced features (22) — based on user demand
