import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { audits, users } from "@/db/schema";
import { relations } from "drizzle-orm";

export const payments = table("payments", {
  id: t.uuid("id").primaryKey().defaultRandom().unique(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  auditId: t
    .text("auditId")
    .notNull()
    .references(() => audits.id, { onDelete: "cascade" }),
  amount: t.integer("amount").notNull(),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull()
    .defaultNow(),
});

export const paymentRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  audit: one(audits, {
    fields: [payments.auditId],
    references: [audits.id],
  }),
}));
