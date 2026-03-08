import type { PartyKitServer } from 'partykit/server'

export default {
  async onFetch() {
    return new Response('OK', { status: 200 })
  },
} satisfies PartyKitServer
