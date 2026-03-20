import { z } from 'zod';
import { db, schema } from '~~/server/db/index';
import { and, eq } from 'drizzle-orm';

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  category: z
    .enum(['cleaner', 'tool', 'storage', 'consumable', 'other'])
    .optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  priceRange: z.string().optional(),
  purchaseUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  status: z
    .enum(['recommended', 'bookmarked', 'purchased'])
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  reason: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const productId = Number(getRouterParam(event, 'productId'));

  if (!productId || Number.isNaN(productId)) {
    throw createError({ statusCode: 400, message: '无效的产品 ID' });
  }

  const updates = await readValidatedBody(event, bodySchema.parse);

  const [updated] = await db
    .update(schema.products)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.userId, userId),
      ),
    )
    .returning();

  if (!updated) {
    throw createError({ statusCode: 404, message: '产品不存在' });
  }

  return updated;
});
