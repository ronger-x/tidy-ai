import { z } from 'zod';
import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

const bodySchema = z.object({
  productId: z.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const taskId = Number(getRouterParam(event, 'taskId'));

  if (!taskId || Number.isNaN(taskId)) {
    throw createError({ statusCode: 400, message: '无效的任务 ID' });
  }

  const { productId } = await readValidatedBody(event, bodySchema.parse);

  // 确认任务和产品都属于当前用户
  const [task, product] = await Promise.all([
    db
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .get(),
    db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.userId, userId),
        ),
      )
      .get(),
  ]);

  if (!task) throw createError({ statusCode: 404, message: '任务不存在' });
  if (!product) throw createError({ statusCode: 404, message: '产品不存在' });

  // 检查是否已关联
  const existing = await db
    .select({ id: schema.taskProducts.id })
    .from(schema.taskProducts)
    .where(
      and(
        eq(schema.taskProducts.taskId, taskId),
        eq(schema.taskProducts.productId, productId),
      ),
    )
    .get();

  if (existing) return { success: true, id: existing.id };

  const [created] = await db
    .insert(schema.taskProducts)
    .values({ taskId, productId })
    .returning();

  setResponseStatus(event, 201);
  return created;
});
