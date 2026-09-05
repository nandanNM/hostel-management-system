import "server-only"

import { addDays } from "date-fns"

import prisma from "@/lib/prisma"
import { decidePushPrompt, type PushPromptState } from "@/lib/push-rules"
import { requireUser } from "@/lib/require-user"

export { decidePushPrompt, type PushPromptState } from "@/lib/push-rules"

export const PUSH_PROMPT_REMIND_DAYS = 3

/**
 * Push is per-device state, so every answer here is about the device asking.
 *
 * It used to be answered from `User.pushEnabled`, a single boolean for the
 * whole account. Enabling on a laptop set it, and every other device then read
 * "already on": never prompted, toggle stuck showing enabled, no subscription
 * row ever created for it. Notifications only ever reached whichever device
 * happened to subscribe first.
 *
 * `endpoint` is the browser's own push endpoint, or null when it has none.
 */
export async function getPushPromptState(
  endpoint?: string | null
): Promise<PushPromptState> {
  const session = await requireUser()

  const [user, subscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        pushEnabled: true,
        pushPromptSkipped: true,
        pushPromptRemindAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      select: { endpoint: true },
    }),
  ])

  if (!user) {
    return {
      shouldPrompt: false,
      enabledHere: false,
      otherDevices: 0,
      skipped: false,
      remindAt: null,
    }
  }

  const decision = decidePushPrompt({
    endpoint: endpoint ?? null,
    endpoints: subscriptions.map((sub) => sub.endpoint),
    skipped: user.pushPromptSkipped,
    remindAt: user.pushPromptRemindAt,
  })

  // The flag drifts: a subscription pruned as expired, or unsubscribed from
  // browser settings, leaves it stuck on. Reconcile it whenever we look.
  if (user.pushEnabled !== subscriptions.length > 0) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: { pushEnabled: subscriptions.length > 0 },
      })
      .catch(() => {})
  }

  return {
    ...decision,
    skipped: user.pushPromptSkipped,
    remindAt: user.pushPromptRemindAt,
  }
}

export async function remindPushPromptLater(days = PUSH_PROMPT_REMIND_DAYS) {
  const session = await requireUser()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pushPromptRemindAt: addDays(new Date(), days),
      pushPromptSkipped: false,
    },
  })
}

export async function skipPushPrompt() {
  const session = await requireUser()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushPromptSkipped: true, pushPromptRemindAt: null },
  })
}
