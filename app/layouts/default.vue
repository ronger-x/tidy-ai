<script setup lang="ts">
import { LazyModalConfirm } from '#components';
import type { UIConversation } from '~/composables/useConversations';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const conversationsStore = useConversationsStore();
const toast = useToast();
const overlay = useOverlay();

// ── Sidebar open state ────────────────────────────────────────────────────────
const sidebarOpen = ref(false);

// ── Conversation data + grouping ──────────────────────────────────────────────
const uiConversations = computed<UIConversation[]>(() =>
  conversationsStore.list.map((c) => ({
    id: c.id,
    label: c.title,
    createdAt: String(c.createdAt),
  })),
);

const { groups } = useConversations(uiConversations);

// Fetch conversations on mount and when sidebar opens
onMounted(() => conversationsStore.fetchAll());
watch(sidebarOpen, (open) => {
  if (open) conversationsStore.fetchAll();
});

// 新对话创建后立即刷新会话列表
watch(
  () => chatStore.currentConversationId,
  (id, prevId) => {
    if (id && id !== prevId) {
      conversationsStore.fetchAll();
    }
  },
);

// ── Delete confirmation modal ─────────────────────────────────────────────────
const deleteModal = overlay.create(LazyModalConfirm, {
  props: {
    title: '删除对话',
    description: '此操作不可撤销，确认要删除这条对话历史吗？',
  },
});

async function deleteConversation(id: number) {
  const instance = deleteModal.open();
  const result = await instance.result;
  if (!result) return;

  await conversationsStore.deleteOne(id);
  if (chatStore.currentConversationId === id) {
    chatStore.clear();
  }
  toast.add({
    title: '对话已删除',
    icon: 'i-lucide-trash-2',
    color: 'neutral',
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────
const navLinks = [
  { to: '/tasks', label: '任务清单', icon: 'i-lucide-check-square' },
  { to: '/settings', label: '设置', icon: 'i-lucide-settings' },
];

async function loadConversation(id: number) {
  await chatStore.loadConversation(id);
  await router.push('/');
}

function newChat() {
  chatStore.clear();
  router.push('/');
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
defineShortcuts({
  c: {
    usingInput: false,
    handler: () => newChat(),
  },
  escape: {
    handler: () => {
      sidebarOpen.value = false;
    },
  },
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <!-- Sidebar -->
    <UDashboardSidebar
      id="default"
      v-model:open="sidebarOpen"
      :min-size="12"
      collapsible
      resizable
      class="border-r-0 py-4"
    >
      <!-- Header: logo + new chat button -->
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="text-highlighted flex items-end gap-1.5"
          @click="sidebarOpen = false"
        >
          <UIcon
            name="i-lucide-sparkles"
            class="text-primary size-6 shrink-0"
          />
          <span v-if="!collapsed" class="text-lg font-bold">Tidy AI</span>
        </NuxtLink>
      </template>

      <!-- Body: new chat button + conversation list -->
      <template #default="{ collapsed }">
        <!-- New chat button -->
        <UButton
          v-bind="
            collapsed
              ? { icon: 'i-lucide-plus' }
              : { label: '新建对话', leadingIcon: 'i-lucide-plus' }
          "
          variant="soft"
          color="primary"
          block
          class="mb-3"
          @click="newChat"
        />

        <!-- Loading indicator -->
        <div v-if="conversationsStore.loading" class="flex justify-center py-6">
          <UIcon
            name="i-lucide-loader-2"
            class="text-muted size-4 animate-spin"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!collapsed && conversationsStore.list.length === 0"
          class="text-muted py-6 text-center text-xs"
        >
          还没有历史对话
        </div>

        <!-- Grouped conversation list -->
        <template v-if="!collapsed">
          <div
            v-for="group in groups"
            :key="group.id"
            class="mb-3 flex flex-col gap-0.5"
          >
            <p
              class="text-muted mb-1 px-2 text-[11px] font-semibold tracking-wider uppercase"
            >
              {{ group.label }}
            </p>
            <div
              v-for="conv in group.items"
              :key="conv.id"
              class="group/conv flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors"
              :class="
                chatStore.currentConversationId === conv.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-default hover:bg-elevated cursor-pointer'
              "
              @click="loadConversation(conv.id)"
            >
              <UIcon
                name="i-lucide-message-circle"
                class="size-3.5 shrink-0 opacity-60"
              />
              <span class="min-w-0 flex-1 truncate">{{ conv.label }}</span>
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="error"
                size="xs"
                class="invisible shrink-0 group-hover/conv:visible"
                @click.stop="deleteConversation(conv.id)"
              />
            </div>
          </div>
        </template>
      </template>

      <!-- Footer: nav links + color mode -->
      <template #footer="{ collapsed }">
        <div class="flex flex-col gap-1">
          <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to">
            <UButton
              v-bind="
                collapsed
                  ? { icon: link.icon }
                  : { label: link.label, leadingIcon: link.icon }
              "
              :color="route.path === link.to ? 'primary' : 'neutral'"
              :variant="route.path === link.to ? 'soft' : 'ghost'"
              block
              :class="collapsed ? '' : 'justify-start'"
            />
          </NuxtLink>
          <USeparator class="my-1" />
          <div
            :class="
              collapsed ? 'flex justify-center' : 'flex items-center gap-2 px-1'
            "
          >
            <UColorModeButton size="sm" variant="ghost" color="neutral" />
            <span v-if="!collapsed" class="text-muted text-xs">颜色模式</span>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <!-- Main content -->
    <div class="bg-default flex min-w-0 flex-1 flex-col overflow-hidden">
      <slot />
    </div>
  </UDashboardGroup>
</template>
