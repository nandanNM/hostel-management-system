import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { payments, users } from "@/db/schema";

export const audits = table("audits", {
  id: t.uuid("id").primaryKey().defaultRandom().unique(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "no action" }),
  action: t.text("action").notNull(),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),

  date: t.date("date").notNull(),
  totalFine: t.real("total_fine").notNull(),
  riceExpenditure: t.real("rice_expenditure").notNull(),
  vegetableExpenditure: t.real("vegetable_expenditure").notNull(),
  fishExpenditure: t.real("fish_expenditure").notNull(),
  dailyExpenditure: t.real("daily_expenditure").notNull(),
  grandTotalExpenditure: t.real("grand_total_expenditure").notNull(),
  adjustment: t.real("adjustment").notNull(),
  otherExpenditure: t.real("other_expenditure").notNull(),
  totalBoarders: t.integer("total_boarders").notNull(),
  mealCharge: t.real("meal_charge").notNull(),
});

export const auditRelations = relations(audits, ({ one, many }) => ({
  user: one(users, {
    fields: [audits.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));
