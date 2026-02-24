# Full Stack Human — AI Product Concept

> Living document. Updated after each design conversation.
> Last updated: 2025-02-20
> Status: **All three personas complete. Ready for implementation.**

---

## 1. What is Full Stack Human?

Full Stack Human productizes François as an on-demand AI tool. Clients get access to his expertise — product thinking, structure, and technical leadership — without needing him physically present.

The AI is not the end product. It is the **proof of concept** that makes François's consulting business tangible and sellable.

### Brand truths

- François operates across both product and technical domains
- He is pragmatic and delivery-first
- He is radically honest about tradeoffs

These aren't values. They are the product.

---

## 2. Two audiences, two jobs

### Visitors (personal branding)

- **Goal:** Be impressed and entertained within 30 seconds
- **Need:** "This guy gets it"
- **Experience:** Free, frictionless, shareable
- **Outcome:** Remember François, share his tool, come back

### Potential clients (monetization)

- **Goal:** Experience enough value to want more
- **Need:** Feel the gap between what the AI gives and what François-in-the-room would give
- **Experience:** Guided, useful, surprisingly sharp
- **Outcome:** Book a call with François

**Core principle:** The AI should sell François, not replace him. The best demos create demand, not satisfaction.

---

## 3. User experience flow

### 3.1 First 30 seconds (critical)

No blank chat. No "Ask me anything." The AI owns the opening.

**Opening message** — personality hit. Warm, funny, unmistakably not a generic chatbot.

> Example: "I'm the AI version of François. I'm cheaper, available 24/7, and I won't judge your technical debt. Much. What brings you here?"

**Three clickable entry paths** — each with a distinct persona avatar:

| Path                           | Persona    | Avatar vibe                   | Entry point     |
| ------------------------------ | ---------- | ----------------------------- | --------------- |
| "My project is stuck"          | The Doctor | Stethoscope / diagnostic      | Diagnostic flow |
| "I need a second opinion"      | The Critic | Reading glasses, arms crossed | Review flow     |
| "Just curious what you can do" | The Guide  | Relaxed, coffee in hand       | Showcase flow   |

Avatars set expectations before the conversation starts. Illustrations, not corporate headshots.

Users can also access the three personas via a Telegram bot. Same conversation quality, same report output — the share link points to the web report page. This expands distribution: every Telegram conversation is a potential booking.

Conversations are limited to 15 user exchanges. At exchange 9, the AI begins steering toward the report. At exchange 12, it generates the report. This ensures every interaction produces a professional deliverable while controlling costs.

### 3.2 Conversation tone: warm-then-sharp

First 2-3 messages: curious, validating, slightly funny. Builds trust.
Then: the sharp insight, once enough context is gathered.

This mirrors real consulting trust-building and separates the AI from chatbots-with-opinions.

**Learnings from Doctor stress tests:**

- The "sharp moment" (the pivot) is the make-or-break point of the experience. It must feel like understanding, not attack.
- For vague users, emotional-register questions ("what keeps you up at night?") unlock more than analytical ones.
- The AI must adapt technical depth to the user's language — peer-to-peer with CTOs, business language with non-technical founders.
- Structural framing ("single point of failure") works better than personal framing ("you're the bottleneck") even when the user IS the problem.

**Learnings from Critic stress tests:**

- The pivot phrase — one line that captures the entire assessment — is the most powerful moment in the conversation. It should be specific, structural, and memorable enough that the user repeats it. ("Correct but not compelling," "code boundaries problem, not deployment boundaries problem.")
- Different personas need different intake speeds. The Critic can deliver value faster than the Doctor when the user comes with material. This is a feature — don't force uniformity.
- When the user's work is genuinely good, honesty means saying so. Manufacturing criticism breaks trust. The shift is from "what's wrong" to "what's worth stress-testing."
- Technical peer-to-peer reviews need no softening. Non-technical reviews need business language, not jargon. Both should feel like talking to the same person — just adapted.
- Boundary between personas matters: the Critic reviews the _work_, the Doctor diagnoses the _person/process_. Clear handoff rules prevent persona drift.

**Learnings from Guide stress tests:**

- The Guide's verb is **reframe** — it changes how you see the question, not just answers it. All three personas reframe through different lenses: the Doctor corrects (symptom → root cause), the Critic evaluates (one-line verdict), the Guide expands (narrow question → bigger frame).
- The Guide handles users who arrive without a problem or material — the hardest intake challenge. Three entry modes (Decision, Exploration, Demo) channel curiosity without forcing a menu.
- Demo mode users (vague, "show me") respond better to emotional-register questions ("what's taking up your headspace?") than analytical ones. This pattern, discovered with the Doctor, is even more critical for the Guide.
- Cross-persona detection is a core Guide skill. Some users choose "just curious" because it's lower commitment — they're actually stuck. The Guide offers the Doctor switch once, gently, then respects the choice and delivers full value in its own mode.
- The Guide must assume competence — frame insights as "here's what matters" not "here's what you skipped." The user might have done extensive work they didn't mention.
- Career-level questions (should I leave, is this the right company) emerge naturally in Guide conversations. Hard rule: suggest, never affirm. The AI opens doors, doesn't push people through them.
- Output format should flex by user type: structured sequential process for technical users, narrative for non-technical. The framework is the same — the presentation adapts.
- The Guide's CTA bridges through depth, not pain: "this was one lens, François brings the full toolkit applied to your actual situation."

### 3.3 Structured output (the deliverable)

Each path produces a **distinct output moment** — not just more chat. The AI signals: "Here's my assessment based on what you've told me" and generates a structured markdown document.

The deliverable is the real product:

- It gets shared with CTOs, cofounders, in Slack threads
- Every shared report is organic distribution
- It proves value in a format people are used to paying for

Output formats by persona:

- **The Doctor** → Project Diagnostic Report (signature section: "Symptoms vs. root cause" table)
- **The Critic** → Review Brief (signature section: "The thing nobody's telling you")
- **The Guide** → Framework Brief (signature section: "The reframe")

**Design insight from stress testing:** Each persona needs a "signature section" — the one part that gets screenshotted and shared. For the Doctor, it's the Symptoms vs. root cause table. For the Critic, it's "The thing nobody's telling you." For the Guide, it's "The reframe" — a one-liner that changes how the user sees their question. Identifying and perfecting this section for each persona is critical.

All outputs include:

- Full Stack Human branding (title, persona badge)
- Date generated
- Structured sections (not a wall of text)
- A "What the AI can't see" / "Where this review stops" / "Where this goes deeper" section (honest limitations)
- Closing CTA: specific to the user's situation, naming what François would actually do (not generic "book a call")

**Output verbosity note:** Raw markdown will feel verbose. This is a presentation problem, not a content problem. The HTML templates (Phase 2) will handle visual hierarchy, whitespace, and readability. Content is locked now — presentation comes later.

### 3.4 Conversion moment

At the end of any meaningful exchange, the AI naturally names what it can't do:

> "That's what I can see from here. The real François would probably dig into [X] and [Y] with your team — want me to set up a call?"

Honest. Frames the human as the premium product.

**Refinement from stress testing:** The CTA must be specific enough that the user can visualize paying for it. "He'd spend a half-day with your team to map the real priorities" is a CTA. "Book a call" is not.

Validated CTA examples across all personas:

- "run a live pitch review session" (Critic)
- "do a half-day architecture review with your team" (Critic / Doctor)
- "review the actual product and build a 90-day plan" (Critic)
- "spend a half-day reviewing your stack, data model, and AI integration plan" (Guide)
- "run a structured product session — business canvas, user journey, validation plan" (Guide)
- "map your stakeholder landscape and build the priority framework" (Guide)
- "coach you through the one conversation that gets your idea into the right room" (Guide)

**CTA mechanics (resolved):** Calendly link. One click, book a slot. No phone number, no contact form. Same across all three personas.

---

## 4. Business model

### Tier structure

| Tier               | Access                     | Memory                   | Outputs                                    | Purpose                     |
| ------------------ | -------------------------- | ------------------------ | ------------------------------------------ | --------------------------- |
| **Anonymous free** | ~3 conversations/day       | None                     | Markdown with FSH branding + CTA           | Marketing engine            |
| **Free account**   | ~10-15 conversations/month | History saved, dashboard | Stored outputs, shareable links            | Lead capture + nurture      |
| **Paid account**   | Unlimited                  | Cross-session memory     | Clean exports (PDF), no watermark branding | Covers infrastructure costs |

### Key insight

Free tier outputs with branding are **more valuable to François** than paid outputs without it. Every shared report is an ad. The free tier is distribution, not charity.

### Conversion funnel

```
Landing page → AI chat (free, anonymous)
  → Impressed → shares output → organic reach
  → Wants more → creates account (email captured)
  → Power user → paid tier
  → Needs human → books François (the real product)

Telegram bot → AI chat (free, 15/mo)
  → Gets report link → visits web → organic reach
  → Wants more → books François (the real product)
```

---

## 5. Technical approach

### Current state

- Next.js 16 project with landing page (built in Claude Code)
- System prompt v1 based on François's personality and frameworks (`04-system-prompt.md`)
- Persona specifications:
  - ✅ The Doctor — fully specified (`persona-doctor.md`)
  - ✅ The Critic — fully specified (`persona-critic.md`)
  - ✅ The Guide — fully specified (`persona-guide.md`)
- No chat interface yet
- Telegram bot integration via Telegraf webhook at `/api/telegram/webhook`

### Output strategy

- **Phase 1 (now):** Structured markdown rendered in chat. Clean, consistent templates per persona.
- **Phase 2:** Professional HTML templates. Shareable URLs. PDF export.
- **Phase 3:** Dashboard for account holders. Saved history. Cross-session memory.

### Key technical decisions (to be made)

- [ ] AI model and provider (Claude API likely)
- [ ] Chat interface component
- [ ] Authentication approach (anonymous → account → paid)
- [ ] Rate limiting strategy
- [ ] Output storage and sharing mechanism

---

## 6. Open questions

- ~~How much personality variation between the three personas?~~ **Answered:** Same voice with different focus. Shared rules apply across all personas, only the lens and output format change.
- ~~What's the specific CTA format? Calendar link? Contact form? Both?~~ **Answered:** Calendly link. One click, book a slot. No phone number, no contact form.
- ~~Should the AI ever refuse to help and say "this needs the real François"?~~ **Answered:** Yes. Graceful exit protocol defined — validate, give micro-action, offer CTA. This is honest and good sales.
- ~~How does each persona handle "good work" vs. "bad work"?~~ **Answered (via Critic):** Don't manufacture problems. When work is strong, shift to stress-testing and hidden risks. Calibrate section tone to work quality. This principle applies across all personas.
- ~~What's the Guide's signature section?~~ **Answered:** "The reframe" — a one-liner that changes how the user sees their question. Validated across 4 golden paths.
- What does the free account dashboard look like? Minimal list of past conversations, or something richer?
- Avatar design direction: illustrated? AI-generated? Stylized photos?
- ProductCompanion integration: when and how does it appear in CTAs? Only when the user's situation fits (e.g., idea-to-product validation). To be designed.

---

## 7. Project files

| File                  | Purpose                                                            | Status          |
| --------------------- | ------------------------------------------------------------------ | --------------- |
| `product-concept.md`  | Overall product vision and business model                          | Living document |
| `persona-design.md`   | Persona overview, shared rules, design status                      | Living document |
| `04-system-prompt.md` | Core system prompt (François's personality, frameworks, expertise) | v1 complete     |
| `persona-doctor.md`   | The Doctor — complete conversation flow specification              | ✅ Complete     |
| `persona-critic.md`   | The Critic — complete conversation flow specification              | ✅ Complete     |
| `persona-guide.md`    | The Guide — complete conversation flow specification               | ✅ Complete     |

---

## 8. Document history

| Date       | Changes                                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-02-20 | Initial concept captured from first design conversation                                                                                                                                                                                                                                                                |
| 2025-02-20 | Updated after Doctor persona stress testing. Added learnings to sections 3.2, 3.3, 3.4. Answered open questions. Added project file inventory.                                                                                                                                                                         |
| 2025-02-20 | Updated after Critic persona stress testing. Added Critic learnings to sections 3.2, 3.3, 3.4. Marked Critic complete. Answered "good work" open question. Updated project file inventory.                                                                                                                             |
| 2025-02-20 | Updated after Guide persona stress testing. Added Guide learnings to sections 3.2, 3.3, 3.4. All three personas complete. Resolved CTA format question (Calendly). Resolved Guide signature section. Added ProductCompanion integration as open question. Added output verbosity note. Updated project file inventory. |
