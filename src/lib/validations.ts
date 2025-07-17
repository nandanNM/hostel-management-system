import { z } from "zod";

// Basic user info
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["male", "female", "other"]),
  religion: z.enum([
    "hindu",
    "muslim",
    "christian",
    "sikh",
    "jain",
    "buddhist",
    "jewish",
    "other",
  ]),
  dob: z.date(),
  phone: z
    .string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must be numbers only"),
  address: z.string().min(1, "Address is required"),
});

// Education info
const educationSchema = z
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
const hostelSchema = z.object({
  name: z.string().min(1, "Hostel name required"),
  tag: z.string().min(1, "Hostel tag required"),
  id: z.string().min(1, "Hostel ID required"),
  roomNo: z.string().min(1, "Room number required"),
});

// Meal preferences
const mealSchema = z.object({
  type: z.enum(["veg", "non-veg"]),
  nonVegType: z.enum(["chicken", "fish", "egg", "none"]).optional(),
  message: z.string().optional(),
});

// Complete onboarding form
export const onboardingSchema = z.object({
  ...userSchema.shape,
  hostel: hostelSchema,
  education: educationSchema,
  meal: mealSchema,
});

// Guest meal booking
export const guestMealSchema = z.object({
  name: z.string().min(1, "Name required"),
  date: z.date(),
  mealTime: z.enum(["day", "night"]),
  numberOfMeals: z.number().min(1, "At least 1 meal required"),
  phone: z.string().min(1, "Phone required"),
  charge: z.number().min(1, "Charge must be positive"),
  ...mealSchema.shape,
});

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

// Simple meal toggle
export const toggleMealSchema = z.object({
  isActive: z.boolean(),
});

// Types for TypeScript
export type User = z.infer<typeof onboardingSchema>;
export type GuestMeal = z.infer<typeof guestMealSchema>;
export type BanUser = z.infer<typeof banUserSchema>;
export type ChangeRole = z.infer<typeof changeRoleSchema>;
