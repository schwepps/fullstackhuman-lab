/** Shared result type for server actions */
export type ActionResult<T = void> =
  | ({ success: true } & (T extends void ? object : T))
  | { success: false; error: string }
