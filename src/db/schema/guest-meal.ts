import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { users } from "@/db/schema";

import { mealTimeEnum, mealTypeEnum, nonVegTypeEnum } from "@/db/schema/meal";
import { relations } from "drizzle-orm";

export const guestmeals = table("guestmeals", {
  id: t.uuid("id").primaryKey().defaultRandom().unique(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum().notNull(),
  nonVegType: nonVegTypeEnum().notNull().default("none"), // Default to "none" if veg
  mealTime: mealTimeEnum().notNull(),
  numberOfMeals: t.integer("number_of_meals").notNull(),
  mealCharge: t.real("meal_charge").notNull(),
  mobileNumber: t.varchar("mobile_number", { length: 15 }),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const guestmealRelations = relations(guestmeals, ({ one }) => ({
  user: one(users, {
    fields: [guestmeals.userId],
    references: [users.id],
  }),
}));
