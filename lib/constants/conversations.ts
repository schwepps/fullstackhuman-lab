/** Maximum characters for auto-extracted conversation title */
export const MAX_TITLE_LENGTH = 100

/** Number of recent conversations shown on the chat persona selection screen */
export const RECENT_CONVERSATIONS_LIMIT = 6

/** Page size for the full conversations library */
export const CONVERSATIONS_PAGE_SIZE = 12

/** localStorage key for anonymous user conversations */
export const ANONYMOUS_CONVERSATIONS_KEY = 'fsh_anonymous_conversations'

/** Maximum number of conversations stored in localStorage for anonymous users */
export const MAX_ANONYMOUS_CONVERSATIONS = 10

/** localStorage flag to prevent duplicate anonymous→authenticated migration */
export const MIGRATION_DONE_KEY = 'fsh_conversations_migrated'
