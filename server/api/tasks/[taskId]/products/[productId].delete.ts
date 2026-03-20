import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const taskId = Number(getRouterParam(event, 'taskId'));
  const productId = Number(getRouterParam(event, 'productId'));

  if (!taskId || Number.isNaN(taskId)) {
    throw createError({ statusCode: 400, message: '无效的任务 ID' });
  }
  if (!productId || Number.isNaN(productId)) {
    throw createError({ statusCode: 400, message: '无效的产品 ID' });
  }

  // 确认任务属于当前用户
  const task = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
    .get();

  if (!task) throw createError({ statusCode: 404, message: '任务不存在' });

  const deleted = await db
    .delete(schema.taskProducts)
    .where(
      and(
        eq(schema.taskProducts.taskId, taskId),
        eq(schema.taskProducts.productId, productId),
      ),
    )
    .returning();

  if (!deleted.length) {
    throw createError({ statusCode: 404, message: '关联不存在' });
  }

  return { success: true };
});
