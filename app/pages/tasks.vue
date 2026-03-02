<template>
  <div class="flex h-full flex-col">
    <!-- Page header -->
    <div
      class="border-default flex h-12 shrink-0 items-center justify-between border-b px-4"
    >
      <div class="flex items-center gap-2">
        <UDashboardSidebarCollapse />
        <h1 class="text-highlighted text-lg font-bold">任务清单</h1>
        <span class="text-muted text-sm">
          {{ tasksStore.tasks.length }} 个任务 ·
          {{ tasksStore.completedCount }} 个已完成
        </span>
      </div>
      <div class="flex gap-2">
        <UButton
          variant="soft"
          color="neutral"
          leading-icon="i-lucide-home"
          size="sm"
          @click="showRoomModal = true"
        >
          管理房间
        </UButton>
        <UButton
          leading-icon="i-lucide-refresh-cw"
          variant="ghost"
          color="neutral"
          size="sm"
          :loading="tasksStore.loading"
          @click="handleRefresh"
        />
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <!-- View tabs -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full" />

        <!-- Due Today badges info -->
        <div
          v-if="activeTab === 'today'"
          class="text-muted flex items-center gap-2 text-sm"
        >
          <UIcon name="i-lucide-calendar-clock" class="text-warning size-4" />
          <span>显示今日到期或逾期的定期任务</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="currentTasks.length === 0 && !tasksStore.loading"
          class="flex flex-col items-center gap-3 py-16 text-center"
        >
          <div class="bg-neutral/10 rounded-full p-4">
            <UIcon name="i-lucide-inbox" class="text-muted size-8" />
          </div>
          <p class="text-muted text-sm">暂无任务</p>
          <UButton
            to="/"
            variant="soft"
            color="primary"
            size="sm"
            leading-icon="i-lucide-message-circle"
          >
            去对话页创建任务
          </UButton>
        </div>

        <!-- By Room view -->
        <template v-else-if="activeTab === 'room'">
          <div
            v-for="group in byRoomGroups"
            :key="group.roomId ?? 'none'"
            class="flex flex-col gap-3"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-home" class="text-muted size-4" />
              <span class="text-highlighted text-sm font-semibold">{{
                group.roomName
              }}</span>
              <UBadge variant="soft" color="neutral" size="xs">{{
                group.tasks.length
              }}</UBadge>
            </div>
            <TaskItem
              v-for="task in group.tasks"
              :key="task.id"
              :task="task"
              @update-status="handleUpdateStatus"
            />
          </div>
        </template>

        <!-- By Category view -->
        <template v-else-if="activeTab === 'category'">
          <div
            v-for="group in byCategoryGroups"
            :key="group.category"
            class="flex flex-col gap-3"
          >
            <div class="flex items-center gap-2">
              <div
                class="flex size-5 items-center justify-center rounded"
                :class="categoryBg(group.category)"
              >
                <UIcon
                  :name="categoryIcon(group.category)"
                  class="size-3"
                  :class="categoryColor(group.category)"
                />
              </div>
              <span class="text-highlighted text-sm font-semibold">{{
                categoryLabel(group.category)
              }}</span>
              <UBadge variant="soft" color="neutral" size="xs">{{
                group.tasks.length
              }}</UBadge>
            </div>
            <TaskItem
              v-for="task in group.tasks"
              :key="task.id"
              :task="task"
              @update-status="handleUpdateStatus"
            />
          </div>
        </template>

        <!-- All / Due Today view (flat list) -->
        <template v-else>
          <TaskItem
            v-for="task in currentTasks"
            :key="task.id"
            :task="task"
            @update-status="handleUpdateStatus"
          />
        </template>

        <!-- Room management modal -->
        <UModal
          v-model:open="showRoomModal"
          title="管理房间"
          :ui="{ body: 'p-0' }"
        >
          <template #body>
            <div class="divide-default flex flex-col divide-y">
              <!-- Room list -->
              <div
                v-if="roomsStore.rooms.length === 0"
                class="text-muted py-8 text-center text-sm"
              >
                暂无房间
              </div>
              <div
                v-for="room in roomsStore.rooms"
                :key="room.id"
                class="flex items-center justify-between px-4 py-3"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-home" class="text-muted size-4" />
                  <span class="text-sm font-medium">{{ room.name }}</span>
                  <span v-if="room.description" class="text-muted text-xs">{{
                    room.description
                  }}</span>
                </div>
                <UButton
                  variant="ghost"
                  color="error"
                  size="xs"
                  icon="i-lucide-trash-2"
                  :loading="deletingRoom === room.id"
                  @click="handleDeleteRoom(room.id)"
                />
              </div>
              <!-- Add room input -->
              <div class="flex gap-2 px-4 py-3">
                <UInput
                  v-model="newRoomName"
                  placeholder="新房间名称，如：厨房"
                  class="flex-1"
                  @keydown.enter="handleCreateRoom"
                />
                <UButton
                  :disabled="!newRoomName.trim()"
                  :loading="creatingRoom"
                  leading-icon="i-lucide-plus"
                  @click="handleCreateRoom"
                >
                  添加
                </UButton>
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '#shared/types/db';

const tasksStore = useTasksStore();
const roomsStore = useRoomsStore();
const toast = useToast();

// Load data on mount
onMounted(async () => {
  await Promise.all([tasksStore.fetch(), roomsStore.fetch()]);
});

// Tabs
const activeTab = ref('all');
const tabs = [
  { value: 'all', label: '全部', icon: 'i-lucide-list' },
  { value: 'today', label: '今日待办', icon: 'i-lucide-calendar-clock' },
  { value: 'room', label: '按房间', icon: 'i-lucide-home' },
  { value: 'category', label: '按分类', icon: 'i-lucide-tag' },
];

// Current filtered tasks
const today = new Date();
today.setHours(23, 59, 59, 999);

const currentTasks = computed(() => {
  if (activeTab.value === 'today') {
    return tasksStore.tasks.filter((t) => {
      if (!t.nextDueAt) return false;
      return new Date(t.nextDueAt) <= today;
    });
  }
  return tasksStore.tasks;
});

// By room groups
const byRoomGroups = computed(() => {
  const groups: Array<{
    roomId: number | null;
    roomName: string;
    tasks: Task[];
  }> = [];
  tasksStore.byRoom.forEach((taskList: Task[], roomId: number | null) => {
    const room =
      roomId !== null ? roomsStore.rooms.find((r) => r.id === roomId) : null;
    groups.push({
      roomId,
      roomName: room?.name ?? '未分类',
      tasks: taskList,
    });
  });
  // Sort: rooms first, then unclassified
  groups.sort((a, b) => {
    if (a.roomId === null) return 1;
    if (b.roomId === null) return -1;
    return a.roomName.localeCompare(b.roomName);
  });
  return groups;
});

// By category groups
type TaskCategory = Task['category'];
const categoryOrder: TaskCategory[] = [
  'cleaning',
  'clothing',
  'electronics',
  'supplies',
  'other',
];

const byCategoryGroups = computed(() => {
  const groups: Array<{ category: TaskCategory; tasks: Task[] }> = [];
  tasksStore.byCategory.forEach((taskList: Task[], category: TaskCategory) => {
    groups.push({ category, tasks: taskList });
  });
  groups.sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
  );
  return groups;
});

// Status update
async function handleUpdateStatus(id: number, status: Task['status']) {
  try {
    await tasksStore.updateStatus(id, status);
    if (status === 'done') {
      toast.add({
        title: '任务完成！',
        icon: 'i-lucide-check-circle',
        color: 'success',
      });
    }
  } catch {
    toast.add({
      title: '更新失败，请重试',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// Refresh
async function handleRefresh() {
  await Promise.all([tasksStore.fetch(), roomsStore.fetch()]);
}

// Room management
const showRoomModal = ref(false);
const newRoomName = ref('');
const creatingRoom = ref(false);
const deletingRoom = ref<number | null>(null);

async function handleCreateRoom() {
  if (!newRoomName.value.trim() || creatingRoom.value) return;
  creatingRoom.value = true;
  try {
    await roomsStore.create(newRoomName.value.trim());
    newRoomName.value = '';
    toast.add({ title: '房间已创建', icon: 'i-lucide-home', color: 'success' });
  } catch {
    toast.add({
      title: '创建失败，请重试',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    creatingRoom.value = false;
  }
}

async function handleDeleteRoom(id: number) {
  deletingRoom.value = id;
  try {
    await roomsStore.remove(id);
    await tasksStore.fetch();
    toast.add({ title: '已删除房间', icon: 'i-lucide-trash-2' });
  } catch {
    toast.add({
      title: '删除失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    deletingRoom.value = null;
  }
}

// Category helpers
function categoryIcon(cat: TaskCategory) {
  const map: Record<string, string> = {
    clothing: 'i-lucide-shirt',
    electronics: 'i-lucide-cpu',
    cleaning: 'i-lucide-sparkles',
    supplies: 'i-lucide-package',
    other: 'i-lucide-tag',
  };
  return map[cat] ?? 'i-lucide-tag';
}

function categoryColor(cat: TaskCategory) {
  const map: Record<string, string> = {
    clothing: 'text-violet-500',
    electronics: 'text-blue-500',
    cleaning: 'text-teal-500',
    supplies: 'text-amber-500',
    other: 'text-neutral-500',
  };
  return map[cat] ?? 'text-neutral-500';
}

function categoryBg(cat: TaskCategory) {
  const map: Record<string, string> = {
    clothing: 'bg-violet-500/10',
    electronics: 'bg-blue-500/10',
    cleaning: 'bg-teal-500/10',
    supplies: 'bg-amber-500/10',
    other: 'bg-neutral-500/10',
  };
  return map[cat] ?? 'bg-neutral-500/10';
}

function categoryLabel(cat: TaskCategory) {
  const map: Record<string, string> = {
    clothing: '衣物',
    electronics: '电子',
    cleaning: '清洁',
    supplies: '物资',
    other: '其他',
  };
  return map[cat] ?? cat;
}

useHead({ title: 'Tidy AI - 任务清单' });
</script>
