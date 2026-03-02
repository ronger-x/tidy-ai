/**
 * POST /api/auth/logout
 * 登出当前用户
 */
export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  return { success: true };
});
