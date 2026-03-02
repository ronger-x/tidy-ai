import { z } from 'zod';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().default(''),
});

/** 创建新房间/场景 */
export default defineEventHandler(async (event) => {
  const userId = event.context.userId as number;
  const body = await readValidatedBody(event, bodySchema.parse);

  const [room] = await db
    .insert(schema.rooms)
    .values({ ...body, userId })
    .returning();

  setResponseStatus(event, 201);
  return room;
});
