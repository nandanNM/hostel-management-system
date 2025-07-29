"use server"

import { UserStatusType } from "@/generated/prisma"
import { ApiResponse } from "@/types"

import prisma from "@/lib/prisma"
import { requireUser } from "@/lib/require-user"
import { onboardingSchema, User } from "@/lib/validations"

export const createUserOnboarding = async (
  values: User
): Promise<ApiResponse> => {
  try {
    const validation = await onboardingSchema.safeParseAsync(values)
    const session = await requireUser()
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      }
    }
    if (!validation.success) {
      return {
        status: "error",
        message: `Invalid Form Data - ${validation.error.message}`,
      }
    }
    Promise.all([
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          ...values,
          onboardingCompleted: true,
          status: UserStatusType.INACTIVE,
        },
      }),
      await prisma.meal.create({
        data: {
          ...values.mealPreference,
          hostelId: values.hostelId,
          userId: session.user.id,
        },
      }),
    ])
    return {
      status: "success",
      message: "Boader onboarding successfully.🎉",
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong",
    }
  }
}
