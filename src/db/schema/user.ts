import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";

import * as t from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["user", "admin"]);
export const user = table("users", {
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: t.text("name"),
  email: t.text("email").unique(),
  emailVerified: t.timestamp("emailVerified", { mode: "date" }),
  image: t.text("image"),
  role: rolesEnum().default("user"),
  createdAt: t.timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at", { mode: "date" })
    .$onUpdate(() => new Date())
    .notNull()
    .defaultNow(),
});
