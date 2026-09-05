/**
 * Whether push notifications are on is a question about *a browser*, not about
 * an account: each device holds its own subscription. Kept free of Prisma and
 * auth imports so the decision can be tested on its own.
 */

export type PushPromptState = {
  shouldPrompt: boolean
  /** Whether *this* browser is subscribed — not whether the user is, anywhere. */
  enabledHere: boolean
  /** How many of the user's other devices are subscribed. */
  otherDevices: number
  skipped: boolean
  remindAt: Date | null
}

/**
 * The whole decision, as a pure function so it can be tested without a
 * database. Kept separate because the account-wide version of this logic is
 * what silenced every second device.
 */
export function decidePushPrompt({
  endpoint,
  endpoints,
  skipped,
  remindAt,
  now = new Date(),
}: {
  /** The asking browser's endpoint, or null when it has never subscribed. */
  endpoint: string | null
  /** Every endpoint currently registered for this account. */
  endpoints: string[]
  skipped: boolean
  remindAt: Date | null
  now?: Date
}): Omit<PushPromptState, "skipped" | "remindAt"> {
  const enabledHere = endpoint ? endpoints.includes(endpoint) : false
  const otherDevices = endpoints.filter((e) => e !== endpoint).length
  const snoozed = remindAt !== null && remindAt > now

  return {
    // Prompt on any device that is not subscribed yet, even when another one
    // already is. Skip and snooze stay account-wide: they mean "stop asking
    // me", not "stop asking me here".
    shouldPrompt: !enabledHere && !skipped && !snoozed,
    enabledHere,
    otherDevices,
  }
}
