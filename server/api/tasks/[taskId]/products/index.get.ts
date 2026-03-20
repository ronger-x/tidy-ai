import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const taskId = Number(getRouterParam(event, 'taskId'));

  if (!taskId || Number.isNaN(taskId)) {
    throw createError({ statusCode: 400, message: '无效的任务 ID' });
  }

  // 确认任务属于当前用户
  const task = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
    .get();

  if (!task) {
    throw createError({ statusCode: 404, message: '任务不存在' });
  }

  // 查询关联的产品
  const rows = await db
    .select({
      id: schema.products.id,
      sourceKey: schema.products.sourceKey,
      name: schema.products.name,
      category: schema.products.category,
      description: schema.products.description,
      brand: schema.products.brand,
      priceRange: schema.products.priceRange,
      purchaseUrl: schema.products.purchaseUrl,
      imageUrl: schema.products.imageUrl,
      rating: schema.products.rating,
      status: schema.products.status,
      reason: schema.products.reason,
      metadata: schema.products.metadata,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
    })
    .from(schema.taskProducts)
    .innerJoin(
      schema.products,
      eq(schema.taskProducts.productId, schema.products.id),
    )
    .where(eq(schema.taskProducts.taskId, taskId));

  return rows;
});
