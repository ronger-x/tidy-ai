/**
 * 服务端中间件：保护所有 /api/ 路由（auth 路由除外）
 * 未登录用户访问受保护 API 时返回 401
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // 认证相关路由放行
  if (path.startsWith('/api/auth/')) return;

  // 非 API 路由放行（页面、静态资源等）
  if (!path.startsWith('/api/')) return;

  // 检查用户是否已登录
  const session = await getUserSession(event);
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: '请先登录' });
  }

  // 将 userId 注入到 event.context 方便后续 handler 使用
  event.context.userId = session.user.id;
});
