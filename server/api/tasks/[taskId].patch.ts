import { z } from 'zod';
import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

const bodySchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z
    .enum(['clothing', 'electronics', 'cleaning', 'supplies', 'other'])
    .optional(),
  steps: z.array(z.string()).optional(),
  recurrenceInterval: z.number().int().positive().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const taskIdStr = getRouterParam(event, 'taskId');
  const taskId = Number(taskIdStr);

  if (!taskId || Number.isNaN(taskId)) {
    throw createError({ statusCode: 400, message: 'Invalid task ID' });
  }

  const updates = await readValidatedBody(event, bodySchema.parse);

  // When marking done, record lastDoneAt and compute nextDueAt for recurring tasks
  const extra: Partial<typeof schema.tasks.$inferInsert> = {};
  if (updates.status === 'done') {
    const now = new Date();
    extra.lastDoneAt = now;

    // Look up current recurrenceInterval if not provided in this request
    const current = await db
      .select({ recurrenceInterval: schema.tasks.recurrenceInterval })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .get();

    const interval = updates.recurrenceInterval ?? current?.recurrenceInterval;
    if (interval) {
      extra.nextDueAt = new Date(now.getTime() + interval * 86_400_000);
    }
  }

  const [updated] = await db
    .update(schema.tasks)
    .set({ ...updates, ...extra, updatedAt: new Date() })
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Task not found' });
  }

  return updated;
});
