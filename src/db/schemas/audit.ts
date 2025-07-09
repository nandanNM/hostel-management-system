import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { InferSelectModel, relations } from "drizzle-orm";
import { payment, user } from "@/db/schemas";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const audit = table(
  "audits",
  {
    id: t.uuid("id").primaryKey().defaultRandom(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "no action" }),
    // action: t.text("action").notNull(),
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
    createdAt: t
      .timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (audit) => ({
    dateIndex: t.index().on(audit.date),
  }),
);

export const auditRelations = relations(audit, ({ one, many }) => ({
  user: one(user, {
    fields: [audit.userId],
    references: [user.id],
  }),
  payments: many(payment),
}));

export const auditSchema = createInsertSchema(audit);

export type AuditSchema = z.infer<typeof auditSchema>;

export type SelectAuditModel = InferSelectModel<typeof audit>;
