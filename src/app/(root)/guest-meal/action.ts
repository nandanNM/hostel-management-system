"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { ApiResponse } from "@/types";

export const deleteGuestMealRequest = async (
  id: string,
): Promise<ApiResponse> => {
  try {
    const session = await requireUser();
    if (!session?.user.id) {
      return {
        status: "error",
        message: "Unauthorized",
      };
    }
    await prisma.guestMeal.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    return {
      status: "success",
      message: "Guest meal request deleted successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    };
  }
};
