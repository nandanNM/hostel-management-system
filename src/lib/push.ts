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

  const recipients = await prisma.user.findMany({
    where: { id: { in: userIds }, pushEnabled: true },
    include: { subscriptions: true },
  })

  let sent = 0
  let removed = 0

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
              await prisma.subscription.delete({ where: { id: sub.id } })
            }
          })
      )
    })
    .flat()

  await Promise.all(pushPromises)

  return { sent, removed }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  return sendPushToUsers([userId], payload)
}
