import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  title: z.string().optional(),
  messages: z.array(z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'conversationId'));
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' });

  const body = await readValidatedBody(event, bodySchema.parse);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.messages !== undefined) updates.messages = body.messages;

  const [row] = await db
    .update(schema.conversations)
    .set(updates)
    .where(eq(schema.conversations.id, id))
    .returning();

  if (!row) throw createError({ statusCode: 404, message: 'Not found' });
  return row;
});
