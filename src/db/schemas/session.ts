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
export const verificationTokens = t.pgTable(
  "verificationToken",
  {
    identifier: t.text("identifier").notNull(),
    token: t.text("token").notNull(),
    expires: t.timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: t.primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);

export const authenticators = t.pgTable(
  "authenticator",
  {
    credentialID: t.uuid("credentialID").notNull().unique(),
    userId: t
      .uuid("user_Id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerAccountId: t.text("providerAccountId").notNull(),
    credentialPublicKey: t.text("credentialPublicKey").notNull(),
    counter: t.integer("counter").notNull(),
    credentialDeviceType: t.text("credentialDeviceType").notNull(),
    credentialBackedUp: t.boolean("credentialBackedUp").notNull(),
    transports: t.text("transports"),
  },
  (authenticator) => [
    {
      compositePK: t.primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);
