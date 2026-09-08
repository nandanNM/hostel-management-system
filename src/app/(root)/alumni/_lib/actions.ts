"use server"

import { revalidatePath } from "next/cache"
import { ApiResponse } from "@/types"

import { UserRoleType } from "@/lib/generated/prisma"
import getSession from "@/lib/get-session"
import prisma from "@/lib/prisma"

import { AlumniInput, alumniSchema } from "./validations"

/**
 * Alumni are managed exclusively by the mess prefect. Plain managers can view
 * the directory but cannot add, edit, remove, or transfer alumni. Returns the
 * actor id when authorized, otherwise an error response to surface to the UI.
 */
async function requireMessPrefectActor(): Promise<
  { actorId: string } | { error: ApiResponse }
> {
  const session = await getSession()
  const actorId = session?.user?.id
  if (!actorId || session.user.role !== UserRoleType.MESS_PREFECT) {
    return {
      error: {
        status: "error",
        message: "Only the mess prefect can manage alumni.",
      },
    }
  }
  return { actorId }
}

export async function createAlumni(input: AlumniInput): Promise<ApiResponse> {
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

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
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

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
  const auth = await requireMessPrefectActor()
  if ("error" in auth) return auth.error
  const { actorId } = auth

  try {
    const existing = await prisma.alumni.findUnique({ where: { id } })
    if (!existing) return { status: "error", message: "Alumni not found" }

    // Guest meals booked for this alumnus name them for the discount they
    // were charged at, and the foreign key is RESTRICT so those rows keep
    // their explanation. Say that plainly rather than letting the database's
    // constraint error reach the prefect.
    const bookings = await prisma.guestMeal.count({ where: { alumniId: id } })
    if (bookings > 0) {
      return {
        status: "error",
        message: `${existing.name} has ${bookings} guest meal booking(s) on record and cannot be removed - those bills name them for the alumni rate they were charged.`,
      }
    }

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
