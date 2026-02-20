# Full Stack Human — Claude Code Transition Guide

> Everything you need to go from design to implementation.
> Generated: 2025-02-20

---

## What this project is

Full Stack Human is an AI-powered consulting tool that productizes François — a product and tech leader with 15+ years of experience. Users interact with an AI that embodies François's thinking through three personas (Doctor, Critic, Guide). The AI is the proof of concept that drives consulting bookings.

**Product concept:** `product-concept.md`

---

## What's been done

### Design phase (complete)

All design work happened in Claude.ai conversations. Every decision is documented and stress-tested.

| Deliverable                                   | Status      | File                    |
| --------------------------------------------- | ----------- | ----------------------- |
| Product concept & business model              | ✅ Complete | `product-concept.md`    |
| François's personality, expertise, frameworks | ✅ Complete | `system-prompt-core.md` |
| Persona overview & shared rules               | ✅ Complete | `persona-design.md`     |
| The Doctor — design spec                      | ✅ Complete | `persona-doctor.md`     |
| The Critic — design spec                      | ✅ Complete | `persona-critic.md`     |
| The Guide — design spec                       | ✅ Complete | `persona-guide.md`      |
| The Doctor — prompt-ready                     | ✅ Complete | `prompt-doctor.md`      |
| The Critic — prompt-ready                     | ✅ Complete | `prompt-critic.md`      |
| The Guide — prompt-ready                      | ✅ Complete | `prompt-guide.md`       |

### Existing codebase

- Next.js 16 project with landing page (built in a previous Claude Code session)
- No chat interface yet
- No API integration yet

---

## File inventory and purpose

### Prompt files (production — used by the app)

These are the files your backend sends to the AI model.

| File                    | Purpose                                                                 | When to send                                     |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `system-prompt-core.md` | François's DNA — identity, expertise, tone, shared persona rules        | **Always** — included in every conversation      |
| `prompt-doctor.md`      | Doctor operating instructions — opening, intake, pivot, output template | When user selects "My project is stuck"          |
| `prompt-critic.md`      | Critic operating instructions — opening, intake, pivot, output template | When user selects "I need a second opinion"      |
| `prompt-guide.md`       | Guide operating instructions — opening, intake, pivot, output template  | When user selects "Just curious what you can do" |

**Assembly logic:**

```
system_prompt = system-prompt-core.md + prompt-[selected-persona].md
```

**Token budget per assembled prompt:**

| Combination   | ~Tokens |
| ------------- | ------- |
| Core + Doctor | 5,200   |
| Core + Critic | 5,500   |
| Core + Guide  | 5,900   |

### Design files (documentation — not used by the app)

These are the design specs with rationale, stress test notes, and golden-path scenarios. Reference them when iterating on the prompts, but don't send them to the model.

| File                 | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `product-concept.md` | Product vision, business model, UX flow, learnings from stress testing |
| `persona-design.md`  | Persona overview, shared rules, design insights, next steps            |
| `persona-doctor.md`  | Full Doctor spec with 4 golden-path scenarios and design rationale     |
| `persona-critic.md`  | Full Critic spec with 4 golden-path scenarios and design rationale     |
| `persona-guide.md`   | Full Guide spec with 4 golden-path scenarios and design rationale      |

---

## Architecture decisions (already made)

| Decision                | Choice                                                            | Rationale                                                               |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Prompt architecture     | Dynamic assembly: core + persona per conversation                 | Keeps each prompt lean, avoids sending 3 personas when only 1 is active |
| Persona switching       | No mid-conversation switch. Suggest and link to new conversation. | API system prompt can't change mid-conversation. V1 simplicity.         |
| CTA mechanics           | Calendly link — one click, book a slot                            | No phone, no contact form. Same across all personas.                    |
| Output format (Phase 1) | Structured markdown rendered in chat                              | Content locked, presentation comes later with HTML templates            |
| Language                | Respond in user's language (French ↔ English)                     | Matches François's real multilingual practice                           |

---

## Architecture decisions (to make during implementation)

| Decision             | Options to consider                                       | Notes                                                                |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| AI model & provider  | Claude API (likely)                                       | Sonnet for speed/cost, Opus for quality. Test both with the prompts. |
| Chat UI component    | Build custom, or use a library (e.g., Vercel AI SDK chat) | Needs to support markdown rendering and persona selection            |
| Persona selection UI | Three clickable cards with avatars on landing/chat page   | See `product-concept.md` section 3.1 for design direction            |
| Authentication       | Anonymous → Free account → Paid                           | Phase 1 can be anonymous-only. Email capture comes later.            |
| Rate limiting        | ~3 conversations/day for anonymous                        | Prevents abuse while keeping the free tier useful                    |
| Output storage       | TBD                                                       | Needed for shareable links (Phase 2)                                 |
| Conversation memory  | None for V1                                               | Each conversation is standalone                                      |

---

## Immediate next steps

### Step 0 — Validate prompts with real model (before building UI)

1. Take `system-prompt-core.md` + `prompt-doctor.md`, paste as system prompt in Claude API or a Claude Project
2. Run 3-4 conversations as different user types
3. Check: does the AI follow the flow? Opens correctly? Right number of questions? Pivot lands? Report format correct?
4. Repeat for Critic and Guide
5. Adjust prompt files based on what you find

**This step catches prompt issues before you build UI around them.**

### Step 1 — Chat interface

- Persona selection screen (3 paths with avatars)
- Chat interface with markdown rendering
- API integration with dynamic prompt assembly
- First message is always the persona's fixed opening (don't wait for user input)

### Step 2 — Output rendering

- Detect when the AI generates a report (starts with `# 🩺` or `# 🔍` or `# 🧭`)
- Render it distinctly from regular chat messages (card, different styling)
- Include clickable Calendly CTA link in footer

### Step 3 — Polish

- Landing page → chat transition
- Avatar design for the three personas
- Mobile responsiveness
- Rate limiting

---

## Key product rules to enforce in UI

- **No blank chat.** The AI sends the opening message first. The user never sees an empty input field.
- **Persona selection is the entry point.** Three paths, visually distinct. Not a dropdown — clickable cards or buttons with personality.
- **Reports are shareable.** Even in Phase 1, make it easy to copy the markdown. Phase 2 adds shareable URLs.
- **Branding on free outputs.** Every report includes "Full Stack Human" branding and the CTA. This is distribution, not decoration.
- **One persona per conversation.** No switching. If the AI suggests a different persona, the UI should support starting a new conversation with that persona.

---

## CLAUDE.md suggestion

When setting up the project in Claude Code, consider adding this to your `CLAUDE.md`:

```markdown
# Full Stack Human

## Project context

AI consulting tool that productizes François through three personas (Doctor, Critic, Guide).
See product-concept.md for full vision.

## Prompt architecture

System prompt = system-prompt-core.md + prompt-[persona].md
Backend assembles dynamically based on user's persona selection.
Never send all three persona files at once.

## Key files

- system-prompt-core.md — always included in API calls
- prompt-doctor.md / prompt-critic.md / prompt-guide.md — one per conversation
- persona-\*.md files (without prompt- prefix) are design docs, not for the API

## Tech stack

- Next.js 16
- Claude API (model TBD — test Sonnet and Opus)
- Markdown rendering in chat

## Rules

- AI sends first message (persona opening) — never show empty chat
- One persona per conversation, no mid-conversation switching
- Reports detected by heading pattern (🩺 / 🔍 / 🧭) and rendered as cards
- All outputs include Calendly CTA link
- Respond in user's language (French ↔ English)
```

---

## What NOT to build yet

- User accounts / authentication (Phase 2)
- Conversation history / dashboard (Phase 3)
- Cross-session memory (Phase 3)
- HTML report templates / PDF export (Phase 2)
- ProductCompanion integration (TBD)
- Avatar illustrations (nice-to-have, use placeholders)

---

## Where to find design decisions

If you need to understand _why_ something was designed a certain way:

| Question                                       | Where to look                                     |
| ---------------------------------------------- | ------------------------------------------------- |
| Why three personas? What does each do?         | `persona-design.md`                               |
| What's the conversation flow for each persona? | `persona-[name].md` (design specs)                |
| What stress tests were run?                    | Golden-path sections in each `persona-[name].md`  |
| What shared rules apply across personas?       | `persona-design.md` → "Shared rules" section      |
| What's the business model?                     | `product-concept.md` → section 4                  |
| What UX decisions were made?                   | `product-concept.md` → section 3                  |
| What's still open?                             | `product-concept.md` → section 6 (Open questions) |
