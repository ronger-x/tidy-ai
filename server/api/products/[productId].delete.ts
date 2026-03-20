import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const productId = Number(getRouterParam(event, 'productId'));

  if (!productId || Number.isNaN(productId)) {
    throw createError({ statusCode: 400, message: '无效的产品 ID' });
  }

  const deleted = await db
    .delete(schema.products)
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.userId, userId),
      ),
    )
    .returning();

  if (!deleted.length) {
    throw createError({ statusCode: 404, message: '产品不存在' });
  }

  return { success: true };
});
