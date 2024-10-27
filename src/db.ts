import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env" });

const client = new Client({
  connectionString: process.env.GENERAL_DB!,
});

await client.connect();

// const sql = neon(process.env.GENERAL_DB!);
export const db = drizzle(client);
