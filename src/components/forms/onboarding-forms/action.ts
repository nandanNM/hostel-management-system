"use server";

import { db } from "@/db";
import { meal, user } from "@/db/schemas";
import getSession from "@/lib/getSession";
import {
  onboardingUserSchema,
  OnboardingUserSchemaUserValues,
} from "@/lib/validations";
import { ApiResponse } from "@/types";
import { eq } from "drizzle-orm";

export const CreateUserOnboarding = async (
  values: OnboardingUserSchemaUserValues,
): Promise<ApiResponse> => {
  try {
    const validation = await onboardingUserSchema.safeParseAsync(values);
    const session = await getSession();
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
    const dataToInsert = {
      name: values.name,
      gender: values.gender,
      religion: values.religion,
      selfPhNo: values.selfPhNo,
      address: values.address,
      hostel: values.hostel,
      education: values.education,
      dob: values.dob instanceof Date ? values.dob.toISOString() : values.dob,
      onboarding: true,
    };
    console.log(dataToInsert);
    await db.update(user).set(dataToInsert).where(eq(user.id, session.user.id));
    await db
      .insert(meal)
      .values({
        userId: session.user.id,
        ...values.meal,
      })
      .onConflictDoUpdate({
        target: meal.id,
        set: {
          ...values.meal,
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
