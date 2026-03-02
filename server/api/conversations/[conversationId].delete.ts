import { and, eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const id = Number(getRouterParam(event, 'conversationId'));
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' });

  await db
    .delete(schema.conversations)
    .where(
      and(
        eq(schema.conversations.id, id),
        eq(schema.conversations.userId, userId),
      ),
    );

  return { success: true };
});
