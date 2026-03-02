import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

/** 删除房间（任务中的 roomId 会被自动置为 null） */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const roomIdStr = getRouterParam(event, 'roomId');
  const roomId = Number(roomIdStr);

  if (!roomId || Number.isNaN(roomId)) {
    throw createError({ statusCode: 400, message: 'Invalid room ID' });
  }

  const [deleted] = await db
    .delete(schema.rooms)
    .where(and(eq(schema.rooms.id, roomId), eq(schema.rooms.userId, userId)))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  return deleted;
});
