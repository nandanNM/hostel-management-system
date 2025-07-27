"use server";
import requireManager from "@/data/manager/require-manager";
import { MealStatusType } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types";

export async function updateUserMealStatus(
  mealId: string,
  status: MealStatusType,
): Promise<ApiResponse> {
  const session = await requireManager();
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    };
  try {
    await prisma.meal.update({
      where: {
        id: mealId,
      },
      data: {
        status,
      },
    });
    return {
      status: "success",
      message: "Guest meal request approved successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    };
  }
}
