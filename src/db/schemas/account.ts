import { pgTable as table, primaryKey } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas";
import * as t from "drizzle-orm/pg-core";
import { AdapterAccountType } from "next-auth/adapters";
export const account = table(
  "accounts",
  {
    userId: t
      .uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
