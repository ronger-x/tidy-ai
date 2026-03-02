/**
 * nuxt-auth-utils 会话类型扩展
 */
declare module '#auth-utils' {
  interface User {
    id: number;
    username: string;
    name: string;
    avatar: string;
  }
}

export {};
