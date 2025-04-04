import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { users } from "@/db/schema";
import { relations } from "drizzle-orm";

export const fineStatusEnum = t.pgEnum("fine_status", ["paid", "unpaid"]);
export const fines = table("fines", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: t.text("reason").notNull(),
  amount: t.real("amount").notNull(),
  status: fineStatusEnum().notNull().default("unpaid"),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull()
    .defaultNow(),
});

export const fineRelations = relations(fines, ({ one }) => ({
  user: one(users, {
    fields: [fines.userId],
    references: [users.id],
  }),
}));
