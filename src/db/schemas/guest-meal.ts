import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas";
import { mealTypeEnum, nonVegTypeEnum } from "@/db/schemas/meal";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mealStatusEnum = t.pgEnum("guest_meal_status", [
  "pending",
  "accepted",
  "rejected",
]);
export const mealTimeEnum = t.pgEnum("meal_time", ["day", "night"]);

export const guestmeal = table("guestmeals", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: t.varchar("name", { length: 50 }).notNull(),
  number: t.varchar("phone_number", { length: 15 }).notNull(),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum(),
  mealTime: mealTimeEnum().notNull(),
  numberOfMeals: t.integer("number_of_meals").default(1).notNull(),
  mealCharge: t.real("meal_charge").notNull(),
  status: mealStatusEnum().default("pending").notNull(),
  massage: t.text("meal_massage"),
  createdAt: t
    .timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export const guestmealRelations = relations(guestmeal, ({ one }) => ({
  user: one(user, {
    fields: [guestmeal.userId],
    references: [user.id],
  }),
}));

export const guestmealSchema = createInsertSchema(guestmeal);
export type GuestMealSchema = z.infer<typeof guestmealSchema>;
export type SelectGuestMealModel = InferSelectModel<typeof guestmeal>;
