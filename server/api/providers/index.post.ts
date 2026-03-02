import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().default(''),
  enabled: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const body = await readValidatedBody(event, bodySchema.parse);
  const [row] = await db
    .insert(schema.providers)
    .values({
      userId,
      name: body.name,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      enabled: body.enabled,
    })
    .returning();
  return { ...row!, apiKey: row!.apiKey ? '••••••••' : '' };
});
