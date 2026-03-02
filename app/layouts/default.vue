<script setup lang="ts">
import { LazyModalConfirm } from '#components';
import type { UIConversation } from '~/composables/useConversations';
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

async function loadConversation(id: number) {
  await chatStore.loadConversation(id);
  await router.push('/');
}

function newChat() {
  chatStore.clear();
  router.push('/');
}

// ── Collapsible conversation groups ───────────────────────────────────────────
const collapsedGroups = ref(new Set<string>());

function toggleGroup(id: string) {
  const next = new Set(collapsedGroups.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsedGroups.value = next;
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
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <!-- Header: logo + 折叠按钮 -->
      <template #header="{ collapsed }">
        <div
          class="flex w-full items-center"
          :class="collapsed ? 'justify-center' : 'justify-between'"
        >
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
        </div>
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
            <button
              class="text-muted hover:text-highlighted mb-1 flex w-full cursor-pointer items-center gap-1 px-2 text-[11px] font-semibold tracking-wider uppercase transition-colors"
              @click="toggleGroup(group.id)"
            >
              <UIcon
                :name="
                  collapsedGroups.has(group.id)
                    ? 'i-lucide-chevron-right'
                    : 'i-lucide-chevron-down'
                "
                class="size-3 shrink-0"
              />
              {{ group.label }}
              <span class="text-dimmed ml-auto text-[10px] font-normal">
                {{ group.items.length }}
              </span>
            </button>
            <template v-if="!collapsedGroups.has(group.id)">
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
            </template>
          </div>
        </template>
      </template>

      <!-- Footer: 用户菜单 -->
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <!-- Main content -->
    <div class="bg-default flex min-w-0 flex-1 flex-col overflow-hidden">
      <slot />
    </div>
  </UDashboardGroup>
</template>
