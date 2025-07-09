import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas";
export const session = table("sessions", {
  sessionToken: t.text("sessionToken").primaryKey(),
  userId: t
    .uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: t.timestamp("expires", { mode: "date" }).notNull(),
});
