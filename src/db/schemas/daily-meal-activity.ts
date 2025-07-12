import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { mealTimeEnum } from "./guest-meal";

export const dailyMealActivity = table("daily_meal_activity", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  mealTime: mealTimeEnum(),
  presentUserIds: t
    .jsonb("meal_on_users")
    .$type<string[]>()
    .default([])
    .notNull(),
  totalGuestMeals: t.integer("total_guest_meals").default(0),
  totalVeg: t.integer("total_veg").default(0),
  totalNonvegChicken: t.integer("total_nonveg_chicken").default(0),
  totalNonvegFish: t.integer("total_nonveg_fish").default(0),
  totalNonvegEgg: t.integer("total_nonveg_egg").default(0),
  massages: t.json("massages").$type<string[]>().notNull().default([]),
  createdAt: t
    .timestamp("created_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "string", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dailyMealActivitySchema = createInsertSchema(dailyMealActivity);

export type DailyMealActivitySchema = z.infer<typeof dailyMealActivitySchema>;
export type SelectDailyMealActivity = InferSelectModel<
  typeof dailyMealActivity
>;
