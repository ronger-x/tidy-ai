import { z } from 'zod';
import { db, schema } from '~~/server/db/index';
import { and, eq, isNull, or, lte } from 'drizzle-orm';

const querySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'all']).default('all'),
  category: z
    .enum(['clothing', 'electronics', 'cleaning', 'supplies', 'other', 'all'])
    .default('all'),
  /** 按房间 ID 过滤，不填则返回所有房间 */
  roomId: z.coerce.number().int().optional(),
  /** 只返回今天到期的重复任务 */
  dueToday: z.coerce.boolean().default(false),
});

export default defineEventHandler(async (event) => {
  const { status, category, roomId, dueToday } = await getValidatedQuery(
    event,
    querySchema.parse,
  );

  const conditions = [];

  if (status !== 'all') conditions.push(eq(schema.tasks.status, status));
  if (category !== 'all') conditions.push(eq(schema.tasks.category, category));
  if (roomId !== undefined) conditions.push(eq(schema.tasks.roomId, roomId));
  if (dueToday) {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    conditions.push(
      or(
        isNull(schema.tasks.nextDueAt),
        lte(schema.tasks.nextDueAt, endOfToday),
      )!,
    );
  }

  const query = db
    .select()
    .from(schema.tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(schema.tasks.createdAt);

  return query;
});
