import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using default SQLite database");
  process.env.DATABASE_URL = "postgresql://username:password@localhost:5432/cricket_db";
}

const connectionString = process.env.DATABASE_URL;

let client: postgres.Sql<{}>;
let db: ReturnType<typeof drizzle>;

try {
  client = postgres(connectionString, {
    onnotice: () => {}, // Suppress notices
    max: 1, // Limit connections for development
  });
  db = drizzle(client, { schema });
} catch (error) {
  console.error("Database connection failed:", error);
  // Create a mock db for development
  client = postgres(connectionString);
  db = drizzle(client, { schema });
}

export { db };