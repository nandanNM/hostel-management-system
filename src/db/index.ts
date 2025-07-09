import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schemas";
// import env from "@/lib/env";

// const sql = neon(env.DATABASE_URL);
// export const db = drizzle(sql, { schema });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }, // For Neon, SSL is required
});

const db = drizzle(pool, { schema });

export { db };
