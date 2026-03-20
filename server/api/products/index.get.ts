import { z } from 'zod';
import { db, schema } from '~~/server/db/index';
import { and, eq, like } from 'drizzle-orm';

const querySchema = z.object({
  category: z
    .enum(['cleaner', 'tool', 'storage', 'consumable', 'other', 'all'])
    .default('all'),
  status: z
    .enum(['recommended', 'bookmarked', 'purchased', 'all'])
    .default('all'),
  search: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const { category, status, search } = await getValidatedQuery(
    event,
    querySchema.parse,
  );

  const conditions = [eq(schema.products.userId, userId)];

  if (category !== 'all') conditions.push(eq(schema.products.category, category));
  if (status !== 'all') conditions.push(eq(schema.products.status, status));
  if (search) conditions.push(like(schema.products.name, `%${search}%`));

  return db
    .select()
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(schema.products.createdAt);
});
