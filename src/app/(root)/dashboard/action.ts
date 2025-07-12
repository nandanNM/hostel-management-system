"use server";

import { db } from "@/db";
import { fine, guestmeal, meal, payment } from "@/db/schemas";

import { requireUser } from "@/lib/require-user";
import { ApiResponse } from "@/types";
import { eq } from "drizzle-orm";

// switch user status

export async function toggleMealStatus(
  isActive: boolean,
): Promise<ApiResponse> {
  const session = await requireUser();
  if (!session?.user.id) {
    return {
      status: "error",
      message: "Unauthorized",
    };
  }
  if (!session.user.isBoader) {
    return {
      status: "error",
      message: "Unauthorized - You are not a boarder member",
    };
  }
  try {
    await db
      .update(meal)
      .set({ isActive })
      .where(eq(meal.userId, session.user.id));
    return {
      status: "success",
      message: "Meal status updated successfully",
    };
  } catch (error) {
    console.log("error", error);
    return {
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}

export async function getUserDeshboardStats() {
  const session = await requireUser();
  if (!session?.user.id) {
    return {
      status: "error",
      message: "Unauthorized",
    };
  }
  const [totalGuestMeals, totalPayments, totalFines] = await Promise.all([
    await db.$count(guestmeal),
    await db.query.payment.findMany({
      where: eq(payment.userId, session.user.id),
      columns: {
        amount: true,
      },
    }),
    await db.$count(fine),
  ]);
  const totalPayedAmount = totalPayments.reduce(
    (acc, payment) => acc + payment.amount,
    0,
  );
  return { totalGuestMeals, totalPayedAmount, totalFines };
}
