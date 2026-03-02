import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;

  const rows = await db
    .select()
    .from(schema.providers)
    .where(eq(schema.providers.userId, userId))
    .all();
  // Redact API keys before sending to client
  return rows.map((p) => ({ ...p, apiKey: p.apiKey ? '••••••••' : '' }));
});
