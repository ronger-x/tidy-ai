import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'providerId'));
  await db.delete(schema.providers).where(eq(schema.providers.id, id));
  return { success: true };
});
