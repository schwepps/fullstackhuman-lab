/**
 * AI Skills of the Day — rotating prompt techniques.
 *
 * Skills are assigned sequentially to rounds (not calendar days)
 * to prevent mid-round skill changes when rounds span multiple days.
 */

export interface AISkill {
  id: string
  name: string
  tip: string
  example: string
  postVerdictTemplate: string
}

export const AI_SKILLS: AISkill[] = [
  {
    id: 'role-assignment',
    name: 'Give AI a role',
    tip: 'Tell the AI WHO it should be',
    example: '"As the office gossip, describe how..."',
    postVerdictTemplate:
      "This round's skill was 'Give AI a role.' {detail} Try this next time you use AI at work — giving it a persona makes outputs more creative and specific!",
  },
  {
    id: 'specificity',
    name: 'Be specific',
    tip: 'Details make AI outputs 10x better',
    example: 'Name exact meetings, dates, amounts, or colleagues',
    postVerdictTemplate:
      "This round's skill was 'Be specific.' {detail} The more context you give AI, the more realistic and useful the output — vague prompts get vague results!",
  },
  {
    id: 'step-by-step',
    name: 'Step by step',
    tip: 'Ask AI to think in stages',
    example: '"First show the email, then the angry reply..."',
    postVerdictTemplate:
      "This round's skill was 'Step by step.' {detail} Breaking tasks into stages helps AI produce more structured, detailed output!",
  },
  {
    id: 'comparisons',
    name: 'Use comparisons',
    tip: 'Show AI what you want by example',
    example: '"Like a passive-aggressive LinkedIn post..."',
    postVerdictTemplate:
      "This round's skill was 'Use comparisons.' {detail} Giving AI a reference point is one of the fastest ways to get exactly the tone you want!",
  },
  {
    id: 'boundaries',
    name: 'Set boundaries',
    tip: 'Tell AI exactly what format you want',
    example: '"In exactly 3 expense lines, prove..."',
    postVerdictTemplate:
      "This round's skill was 'Set boundaries.' {detail} Constraining the format forces AI to be creative within limits — just like this game!",
  },
  {
    id: 'persona',
    name: 'Create a character',
    tip: 'Give the AI a personality to write as',
    example: '"Write as an overly enthusiastic PM..."',
    postVerdictTemplate:
      "This round's skill was 'Create a character.' {detail} A strong character voice makes AI outputs feel authentic and entertaining!",
  },
  {
    id: 'wildcard',
    name: 'Wild card',
    tip: 'Surprise the judge — any technique goes',
    example: 'Combine techniques or invent your own approach',
    postVerdictTemplate:
      'This was a wild card round — any technique was fair game. {detail} The best prompts often combine multiple skills!',
  },
]

/** Get the skill for a given round number (0-indexed, cycles through skills) */
export function getSkillForRound(roundNumber: number): AISkill {
  return AI_SKILLS[roundNumber % AI_SKILLS.length]
}
