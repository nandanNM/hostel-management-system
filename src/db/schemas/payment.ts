import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { audit, user } from "@/db/schemas";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const payment = table(
  "payments",
  {
    id: t.uuid("id").primaryKey().defaultRandom(),
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    auditId: t
      .uuid("audit_id")
      .notNull()
      .references(() => audit.id, { onDelete: "cascade" }),
    amount: t.integer("amount").notNull(),
    createdAt: t
      .timestamp("created_at", { mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (payment) => {
    return {
      paymentAk1: t.unique("payment_ak_1").on(payment.userId, payment.auditId),
    };
  },
);

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
  audit: one(audit, {
    fields: [payment.auditId],
    references: [audit.id],
  }),
}));

export const paymentSchema = createInsertSchema(payment);
export type PaymentSchema = z.infer<typeof paymentSchema>;
export type SelectPaymentModel = InferSelectModel<typeof payment>;
