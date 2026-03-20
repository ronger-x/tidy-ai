import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

const productInputSchema = z.object({
  name: z.string().min(1),
  category: z
    .enum(['cleaner', 'tool', 'storage', 'consumable', 'other'])
    .default('other'),
  description: z.string().default(''),
  brand: z.string().default(''),
  priceRange: z.string().default(''),
  purchaseUrl: z.string().default(''),
  imageUrl: z.string().default(''),
  reason: z.string().default(''),
  /** AI 生成的唯一标识，用于去重 */
  key: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

const bodySchema = z.object({
  products: z.array(productInputSchema),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const { products: items } = await readValidatedBody(event, bodySchema.parse);

  const results = [];

  for (const { key, ...rest } of items) {
    // 基于 sourceKey 去重
    if (key) {
      const existing = await db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.sourceKey, key),
            eq(schema.products.userId, userId),
          ),
        )
        .get();

      if (existing) {
        // 更新已有产品信息
        const [updated] = await db
          .update(schema.products)
          .set({ ...rest, updatedAt: new Date() })
          .where(eq(schema.products.id, existing.id))
          .returning();
        results.push(updated);
        continue;
      }
    }

    const [inserted] = await db
      .insert(schema.products)
      .values({ ...rest, userId, sourceKey: key || null })
      .returning();
    results.push(inserted);
  }

  setResponseStatus(event, 201);
  return results;
});
