import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { audit } from "./audit";
export const media = table("posr_media", {
  id: t.uuid("id").primaryKey().defaultRandom(),
  auditId: t.text("audit_id"),
  type: t.text("type").notNull(), // assuming enum, can enhance later
  url: t.text("url").notNull(),
  createdAt: t
    .timestamp("created_at", { mode: "string" })
    .defaultNow()
    .notNull(),
});

export const mediaRelations = relations(media, ({ one }) => ({
  audit: one(audit, {
    fields: [media.auditId],
    references: [audit.id],
  }),
}));
