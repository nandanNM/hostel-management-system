import "server-only"

import webPush, { WebPushError } from "web-push"

import prisma from "@/lib/prisma"

export type PushPayload = {
  title: string
  body: string
  icon?: string
  image?: string
  url?: string
  tag?: string
}

function vapidDetails() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT

  if (!publicKey || !privateKey || !subject) return null

  return { subject, publicKey, privateKey }
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  const details = vapidDetails()
  if (!details || userIds.length === 0) return { sent: 0, removed: 0 }

  // Selected by having a subscription, not by `pushEnabled`. That flag is a
  // per-account convenience that drifts out of sync - a device unsubscribed
  // from browser settings, or a subscription pruned below as expired, leaves
  // it stuck on. The subscription rows are the only real record of where a
  // notification can actually be delivered.
  const recipients = await prisma.user.findMany({
    where: { id: { in: userIds }, subscriptions: { some: {} } },
    include: { subscriptions: true },
  })

  let sent = 0
  let removed = 0
  const prunedByUser = new Map<string, number>()

  const pushPromises = recipients
    .map((recipient) => {
      const subscriptions = recipient.subscriptions || []
      return subscriptions.map((sub) =>
        webPush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
            { vapidDetails: details }
          )
          .then(() => {
            sent += 1
          })
          .catch(async (error) => {
            console.error("Error sending push notification", error)
            if (
              error instanceof WebPushError &&
              (error.statusCode === 404 || error.statusCode === 410)
            ) {
              removed += 1
              prunedByUser.set(
                recipient.id,
                (prunedByUser.get(recipient.id) ?? 0) + 1
              )
              await prisma.subscription
                .delete({ where: { id: sub.id } })
                .catch(() => {})
            }
          })
      )
    })
    .flat()

  await Promise.all(pushPromises)

  // Pruning the last device used to leave `pushEnabled` true forever, so the
  // settings toggle kept claiming push was on while nothing was delivered.
  for (const [userId] of prunedByUser) {
    const left = await prisma.subscription.count({ where: { userId } })
    if (left === 0) {
      await prisma.user
        .update({ where: { id: userId }, data: { pushEnabled: false } })
        .catch(() => {})
    }
  }

  return { sent, removed }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload)
}
