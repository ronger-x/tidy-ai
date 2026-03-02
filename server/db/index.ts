import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = `file:${process.env.DATABASE_URL ?? "./data/tidy.db"}`;

const client = createClient({ url });

export const db = drizzle(client, { schema });
export { schema };
