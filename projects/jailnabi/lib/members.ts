import type { Member } from './types'

/**
 * Hardcoded Hanabi member list.
 *
 * Adding a new member = one line here. IDs must be unique kebab-case slugs.
 * Aliases are earned through gameplay and updated manually.
 */
export const MEMBERS: Member[] = [
  {
    id: 'fabien-c',
    name: 'Fabien C.',
    role: 'Co-founder, Architecture & Transformation SI',
    aliases: [],
  },
  {
    id: 'fabien-d',
    name: 'Fabien D.',
    role: 'Co-founder, IT Program Director',
    aliases: [],
  },
  { id: 'salma-b', name: 'Salma B.', role: 'Project Manager', aliases: [] },
  {
    id: 'maximilian-p',
    name: 'Maximilian P.',
    role: 'IT Program Director',
    aliases: [],
  },
  {
    id: 'lea-d',
    name: 'Léa D.',
    role: 'Strategy & Organization Consultant',
    aliases: [],
  },
  {
    id: 'sinan-e',
    name: 'Sinan E.',
    role: 'Digital Workplace Project Director',
    aliases: [],
  },
  { id: 'francois-s', name: 'François S.', role: 'Tech Lead', aliases: [] },
  {
    id: 'amadou-b',
    name: 'Amadou B.',
    role: 'Senior Full-Stack Developer',
    aliases: [],
  },
]

/** Quick lookup by member ID */
export const MEMBERS_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]))

/** Get member by ID, throws if not found */
export function getMember(id: string): Member {
  const member = MEMBERS_BY_ID.get(id)
  if (!member) throw new Error(`Unknown member: ${id}`)
  return member
}

/** Check if a member ID is valid */
export function isValidMemberId(id: string): boolean {
  return MEMBERS_BY_ID.has(id)
}
