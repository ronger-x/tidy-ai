import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

const taskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  category: z
    .enum(['clothing', 'electronics', 'cleaning', 'supplies', 'other'])
    .default('other'),
  /** AI 生成的唯一标识，用于跨会话去重 */
  key: z.string().optional(),
  /** 房间/场景名称，字符串，会自动 upsert 到 rooms 表 */
  room: z.string().optional(),
  /** 子步骤列表 */
  steps: z.array(z.string()).default([]),
  /** 重复周期（天），不填表示一次性任务 */
  recurrenceInterval: z.number().int().positive().optional(),
});

const bodySchema = z.object({
  tasks: z.array(taskInputSchema),
});

/**
 * 根据名称查找或创建房间，返回房间 ID
 */
async function upsertRoom(name: string, userId: number): Promise<number> {
  const trimmed = name.trim();
  const existing = await db
    .select({ id: schema.rooms.id })
    .from(schema.rooms)
    .where(and(eq(schema.rooms.name, trimmed), eq(schema.rooms.userId, userId)))
    .get();

  if (existing) return existing.id;

  const created = await db
    .insert(schema.rooms)
    .values({ name: trimmed, userId })
    .returning({ id: schema.rooms.id })
    .get();

  return created!.id;
}

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const { tasks } = await readValidatedBody(event, bodySchema.parse);

  // Resolve room names → room IDs
  const values = await Promise.all(
    tasks.map(async ({ room, key, ...rest }) => ({
      ...rest,
      userId,
      sourceKey: key || null,
      roomId: room ? await upsertRoom(room, userId) : null,
    })),
  );

  const inserted = await db.insert(schema.tasks).values(values).returning();

  setResponseStatus(event, 201);
  return inserted;
});
