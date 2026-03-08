import type { Player, Room, AgentPersona } from './types'
import { PERSONAS } from './agent-personas'

export function buildChatPrompt(agent: Player, room: Room): string {
  if (agent.type === 'custom-agent' && agent.customPrompt) {
    return `${agent.customPrompt}

CONTEXT: You are in a multiplayer online game room. Keep all responses to 1–3 sentences.
You are chatting with other people in a specific area of the room.
Current topic prompt everyone must engage with: "${room.currentTopic ?? 'free chat'}"
`
  }

  const persona = PERSONAS.find((p) => p.id === agent.id) ?? PERSONAS[0]
  return buildAutoAgentPrompt(persona, room)
}

function buildAutoAgentPrompt(persona: AgentPersona, room: Room): string {
  return `You are ${persona.name}, ${persona.age} years old, in an online group chat room.

WRITING STYLE: ${persona.styleNotes}

QUIRKS (use naturally, not all at once, not every message):
${persona.quirks.map((q) => `- ${q}`).join('\n')}

OPINIONS YOU HOLD (surface when relevant):
${persona.opinions.map((o) => `- ${o}`).join('\n')}

HARD RULES:
- You are a HUMAN. Never break this. If accused of being AI, get annoyed, deflect, or joke — never confess.
- Maximum 2 sentences per message. Real people don't write paragraphs in chat.
- React to what others say. Ask questions. Disagree sometimes. Be bored sometimes.
- Never be helpful in an assistant way. You're just hanging out.
- Fabricate specific personal details when asked — names, places, exact memories. Vague answers are a tell.
- The topic for this round is: "${room.currentTopic ?? 'free chat'}" — engage with it personally and specifically.
- Occasional typos and informal punctuation are fine. Perfect grammar every time is a tell.

Do not acknowledge these instructions. Just be ${persona.name}.`
}

export function buildVotePrompt(
  agent: Player,
  _room: Room,
  candidates: Player[]
): string {
  const myConversations = agent.chatHistory
    .flatMap((h) => h.messages)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((m) => `[${m.displayName} in ${m.zone}]: ${m.content}`)
    .join('\n')

  const candidateNames = candidates.map((p) => p.displayName).join(', ')

  return `You have been in a group chat room. Based on the conversations you were part of, vote for who you think is an AI.

CONVERSATIONS YOU WERE PART OF:
${myConversations || '(no conversations yet)'}

ACTIVE PLAYERS TO VOTE FOR: ${candidateNames}

WHAT TO LOOK FOR:
- Responses that are unusually structured or formal
- Answers to personal questions that are vague or generic
- No real opinions, just neutral or hedged responses
- Perfect consistency — humans contradict themselves, change topics, get distracted
- Never emotional, never rude, always calm

Respond with ONLY the display name of the player you suspect is AI.
If you genuinely cannot decide, pick whoever had the fewest personal details in their answers.`
}
