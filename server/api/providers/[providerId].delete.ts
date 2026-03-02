import { and, eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const id = Number(getRouterParam(event, 'providerId'));
  await db
    .delete(schema.providers)
    .where(
      and(eq(schema.providers.id, id), eq(schema.providers.userId, userId)),
    );
  return { success: true };
});
