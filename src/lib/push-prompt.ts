import "server-only"

import { addDays } from "date-fns"

import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"

export const PUSH_PROMPT_REMIND_DAYS = 3

export type PushPromptState = {
  shouldPrompt: boolean
  pushEnabled: boolean
  skipped: boolean
  remindAt: Date | null
}

export async function getPushPromptState(): Promise<PushPromptState> {
  const session = await requireUser()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      pushEnabled: true,
      pushPromptSkipped: true,
      pushPromptRemindAt: true,
      _count: { select: { subscriptions: true } },
    },
  })

  if (!user) {
    return {
      shouldPrompt: false,
      pushEnabled: false,
      skipped: false,
      remindAt: null,
    }
  }

  const hasSubscription = user._count.subscriptions > 0
  const snoozed =
    user.pushPromptRemindAt !== null && user.pushPromptRemindAt > new Date()

  return {
    shouldPrompt:
      !hasSubscription &&
      !user.pushEnabled &&
      !user.pushPromptSkipped &&
      !snoozed,
    pushEnabled: user.pushEnabled,
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

export async function setPushEnabled(enabled: boolean) {
  const session = await requireUser()

  await prisma.user.update({
    where: { id: session.user.id },
    data: enabled
      ? {
          pushEnabled: true,
          pushPromptSkipped: false,
          pushPromptRemindAt: null,
        }
      : { pushEnabled: false },
  })
}
