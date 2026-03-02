import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'modelId'));
  const body = await readValidatedBody(event, bodySchema.parse);

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.enabled !== undefined) patch.enabled = body.enabled;
  if (body.name !== undefined) patch.name = body.name;

  const [row] = await db
    .update(schema.models)
    .set(patch)
    .where(eq(schema.models.id, id))
    .returning();

  if (!row) throw createError({ statusCode: 404, message: 'Model not found' });
  return row;
});
