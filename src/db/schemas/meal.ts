import * as t from "drizzle-orm/pg-core";
import { pgTable as table, pgEnum } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas";
import { InferSelectModel } from "drizzle-orm";

export const mealTypeEnum = pgEnum("meal_type", ["veg", "non-veg"]);
export const nonVegTypeEnum = pgEnum("non_veg_type", [
  "chicken",
  "fish",
  "egg",
  "none",
]);
export const meal = table("meals", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum(),
  isActive: t.boolean("is_active").default(false).notNull(),
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

export type SelectMealModel = InferSelectModel<typeof meal>;
