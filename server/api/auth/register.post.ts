import { z } from 'zod';
import { eq, isNull } from 'drizzle-orm';
import { db, schema } from '~~/server/db/index';

const bodySchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
  name: z.string().max(50).default(''),
});

/**
 * POST /api/auth/register
 * 注册新用户（用户名 + 密码）
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  // 检查用户名是否已存在
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, body.username))
    .get();

  if (existing) {
    throw createError({ statusCode: 409, message: '用户名已存在' });
  }

  const now = new Date();
  const [user] = await db
    .insert(schema.users)
    .values({
      username: body.username,
      passwordHash: await hashPassword(body.password),
      name: body.name || body.username,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // 第一个注册的用户：将所有 userId 为 null 的历史数据归属到该用户
  const userCount = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .all();

  if (userCount.length === 1) {
    await Promise.all([
      db
        .update(schema.providers)
        .set({ userId: user!.id })
        .where(isNull(schema.providers.userId)),
      db
        .update(schema.rooms)
        .set({ userId: user!.id })
        .where(isNull(schema.rooms.userId)),
      db
        .update(schema.tasks)
        .set({ userId: user!.id })
        .where(isNull(schema.tasks.userId)),
      db
        .update(schema.conversations)
        .set({ userId: user!.id })
        .where(isNull(schema.conversations.userId)),
    ]);
  }

  // 自动登录：设置会话
  await setUserSession(event, {
    user: {
      id: user!.id,
      username: user!.username,
      name: user!.name,
      avatar: user!.avatar,
    },
  });

  setResponseStatus(event, 201);
  return {
    id: user!.id,
    username: user!.username,
    name: user!.name,
    avatar: user!.avatar,
  };
});
