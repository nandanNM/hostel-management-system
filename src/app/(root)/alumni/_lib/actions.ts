"use server"

import { revalidatePath } from "next/cache"

import requireManager from "@/data/manager/require-manager"
import prisma from "@/lib/prisma"
import { ApiResponse } from "@/types"

import { AlumniInput, alumniSchema } from "./validations"

export async function createAlumni(input: AlumniInput): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = alumniSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid alumni details.",
    }
  }

  try {
    const alumni = await prisma.alumni.create({ data: parsed.data })

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        actionType: "ALUMNI_CREATED",
        entityType: "ALUMNI",
        entityId: alumni.id,
        newData: parsed.data,
        details: `Added alumni ${parsed.data.name}.`,
      },
    })

    revalidatePath("/alumni")
    return { status: "success", message: "Alumni added successfully." }
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

export async function updateAlumni(
  input: AlumniInput & { id: string }
): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  const parsed = alumniSchema.safeParse(input)
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid alumni details.",
    }
  }

  try {
    const existing = await prisma.alumni.findUnique({ where: { id: input.id } })
    if (!existing) return { status: "error", message: "Alumni not found" }

    await prisma.alumni.update({ where: { id: input.id }, data: parsed.data })

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        actionType: "ALUMNI_UPDATED",
        entityType: "ALUMNI",
        entityId: input.id,
        oldData: {
          name: existing.name,
          department: existing.department,
          mobileNumber: existing.mobileNumber,
          email: existing.email,
          year: existing.year,
        },
        newData: parsed.data,
        details: `Updated alumni ${parsed.data.name}.`,
      },
    })

    revalidatePath("/alumni")
    return { status: "success", message: "Alumni updated successfully." }
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

export async function deleteAlumni(id: string): Promise<ApiResponse> {
  const session = await requireManager()
  const actorId = session?.user.id
  if (!actorId) return { status: "error", message: "Unauthorized" }

  try {
    const existing = await prisma.alumni.findUnique({ where: { id } })
    if (!existing) return { status: "error", message: "Alumni not found" }

    await prisma.alumni.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        userId: actorId,
        actionType: "ALUMNI_DELETED",
        entityType: "ALUMNI",
        entityId: id,
        oldData: {
          name: existing.name,
          department: existing.department,
          mobileNumber: existing.mobileNumber,
          email: existing.email,
          year: existing.year,
        },
        details: `Removed alumni ${existing.name}.`,
      },
    })

    revalidatePath("/alumni")
    return { status: "success", message: "Alumni removed successfully." }
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
