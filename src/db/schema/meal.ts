import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { users } from "@/db/schema";
import { relations } from "drizzle-orm";

export const mealTypeEnum = t.pgEnum("meal_type", ["veg", "non-veg"]);
export const nonVegTypeEnum = t.pgEnum("non_veg_type", [
  "chicken",
  "fish",
  "egg",
  "none",
]);
export const mealTimeEnum = t.pgEnum("meal_time", [
  "breakfast",
  "lunch",
  "dinner",
]);
export const meals = table("meals", {
  id: t.uuid("id").primaryKey().defaultRandom().unique(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum().notNull().default("none"), // Default to "None" if veg
  mealTime: mealTimeEnum().notNull(),
  isActive: t.boolean("is_active").notNull().default(true), // Default active
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull()
    .defaultNow(),
});

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
}));
