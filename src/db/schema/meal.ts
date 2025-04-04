import * as t from "drizzle-orm/pg-core";
import { pgTable as table, pgEnum } from "drizzle-orm/pg-core";
import { user } from "@/db/schema";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mealTypeEnum = pgEnum("meal_type", ["veg", "non-veg"]);
export const nonVegTypeEnum = pgEnum("non_veg_type", [
  "chicken",
  "fish",
  "egg",
  "none",
]);
export const mealTimeEnum = pgEnum("meal_time", ["day", "night"]);
export const meal = table("meals", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum().notNull(),
  mealTime: mealTimeEnum(),
  isActive: t.boolean("is_active").notNull().default(true), // Default active
  createdAt: t
    .timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export const mealsRelations = relations(meal, ({ one }) => ({
  user: one(user, {
    fields: [meal.userId],
    references: [user.id],
  }),
}));

export const baseschema = createInsertSchema(meal, {
  nonVegType: z.enum(["chicken", "fish", "egg", "none"]),
  mealTime: z.enum(["day", "night"]),
}).pick({
  nonVegType: true,
  mealTime: true,
});

export const mealSchema = z.union([
  // Edit Mode Schema
  z.object({
    mode: z.literal("edit"), // Ensures mode is exactly "edit"
    id: z.string().uuid(), // Meal ID (required for edits)
    mealType: z.enum(["veg", "non-veg"]),
    isActive: z.boolean(),
    ...baseschema.shape,
  }),
  z.object({
    mode: z.literal("toggleStatus"),
    id: z.string().uuid(),
    isActive: z.boolean(),
  }),
  // Create Mode Schema
  z.object({
    mode: z.literal("create"), // Ensures mode is exactly "create"
    userId: z.string().uuid(), // Required for creating a meal
    mealType: z.enum(["veg", "non-veg"]),
    isActive: z.boolean().optional(),
    ...baseschema.shape,
  }),
]);

export type MealSchema = z.infer<typeof mealSchema>;
export type SelectMealModel = InferSelectModel<typeof meal>;
