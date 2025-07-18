"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { guestMealSchema, GuestMeal } from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function createGuestMeal(values: GuestMeal): Promise<ApiResponse> {
  const validation = await guestMealSchema.safeParseAsync(values);
  if (!validation.success) {
    return {
      status: "error",
      message: "Invalid Form Data",
    };
  }
  try {
    const session = await requireUser();
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      };
    }

    await prisma.guestMeal.create({
      data: {
        ...values,
        nonVegType: values.nonVegType ?? "NONE",
        userId: session.user.id,
      },
    });
    return {
      status: "success",
      message: "Guest meal created successfully. 🎉",
    };
  } catch (error) {
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
