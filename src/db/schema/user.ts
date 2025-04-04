import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";

import * as t from "drizzle-orm/pg-core";
import { fines, guestmeals, meals, payments } from "@/db/schema";
import { relations } from "drizzle-orm";

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
export const users = table("users", {
  id: t.uuid("id").primaryKey().defaultRandom().unique(),
  name: t.text("name"),
  email: t.text("email").unique(),
  emailVerified: t.timestamp("emailVerified", { mode: "date" }),
  image: t.text("image"),
  role: rolesEnum().default("user"),
  isBanned: t.boolean("is_banned").default(false).notNull(),
  banReason: t.text("ban_reason"),
  bannedBy: t.text("banned_by"),
  //user ditails
  hostelName: t.varchar("hostel_name", { length: 255 }),
  hostelTag: t.varchar("hostel_tag", { length: 50 }),
  hostelId: t.varchar("hostel_id", { length: 50 }),
  roomNo: t.integer("room_no").notNull(),
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
  totalDueAmount: t.real("total_due_amount").default(0).notNull(),
  totalCarryForwardAmount: t
    .real("total_carry_forward_amount")
    .default(0)
    .notNull(),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull()
    .defaultNow(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  meal: one(meals),
  payments: many(payments),
  fines: many(fines),
  guestmeals: many(guestmeals),
}));
