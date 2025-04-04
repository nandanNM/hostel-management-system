import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { users } from "@/db/schema";
export const sessions = table("sessions", {
  sessionToken: t.text("sessionToken").primaryKey(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: t.timestamp("expires", { mode: "date" }).notNull(),
});
