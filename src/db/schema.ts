import type { AdapterAccountType } from "next-auth/adapters";
import { pgEnum, pgTable as table, primaryKey } from "drizzle-orm/pg-core";

import * as t from "drizzle-orm/pg-core";

const timestamps = {
  updated_at: t.timestamp(),
  created_at: t.timestamp().defaultNow().notNull(),
};
export const rolesEnum = pgEnum("roles", ["user", "admin"]);

export const users = table("users", {
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: t.text("name"),
  email: t.text("email").unique(),
  emailVerified: t.timestamp("emailVerified", { mode: "date" }),
  image: t.text("image"),
  role: rolesEnum().default("user"),
  ...timestamps,
});

export const accounts = table(
  "accounts",
  {
    userId: t
      .text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: t.text("type").$type<AdapterAccountType>().notNull(),
    provider: t.text("provider").notNull(),
    providerAccountId: t.text("providerAccountId").notNull(),
    refresh_token: t.text("refresh_token"),
    access_token: t.text("access_token"),
    expires_at: t.integer("expires_at"),
    token_type: t.text("token_type"),
    scope: t.text("scope"),
    id_token: t.text("id_token"),
    session_state: t.text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export const sessions = table("sessions", {
  sessionToken: t.text("sessionToken").primaryKey(),
  userId: t
    .text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: t.timestamp("expires", { mode: "date" }).notNull(),
});
