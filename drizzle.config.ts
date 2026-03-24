import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || "mysql://localhost/dummy";
// DATABASE_URL is optional for development without database

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
