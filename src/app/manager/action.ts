"use server";

import requireManager from "@/data/manager/require-manager";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types";

export async function approveGuestMealRequest(
  requestId: string,
): Promise<ApiResponse> {
  const session = await requireManager();
  if (!session?.user.hostelId)
    return {
      status: "error",
      message: "Unauthorized - Hostel ID not found",
    };
  try {
    await prisma.guestMeal.update({
      where: {
        id: requestId,
        hostelId: session.user.hostelId,
      },
      data: {
        status: "ACTIVE",
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

export async function declineGuestMealRequest(
  requestId: string,
): Promise<ApiResponse> {
  await requireManager();
  try {
    prisma.guestMeal.update({
      where: {
        id: requestId,
      },
      data: {
        status: "REJECTED",
      },
    });
    return {
      status: "success",
      message: "Guest meal request declined successfully",
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
