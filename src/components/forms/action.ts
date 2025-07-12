"use server";

import { db } from "@/db";
import { guestmeal } from "@/db/schemas";
import { requireUser } from "@/lib/require-user";
import {
  createGuestMealSchema,
  CreateGuestMealValues,
} from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function createGuestMeal(
  values: CreateGuestMealValues,
): Promise<ApiResponse> {
  const validation = await createGuestMealSchema.safeParseAsync(values);
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
    await db.insert(guestmeal).values({
      ...values,
      userId: session.user.id,
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
