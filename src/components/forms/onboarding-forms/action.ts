"use server";

import { db } from "@/db";
import { meal, user } from "@/db/schemas";
import getSession from "@/lib/getSession";
import {
  onboardingUserSchema,
  OnboardingUserSchemaUserValues,
} from "@/lib/validations";
import { ApiResponse } from "@/types";

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
      ...values,
      dob: values.dob instanceof Date ? values.dob.toISOString() : values.dob,
    };
    await db.insert(user).values(dataToInsert);
    await db.insert(meal).values({
      userId: session?.user.id,
      ...values.meal,
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
