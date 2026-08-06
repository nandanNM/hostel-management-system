"use server"

import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { sendBoarderInviteEmail } from "@/lib/email"
import {
  createInviteToken,
  DEFAULT_INVITE_TTL_DAYS,
  inviteUrl,
  normaliseEmail,
  resolveAppBaseUrl,
} from "@/lib/invitations"
import prisma from "@/lib/prisma"

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  stayUntil: z.string().optional(),
})

export type InviteInput = z.infer<typeof inviteSchema>

export async function sendTemporaryBoarderInvite(
  input: InviteInput
): Promise<ApiResponse & { link?: string }> {
  try {
    const session = await requireMessPrefect()
    const actorId = session.user.id
    if (!actorId) return { status: "error", message: "Unauthorized" }

    const parsed = inviteSchema.safeParse(input)
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid invitation",
      }
    }

    const email = normaliseEmail(parsed.data.email)

    // Someone who already has an account does not need an invitation, and
    // sending one would imply their existing role is about to change.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existing) {
      return {
        status: "error",
        message: "That email already has an account.",
      }
    }

    const secret = process.env.AUTH_SECRET
    if (!secret) {
      return {
        status: "error",
        message:
          "AUTH_SECRET is not configured, so invitations cannot be signed.",
      }
    }

    const token = createInviteToken(
      { email, temporary: true, stayUntil: parsed.data.stayUntil || null },
      secret
    )
    const link = inviteUrl(resolveAppBaseUrl(), token)

    const sent = await sendBoarderInviteEmail({
      to: email,
      inviteUrl: link,
      invitedBy: session.user.name ?? null,
      stayUntil: parsed.data.stayUntil || null,
      expiresInDays: DEFAULT_INVITE_TTL_DAYS,
    })

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        actionType: "CREATE",
        entityType: "INVITATION",
        newData: {
          email,
          stayUntil: parsed.data.stayUntil || null,
          emailSent: sent,
        },
        details: `Invited ${email} as a temporary boarder.`,
      },
    })

    return {
      status: "success",
      // The link is returned either way, so a failed send is recoverable by
      // copying it rather than starting over.
      message: sent
        ? `Invitation sent to ${email}.`
        : `Could not send the email. Copy the link below and share it with ${email}.`,
      link,
    }
  } catch (error) {
    console.error("sendTemporaryBoarderInvite error:", error)
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}
