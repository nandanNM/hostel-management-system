"use server"

import { revalidatePath } from "next/cache"
import { ApiResponse } from "@/types"

import { cacheKeys, invalidate } from "@/lib/cache"
import { istDateOnly } from "@/lib/date"
import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { Settings, settingsSchema } from "@/lib/validations"

export const updateUserSettings = async (
  values: Settings
): Promise<ApiResponse> => {
  try {
    // requireUser() (not the raw auth() this used before) also rejects a
    // suspended/inactive/alumni session — a Server Action is its own
    // reachable endpoint, independent of the /settings layout's own guard.
    const session = await requireUser()
    if (!session?.user?.id) {
      return {
        status: "error",
        message: "Unauthorized - Please log in to continue",
      }
    }

    const validation = await settingsSchema.safeParseAsync(values)
    if (!validation.success) {
      return {
        status: "error",
        message: `Invalid Form Data - ${validation.error.message}`,
      }
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        selfPhNo: values.selfPhNo,
        dob: istDateOnly(values.dob),
        address: values.address,
      },
    })

    // The birthday widget is cached for the whole hostel.
    await invalidate(cacheKeys.birthdays())

    revalidatePath("/settings")

    return {
      status: "success",
      message: "Personal information updated successfully. ✨",
    }
  } catch (error) {
    console.error("Settings update error:", error)
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
    }
  }
}
