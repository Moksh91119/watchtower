import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export * from "./schema.js";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.DATABASE_SSL === "true" ? "require" : undefined,
});

export const db = drizzle(client);
