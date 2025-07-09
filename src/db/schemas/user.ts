import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { fine, guestmeal, meal, payment } from "@/db/schemas";
import { InferSelectModel, relations } from "drizzle-orm";

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
    onboarding: t.boolean("onboarding").default(false),
    role: rolesEnum().default("user").notNull(),
    isBoader: t.boolean("is_boader").default(false).notNull(),
    isBanned: t.boolean("is_banned").default(false).notNull(),
    banReason: t.text("ban_reason"),
    bannedBy: t.text("banned_by"),
    // hostel details
    hostel: t.jsonb("hostel").$type<{
      hostelName: string;
      hostelTag: string;
      hostelId: string;
      roomNo: string;
    }>(),
    //user ditails
    gender: genderEnum().default("male"),
    religion: religionEnum().default("hindu"),
    dob: t.date("dob"),
    selfPhNo: t.varchar("self_ph_no", { length: 15 }).unique(),
    address: t.text("address"),
    bio: t.text("bio"),
    // user education
    education: t.jsonb("education").$type<{
      degree: string;
      admissionYear: number;
      passingYear: number;
      institute: string;
    }>(),

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

export type SelectUserModel = InferSelectModel<typeof user>;
