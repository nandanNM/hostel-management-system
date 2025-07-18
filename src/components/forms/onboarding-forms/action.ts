"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { onboardingSchema, User } from "@/lib/validations";
import { ApiResponse } from "@/types";

export const createUserOnboarding = async (
  values: User,
): Promise<ApiResponse> => {
  try {
    const validation = await onboardingSchema.safeParseAsync(values);
    const session = await requireUser();
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      };
    }
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        ...values,
        hostelId: values.hostel.hostelId,
      },
    });
    return {
      status: "success",
      message: "Boader onboarding successfully.🎉",
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
};
