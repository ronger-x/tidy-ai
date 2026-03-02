import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

/** 返回当前用户的房间/场景列表 */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;

  return db
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.userId, userId))
    .orderBy(schema.rooms.name);
});
