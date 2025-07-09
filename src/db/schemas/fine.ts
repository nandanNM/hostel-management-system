import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas";
import { InferSelectModel, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fine = table("fines", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: t.text("reason").notNull(),
  amount: t.real("amount").notNull(),
  isPayed: t.boolean("is_payed").default(false),
  createdAt: t
    .timestamp("created_at", { mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow(),
});

export const fineRelations = relations(fine, ({ one }) => ({
  user: one(user, {
    fields: [fine.userId],
    references: [user.id],
  }),
}));

export const fineSchema = createInsertSchema(fine);
export type FineSchema = z.infer<typeof fineSchema>;
export type SelectFineModel = InferSelectModel<typeof fine>;
