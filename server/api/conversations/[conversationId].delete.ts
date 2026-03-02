import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'conversationId'));
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' });

  await db.delete(schema.conversations).where(eq(schema.conversations.id, id));

  return { success: true };
});
