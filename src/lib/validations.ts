import { z } from "zod";

// Basic user info
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  religion: z.enum(["HINDU", "MUSLIM", "CHRISTIAN", "OTHER"]),
  dob: z.date(),
  selfPhNo: z
    .string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must be numbers only"),
  guardianPhNo: z
    .string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must be numbers only")
    .optional(),
  address: z.string().min(1, "Address is required"),
});

// Education info
export const educationSchema = z
  .object({
    degree: z
      .string()
      .min(2, "Degree name too short")
      .max(100, "Degree name too long"),
    admissionYear: z.number().int().min(1900).max(new Date().getFullYear()),
    passingYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 10),
    institute: z
      .string()
      .min(3, "Institute name too short")
      .max(255, "Institute name too long"),
  })
  .refine((data) => data.passingYear >= data.admissionYear, {
    message: "Passing year must be after admission year",
    path: ["passingYear"],
  });

// Hostel info
export const hostelSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID required"),
  name: z.string().min(1, "Hostel name required"),
  tag: z.string().min(1, "Hostel tag required"),
  address: z.string().min(1, "Address is required"),
});

// Meal preferences
export const mealSchema = z.object({
  type: z.enum(["VEG", "NON_VEG"]),
  nonVegType: z
    .enum(["CHICKEN", "FISH", "EGG", "NONE"])
    .default("NONE")
    .optional(),
  message: z.string().optional(),
});

// Complete onboarding form
export const onboardingSchema = z
  .object({
    ...userSchema.shape,
    hostel: hostelSchema,
    education: educationSchema,
    mealPreference: mealSchema,
  })
  .refine(
    (data) =>
      data.mealPreference.type === "VEG" ||
      (data.mealPreference.type === "NON_VEG" &&
        data.mealPreference.nonVegType !== "NONE"),
    {
      message: "nonVegType must be set if meal is NON_VEG",
      path: ["nonVegType"],
    },
  );

// Guest meal booking
export const guestMealSchema = z
  .object({
    name: z.string().min(1, "Name required"),
    date: z.date(),
    mealTime: z.enum(["LUNCH", "DINNER"]),
    numberOfMeals: z.number().int().min(1, "At least 1 meal required"),
    mobileNumber: z
      .string()
      .length(10, "Phone must be 10 digits")
      .regex(/^\d+$/, "Phone must be numbers only"),
    mealCharge: z.number().positive("Charge must be positive"),
    ...mealSchema.shape,
  })
  .refine(
    (data) =>
      data.type === "VEG" ||
      (data.type === "NON_VEG" && data.nonVegType !== "NONE"),
    {
      message: "nonVegType must be set if meal is NON_VEG",
      path: ["nonVegType"],
    },
  );

// Admin actions
export const banUserSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, "Ban reason required"),
  bannedBy: z.string().min(1, "Banned by required"),
});

export const changeRoleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["guest", "user", "manager", "staff", "admin", "superadmin"]),
});

// Types for TypeScript
export type User = z.infer<typeof onboardingSchema>;
export type GuestMeal = z.infer<typeof guestMealSchema>;
export type BanUser = z.infer<typeof banUserSchema>;
export type ChangeRole = z.infer<typeof changeRoleSchema>;
