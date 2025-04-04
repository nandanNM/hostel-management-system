import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { user } from "@/db/schema";
import { mealTimeEnum, mealTypeEnum, nonVegTypeEnum } from "@/db/schema/meal";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const guestmeal = table("guestmeals", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum().notNull(), // Default to "none" if veg
  mealTime: mealTimeEnum().notNull(),
  numberOfMeals: t.integer("number_of_meals").default(1).notNull(),
  mealCharge: t.real("meal_charge").notNull(),
  mobileNumber: t.varchar("mobile_number", { length: 15 }),
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
