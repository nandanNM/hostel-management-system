"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { ApiResponse } from "@/types"

import { istDateOnly } from "@/lib/date"
import prisma from "@/lib/prisma"
import { Settings, settingsSchema } from "@/lib/validations"

export const updateUserSettings = async (
  values: Settings
): Promise<ApiResponse> => {
  try {
    const session = await auth()
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
        // Anchor to 00:00 IST so the stored instant and IST reads agree.
        dob: istDateOnly(values.dob),
        address: values.address,
      },
    })

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
