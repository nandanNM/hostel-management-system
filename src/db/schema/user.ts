import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { fine, guestmeal, meal, payment } from "@/db/schema";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rolesEnum = pgEnum("role", [
  "guest",
  "user",
  "manager",
  "staff",
  "admin",
  "superadmin",
]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const religionEnum = pgEnum("religion", [
  "hindu",
  "muslim",
  "christian",
  "sikh",
  "jain",
  "buddhist",
  "jewish",
  "other",
]);
export const user = table(
  "users",
  {
    id: t.uuid("id").primaryKey().defaultRandom(),
    name: t.text("name"),
    email: t.text("email").unique(),
    emailVerified: t.timestamp("emailVerified", { mode: "date" }),
    image: t.text("image"),
    role: rolesEnum().default("user").notNull(),
    isBoader: t.boolean("is_boader").default(false).notNull(),
    isBanned: t.boolean("is_banned").default(false).notNull(),
    banReason: t.text("ban_reason"),
    bannedBy: t.text("banned_by"),
    //user ditails
    hostelName: t.varchar("hostel_name", { length: 255 }),
    hostelTag: t.varchar("hostel_tag", { length: 50 }),
    hostelId: t.varchar("hostel_id", { length: 50 }),
    roomNo: t.integer("room_no"),
    gender: genderEnum().default("male"),
    religion: religionEnum().default("hindu"),
    dob: t.date("dob"),
    education: t.jsonb("education").$type<{
      degree: string;
      admissionYear: number;
      passingYear: number;
      institute: string;
    }>(),
    selfPhNo: t.varchar("self_ph_no", { length: 15 }).unique(),
    address: t.text("address"),
    bio: t.text("bio"),
    message: t.text("message"),
    totalDueAmount: t.real("total_due_amount").default(0),
    totalCarryForwardAmount: t.real("total_carry_forward_amount").default(0),
    createdAt: t
      .timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (user) => ({
    nameIndex: t.index().on(user.name),
    phoneIndex: t.index().on(user.selfPhNo),
  }),
);

export const userRelations = relations(user, ({ one, many }) => ({
  meal: one(meal),
  payments: many(payment),
  fines: many(fine),
  guestmeals: many(guestmeal),
}));

const baseSchema = createInsertSchema(user, {
  gender: z.enum(["male", "female", "other"]),
  role: z.enum(["guest", "user", "manager", "staff", "admin", "superadmin"]),
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
}).pick({
  gender: true,
  role: true,
  religion: true,
});
export const userSchema = z.union([
  z.object({
    mode: z.literal("edit"),
    id: z.string().uuid(),
    isBoader: z.boolean(),
    emailVerified: z.date().optional(),
    hostelName: z
      .string()
      .min(5, { message: "Hostel name must be greater than 5 characters" })
      .max(255),
    hostelTag: z
      .string()
      .min(1, { message: "Hostel tag must be greater than 0 characters" })
      .max(50),
    hostelId: z
      .string()
      .min(1, { message: "Hostel ID must be greater than 0 characters" })
      .max(50, { message: "Hostel ID must be less than 50 characters" }),
    roomNo: z
      .number()
      .min(1, { message: "Room number must be greater than 0" }),
    ...baseSchema.shape,
  }),
  z.object({
    mode: z.literal("banned"),
    id: z.string().uuid(),
    banReason: z.string().min(1, { message: "Ban reason must be provided" }),
    bannedBy: z.string().min(1, { message: "Banned by must be provided" }),
  }),
  z.object({
    mode: z.literal("changeRole"),
    id: z.string().uuid(),
    role: z.enum(["guest", "user", "manager", "staff", "admin", "superadmin"]),
  }),
]);

export type UserSchema = z.infer<typeof userSchema>;
export type SelectUserModel = InferSelectModel<typeof user>;
