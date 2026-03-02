import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async () => {
  const rows = await db.select().from(schema.providers).all();
  // Redact API keys before sending to client
  return rows.map((p) => ({ ...p, apiKey: p.apiKey ? '••••••••' : '' }));
});
