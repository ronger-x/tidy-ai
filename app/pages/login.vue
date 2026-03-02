<script setup lang="ts">
/**
 * 登录/注册页面
 * 使用 UAuthForm + UPageCard 构建
 */
import * as z from 'zod';
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui';

definePageMeta({
  layout: false,
});

const toast = useToast();
const { fetch: fetchSession } = useUserSession();

// 登录/注册模式切换
const isRegister = ref(false);

// 登录表单字段
const loginFields: AuthFormField[] = [
  {
    name: 'username',
    type: 'text',
    label: '用户名',
    placeholder: '请输入用户名',
    icon: 'i-lucide-user',
    required: true,
    autocomplete: 'username',
  },
  {
    name: 'password',
    type: 'password',
    label: '密码',
    placeholder: '请输入密码',
    icon: 'i-lucide-lock',
    required: true,
    autocomplete: 'current-password',
  },
];

// 注册表单字段
const registerFields: AuthFormField[] = [
  {
    name: 'username',
    type: 'text',
    label: '用户名',
    placeholder: '请输入用户名',
    icon: 'i-lucide-user',
    required: true,
    autocomplete: 'username',
  },
  {
    name: 'name',
    type: 'text',
    label: '显示名称',
    placeholder: '用于展示的昵称（可选）',
    icon: 'i-lucide-badge-check',
  },
  {
    name: 'password',
    type: 'password',
    label: '密码',
    placeholder: '请输入密码（至少6位）',
    icon: 'i-lucide-lock',
    required: true,
    autocomplete: 'new-password',
  },
];

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

const registerSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(50),
  password: z.string().min(6, '密码至少6个字符').max(100),
  name: z.string().max(50).optional(),
});

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Record<string, string>>) {
  loading.value = true;
  try {
    if (isRegister.value) {
      // 注册
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          username: payload.data.username,
          password: payload.data.password,
          name: payload.data.name || payload.data.username,
        },
      });

      // 注册接口已设置会话，再显式调用登录确保 cookie 生效
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          username: payload.data.username,
          password: payload.data.password,
        },
      });
    } else {
      // 登录
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          username: payload.data.username,
          password: payload.data.password,
        },
      });
    }

    // 刷新会话状态
    await fetchSession();

    toast.add({
      title: isRegister.value ? '注册成功' : '登录成功',
      icon: 'i-lucide-check-circle',
      color: 'success',
    });

    await navigateTo('/', { replace: true });
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } };
    toast.add({
      title: isRegister.value ? '注册失败' : '登录失败',
      description: error?.data?.message || '请检查输入后重试',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-default flex min-h-screen items-center justify-center px-4">
    <UPageCard class="w-full max-w-sm">
      <UAuthForm
        :key="isRegister ? 'register' : 'login'"
        :schema="isRegister ? registerSchema : loginSchema"
        :fields="isRegister ? registerFields : loginFields"
        :title="isRegister ? '创建新账户' : '欢迎回来'"
        icon="i-lucide-sparkles"
        :submit="{ label: isRegister ? '注册' : '登录', loading }"
        :loading="loading"
        @submit="onSubmit"
      >
        <template #description>
          {{ isRegister ? '注册一个 Tidy AI 账户' : '登录以继续使用 Tidy AI' }}
        </template>

        <template #footer>
          <div class="text-center text-sm">
            <span class="text-muted">
              {{ isRegister ? '已有账户？' : '还没有账户？' }}
            </span>
            <UButton
              variant="link"
              :label="isRegister ? '去登录' : '去注册'"
              size="sm"
              @click="isRegister = !isRegister"
            />
          </div>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
