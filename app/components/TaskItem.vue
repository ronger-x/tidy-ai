<template>
  <div
    class="border-default bg-default overflow-hidden rounded-xl border transition-shadow hover:shadow-sm"
  >
    <!-- Task header -->
    <div
      class="flex cursor-pointer items-start gap-3 px-4 py-3 select-none"
      @click="expanded = !expanded"
    >
      <!-- Status indicator -->
      <div class="mt-0.5 shrink-0">
        <div
          class="flex size-5 items-center justify-center rounded-full border-2 transition-colors"
          :class="statusCircleClass"
        >
          <UIcon
            v-if="task.status === 'done'"
            name="i-lucide-check"
            class="size-3 text-white"
          />
          <div
            v-else-if="task.status === 'in_progress'"
            class="bg-warning size-2 rounded-full"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="text-sm font-medium"
            :class="
              task.status === 'done'
                ? 'text-muted line-through'
                : 'text-highlighted'
            "
          >
            {{ task.title }}
          </span>
          <!-- Badges -->
          <UBadge v-if="roomName" variant="soft" color="primary" size="xs">{{
            roomName
          }}</UBadge>
          <UBadge variant="soft" :color="statusColor" size="xs">{{
            statusLabel
          }}</UBadge>
          <UBadge
            v-if="task.recurrenceInterval"
            variant="outline"
            color="neutral"
            size="xs"
          >
            <UIcon name="i-lucide-repeat" class="mr-0.5 size-3" />
            每 {{ task.recurrenceInterval }} 天
          </UBadge>
          <UBadge v-if="isOverdue" variant="solid" color="error" size="xs"
            >逾期</UBadge
          >
        </div>
        <p
          v-if="task.description"
          class="text-muted mt-0.5 line-clamp-2 text-xs"
        >
          {{ task.description }}
        </p>
        <!-- Meta row -->
        <div class="mt-1 flex items-center gap-3">
          <span
            v-if="task.steps?.length"
            class="text-muted flex items-center gap-1 text-xs"
          >
            <UIcon name="i-lucide-list" class="size-3" />
            {{ doneSteps }}/{{ task.steps.length }} 步骤
          </span>
          <span
            v-if="task.nextDueAt"
            class="text-muted flex items-center gap-1 text-xs"
          >
            <UIcon name="i-lucide-calendar" class="size-3" />
            下次：{{ formatDate(task.nextDueAt) }}
          </span>
        </div>
      </div>

      <!-- Expand icon -->
      <div class="mt-0.5 shrink-0">
        <UIcon
          name="i-lucide-chevron-down"
          class="text-muted size-4 transition-transform duration-200"
          :class="{ 'rotate-180': expanded }"
        />
      </div>
    </div>

    <!-- Expanded area: steps -->
    <Transition name="expand">
      <div
        v-if="expanded && task.steps?.length"
        class="border-default bg-default/50 border-t"
      >
        <div class="flex flex-col gap-1 px-4 py-2">
          <p class="text-muted mb-1 text-xs font-medium">执行步骤</p>
          <label
            v-for="(step, i) in task.steps"
            :key="i"
            class="group flex cursor-pointer items-start gap-2.5 py-1.5"
          >
            <div
              class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors"
              :class="
                localSteps[i]
                  ? 'bg-success border-success'
                  : 'border-muted group-hover:border-primary'
              "
              @click.prevent="toggleStep(i)"
            >
              <UIcon
                v-if="localSteps[i]"
                name="i-lucide-check"
                class="size-2.5 text-white"
              />
            </div>
            <span
              class="text-sm leading-snug"
              :class="
                localSteps[i] ? 'text-muted line-through' : 'text-default'
              "
            >
              {{ step }}
            </span>
          </label>
        </div>

        <!-- 关联产品 -->
        <div
          v-if="linkedProducts.length"
          class="border-default border-t px-4 py-2"
        >
          <div class="mb-1 flex items-center gap-1.5">
            <UIcon
              name="i-lucide-shopping-bag"
              class="text-primary size-3"
            />
            <p class="text-muted text-xs font-medium">推荐产品</p>
          </div>
          <div class="flex flex-col gap-1">
            <div
              v-for="p in linkedProducts"
              :key="p.id"
              class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-elevated"
            >
              <span class="text-highlighted font-medium">{{ p.name }}</span>
              <UBadge v-if="p.brand" variant="soft" color="neutral" size="xs">
                {{ p.brand }}
              </UBadge>
              <UBadge
                v-if="p.priceRange"
                variant="soft"
                color="warning"
                size="xs"
              >
                ¥{{ p.priceRange }}
              </UBadge>
              <div class="flex-1" />
              <NuxtLink
                to="/products"
                class="text-primary text-xs hover:underline"
              >
                查看
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="border-default flex justify-end gap-2 border-t px-4 py-2">
          <UButton
            v-if="task.status !== 'todo'"
            variant="ghost"
            color="neutral"
            size="xs"
            leading-icon="i-lucide-rotate-ccw"
            @click.stop="emit('update-status', task.id, 'todo')"
          >
            重置
          </UButton>
          <UButton
            v-if="task.status === 'todo'"
            variant="soft"
            color="warning"
            size="xs"
            leading-icon="i-lucide-play"
            @click.stop="emit('update-status', task.id, 'in_progress')"
          >
            开始
          </UButton>
          <UButton
            v-if="task.status !== 'done'"
            variant="soft"
            color="success"
            size="xs"
            leading-icon="i-lucide-check"
            @click.stop="emit('update-status', task.id, 'done')"
          >
            完成
          </UButton>
        </div>
      </div>
    </Transition>

    <!-- No steps but show action buttons on expand -->
    <Transition name="expand">
      <div
        v-if="expanded && !task.steps?.length"
        class="border-default flex justify-end gap-2 border-t px-4 py-2"
      >
        <UButton
          v-if="task.status !== 'todo'"
          variant="ghost"
          color="neutral"
          size="xs"
          leading-icon="i-lucide-rotate-ccw"
          @click.stop="emit('update-status', task.id, 'todo')"
        >
          重置
        </UButton>
        <UButton
          v-if="task.status === 'todo'"
          variant="soft"
          color="warning"
          size="xs"
          leading-icon="i-lucide-play"
          @click.stop="emit('update-status', task.id, 'in_progress')"
        >
          开始
        </UButton>
        <UButton
          v-if="task.status !== 'done'"
          variant="soft"
          color="success"
          size="xs"
          leading-icon="i-lucide-check"
          @click.stop="emit('update-status', task.id, 'done')"
        >
          完成
        </UButton>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Task } from "#shared/types/db";
import type { Product } from "#shared/types/db";

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  "update-status": [id: number, status: Task["status"]];
}>();

const roomsStore = useRoomsStore();

const expanded = ref(false);
const localSteps = ref<boolean[]>([]);

// 关联产品
const linkedProducts = ref<Product[]>([]);

// 展开时加载关联产品
watch(expanded, async (isExpanded) => {
  if (isExpanded && linkedProducts.value.length === 0) {
    try {
      linkedProducts.value = await $fetch<Product[]>(
        `/api/tasks/${props.task.id}/products`,
      );
    } catch {
      // 静默失败，产品不影响核心功能
    }
  }
});

// Initialize local step state
watch(
  () => props.task.steps,
  (steps) => {
    localSteps.value = (steps ?? []).map(() => false);
  },
  { immediate: true },
);

function toggleStep(i: number) {
  localSteps.value[i] = !localSteps.value[i];
}

const doneSteps = computed(() => localSteps.value.filter(Boolean).length);

// Room name
const roomName = computed(() => {
  if (!props.task.roomId) return null;
  return roomsStore.rooms.find((r) => r.id === props.task.roomId)?.name ?? null;
});

// Status helpers
const statusLabel = computed(() => {
  const map: Record<Task["status"], string> = {
    todo: "待办",
    in_progress: "进行中",
    done: "已完成",
  };
  return map[props.task.status];
});

const statusColor = computed((): "neutral" | "warning" | "success" => {
  if (props.task.status === "done") return "success";
  if (props.task.status === "in_progress") return "warning";
  return "neutral";
});

const statusCircleClass = computed(() => {
  if (props.task.status === "done") return "border-success bg-success";
  if (props.task.status === "in_progress")
    return "border-warning bg-warning/10";
  return "border-muted hover:border-primary";
});

// Overdue detection
const isOverdue = computed(() => {
  if (!props.task.nextDueAt || props.task.status === "done") return false;
  return new Date(props.task.nextDueAt) < new Date();
});

function formatDate(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  const diff = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
