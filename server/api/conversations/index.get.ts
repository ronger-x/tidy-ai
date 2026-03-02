import { desc } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: schema.conversations.id,
      title: schema.conversations.title,
      createdAt: schema.conversations.createdAt,
      updatedAt: schema.conversations.updatedAt,
    })
    .from(schema.conversations)
    .orderBy(desc(schema.conversations.updatedAt));
  return rows;
});
