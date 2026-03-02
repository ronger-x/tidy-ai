/**
 * 客户端路由守卫
 * 未登录用户重定向到 /login，已登录用户不可访问 /login
 */
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  // 未登录且不是登录页 → 跳转登录
  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login');
  }

  // 已登录且在登录页 → 跳转首页
  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/');
  }
});
