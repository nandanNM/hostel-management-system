"use server";

import { db } from "@/db";
import { meal } from "@/db/schemas";
import getSession from "@/lib/getSession";
import { ApiResponse } from "@/types";
import { eq } from "drizzle-orm";

// switch user status

export const toggleMealStatus = async (
  isActive: boolean,
): Promise<ApiResponse> => {
  const session = await getSession();
  if (!session?.user.id) {
    return {
      status: "error",
      message: "Unauthorized",
    };
  }
  try {
    await db
      .update(meal)
      .set({ isActive })
      .where(eq(meal.userId, session.user.id));
    return { status: "success", message: "Meal status updated successfully" };
  } catch (error) {
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    };
  }
};
