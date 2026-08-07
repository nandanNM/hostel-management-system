"use server"

import requireManager from "@/data/manager/require-manager"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { NotificationType, UserStatusType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { sendPushToUsers } from "@/lib/push"

const broadcastSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
  body: z.string().trim().min(1, "Message is required").max(300),
  url: z.string().trim().max(200).optional().default("/notifications"),
})

export type BroadcastNotificationInput = z.input<typeof broadcastSchema>

export async function sendBroadcastNotification(
  input: BroadcastNotificationInput
): Promise<ApiResponse & { sent?: number }> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = broadcastSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }
  const { title, body, url } = parsed.data

  try {
    const recipients = await prisma.user.findMany({
      where: {
        deletedAt: null,
        NOT: {
          status: { in: [UserStatusType.INACTIVE, UserStatusType.FORMA] },
        },
      },
      select: { id: true },
    })

    const recipientIds = recipients.map((u) => u.id)

    const [{ sent }] = await Promise.all([
      sendPushToUsers(recipientIds, {
        title,
        body,
        icon: "/app-icon-192.png",
        url: url || "/notifications",
        tag: `broadcast-${Date.now()}`,
      }),
      prisma.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          title,
          message: body,
          type: NotificationType.ANNOUNCEMENT,
          recipientId,
          issuerId: actorId,
        })),
      }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "BROADCAST_NOTIFICATION_SENT",
          entityType: "USER",
          entityId: actorId,
          newData: { title, body, recipientCount: recipientIds.length },
          details: `Sent a broadcast notification "${title}" to ${recipientIds.length} users.`,
        },
      }),
    ])

    return {
      status: "success",
      message: `Notification sent to ${recipientIds.length} user${recipientIds.length === 1 ? "" : "s"}.`,
      sent,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to send the notification.",
    }
  }
}
