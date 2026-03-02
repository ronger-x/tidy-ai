<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

defineProps<{
  collapsed?: boolean;
}>();

const colorMode = useColorMode();
const { user, clear: clearSession } = useUserSession();

// ── 登出 ──────────────────────────────────────────────────────────────────────
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' });
  await clearSession();
  await navigateTo('/login');
}

// ── 下拉菜单项 ────────────────────────────────────────────────────────────────
const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: user.value?.name || user.value?.username || '用户',
      avatar: {
        src: user.value?.avatar || 'https://github.com/ronger-x.png',
        alt: user.value?.name || user.value?.username || '用户',
      },
    },
  ],
  [
    {
      label: '任务清单',
      icon: 'i-lucide-check-square',
      to: '/tasks',
    },
    {
      label: '设置',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: '外观',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: '浅色',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = 'light';
          },
        },
        {
          label: '深色',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = 'dark';
          },
        },
        {
          label: '跟随系统',
          icon: 'i-lucide-monitor',
          type: 'checkbox',
          checked: colorMode.value !== 'light' && colorMode.value !== 'dark',
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = 'system';
          },
        },
      ],
    },
  ],
  [
    {
      label: '退出登录',
      icon: 'i-lucide-log-out',
      onSelect: logout,
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', side: 'right', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      :avatar="{
        src: user?.avatar || 'https://github.com/ronger-x.png',
        alt: user?.name || user?.username || '用户',
      }"
      :label="collapsed ? undefined : user?.name || user?.username || '用户'"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>
