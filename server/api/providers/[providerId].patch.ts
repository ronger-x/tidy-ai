import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  /** Pass the actual key to update; omit or pass empty string to keep existing */
  apiKey: z.string().optional(),
  enabled: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'providerId'));
  const body = await readValidatedBody(event, bodySchema.parse);

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) patch.name = body.name;
  if (body.baseUrl !== undefined) patch.baseUrl = body.baseUrl;
  if (body.apiKey !== undefined && body.apiKey !== '')
    patch.apiKey = body.apiKey;
  if (body.enabled !== undefined) patch.enabled = body.enabled;

  const [row] = await db
    .update(schema.providers)
    .set(patch)
    .where(eq(schema.providers.id, id))
    .returning();

  if (!row)
    throw createError({ statusCode: 404, message: 'Provider not found' });
  return { ...row, apiKey: row.apiKey ? '••••••••' : '' };
});
