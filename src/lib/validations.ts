import { z } from "zod";
// user validations
const baseSchema = z.object({
  name: z.string().min(1, { message: "Name must be provided" }),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender must be provided",
  }),
  religion: z.enum(
    [
      "hindu",
      "muslim",
      "christian",
      "sikh",
      "jain",
      "buddhist",
      "jewish",
      "other",
    ],
    { message: "Religion must be provided" },
  ),
});
export const educationSchema = z
  .object({
    degree: z
      .string()
      .min(2, { message: "Degree name must be at least 2 characters" })
      .max(100, { message: "Degree name must be less than 100 characters" }),
    admissionYear: z
      .number({ invalid_type_error: "Admission year must be a number" })
      .int({ message: "Admission year must be an integer" })
      .min(1900, { message: "Admission year must be after 1900" })
      .max(new Date().getFullYear(), {
        message: `Admission year cannot be in the future`,
      }),
    passingYear: z
      .number({ invalid_type_error: "Passing year must be a number" })
      .int({ message: "Passing year must be an integer" })
      .min(1900, { message: "Passing year must be after 1900" })
      .max(new Date().getFullYear() + 10, {
        message: `Passing year looks too far in the future`,
      }),
    institute: z
      .string()
      .min(3, { message: "Institute name must be at least 3 characters" })
      .max(255, { message: "Institute name must be less than 255 characters" }),
  })
  .refine((data) => data.passingYear >= data.admissionYear, {
    message: "Passing year must be after or same as admission year",
    path: ["passingYear"],
  });
export const hostelSchema = z.object({
  hostelName: z.string().min(1, { message: "Hostel name must be provided" }),
  hostelTag: z.string().min(1, { message: "Hostel tag must be provided" }),
  hostelId: z.string().min(1, { message: "Hostel ID must be provided" }),
  roomNo: z.string().min(1, { message: "Room number must be provided" }),
});
// meal validations
export const baseMealFields = z.object({
  mealType: z.enum(["veg", "non-veg"]),
  nonVegType: z.enum(["chicken", "fish", "egg", "none"]).optional(),
  massage: z.string().optional(),
});
export const createMealSchema = baseMealFields;
export type CreateMealValues = z.infer<typeof createMealSchema>;
export const toggleMealStatusSchema = z.object({
  isActive: z.boolean(),
});
export type ToggleMealValues = z.infer<typeof toggleMealStatusSchema>;

export const editMealSchema = baseMealFields.extend({
  id: z.string().uuid(),
  mealType: z.enum(["veg", "non-veg"]),
  mealMassage: z.string().optional(),
  isActive: z.boolean(),
});
export type EditMealValues = z.infer<typeof editMealSchema>;
export const createGuestMealSchema = baseMealFields.extend({
  name: z.string().min(1, { message: "Name must be provided" }),
  mealTime: z.enum(["day", "night"]),
  numberOfMeals: z
    .number()
    .min(1, { message: "Number of meals must be at least 1" }),
  number: z.string().min(1, { message: "Mobile number must be provided" }),
  mealCharge: z.number().min(1, { message: "Meal charge must be at least 1" }),
});
export type CreateGuestMealValues = z.infer<typeof createGuestMealSchema>;

// user validations
export const onboardingUserSchema = baseSchema.extend({
  dob: z.date({ message: "Date of birth must be a date" }),
  selfPhNo: z
    .string()
    .min(1, { message: "Phone number must be provided" })
    .max(10, { message: "Phone number must be less than 10 characters" })
    .regex(/^\d+$/, { message: "Phone number must be a number" }),
  address: z.string().min(1, { message: "Address must be provided" }),
  hostel: hostelSchema,
  education: educationSchema,
  meal: createMealSchema,
});
export type OnboardingUserSchemaUserValues = z.infer<
  typeof onboardingUserSchema
>;

export const banUserSchema = z.object({
  mode: z.literal("banned"),
  id: z.string().uuid(),
  banReason: z.string().min(1, { message: "Ban reason must be provided" }),
  bannedBy: z.string().min(1, { message: "Banned by must be provided" }),
});
export type BanUserValues = z.infer<typeof banUserSchema>;

export const changeRoleSchema = z.object({
  mode: z.literal("changeRole"),
  id: z.string().uuid(),
  role: z.enum(["guest", "user", "manager", "staff", "admin", "superadmin"]),
});

export type ChangeRoleValues = z.infer<typeof changeRoleSchema>;
