"use server"

import { revalidatePath } from "next/cache"
import requireMessPrefect from "@/data/mess-prefect/require-mess-prefect"
import { ApiResponse } from "@/types"
import { z } from "zod"

import { UserRoleType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["STUDENT", "STAFF", "MANAGER", "MESS_PREFECT"]),
})

const updateDetailsSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(100),
  selfPhNo: z.string().trim().max(20).optional().default(""),
  roomNo: z.string().trim().max(20).optional().default(""),
})

export type AssignRoleInput = z.infer<typeof assignRoleSchema>
export type UpdateManagerDetailsInput = z.infer<typeof updateDetailsSchema>

export async function assignRole(input: AssignRoleInput): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = assignRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { status: "error", message: "Invalid input" }
  }
  const { userId, role } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    })
    if (!target) return { status: "error", message: "User not found" }
    if (target.id === actorId) {
      return { status: "error", message: "You cannot change your own role." }
    }
    if (target.role === role) {
      return { status: "success", message: "Role is already set." }
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { role } }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "ROLE_CHANGE",
          entityType: "USER",
          entityId: userId,
          oldData: { role: target.role },
          newData: { role },
          details: `Changed ${target.name ?? userId}'s role from ${
            target.role
          } to ${role}.`,
        },
      }),
    ])

    revalidatePath("/mess-prefect/managers")
    return {
      status: "success",
      message:
        role === UserRoleType.MANAGER
          ? `${target.name ?? "User"} is now a Manager.`
          : `Role updated to ${role}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}

export async function updateManagerDetails(
  input: UpdateManagerDetailsInput
): Promise<ApiResponse> {
  const session = await requireMessPrefect()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = updateDetailsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: `Invalid form data - ${parsed.error.issues[0]?.message ?? "check your input"}`,
    }
  }
  const { userId, name, selfPhNo, roomNo } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, selfPhNo: true, roomNo: true },
    })
    if (!target) return { status: "error", message: "User not found" }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name,
          selfPhNo: selfPhNo || null,
          roomNo: roomNo || null,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: actorId,
          actionType: "USER_DETAILS_UPDATE",
          entityType: "USER",
          entityId: userId,
          oldData: {
            name: target.name,
            selfPhNo: target.selfPhNo,
            roomNo: target.roomNo,
          },
          newData: { name, selfPhNo: selfPhNo || null, roomNo: roomNo || null },
          details: `Updated profile details for ${name}.`,
        },
      }),
    ])

    revalidatePath("/mess-prefect/managers")
    return { status: "success", message: "Details updated successfully. ✨" }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    }
  }
}
