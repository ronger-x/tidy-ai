import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * 用户名/密码登录
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, body.username))
    .get();

  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' });
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
  };
});
