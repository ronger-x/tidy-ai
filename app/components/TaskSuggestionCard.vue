<template>
  <div
    class="border-default bg-default overflow-hidden rounded-xl border transition-shadow hover:shadow-sm"
    :class="{ 'opacity-60': added }"
  >
    <div class="flex items-start gap-3 px-4 py-3">
      <!-- Category icon -->
      <div
        class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
        :class="categoryBg"
      >
        <UIcon :name="categoryIcon" class="size-4" :class="categoryColor" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-highlighted text-sm font-medium">{{
            task.title
          }}</span>
          <UBadge v-if="task.room" variant="soft" color="primary" size="xs">
            {{ task.room }}
          </UBadge>
          <UBadge variant="outline" color="neutral" size="xs">
            {{ categoryLabel }}
          </UBadge>
          <UBadge
            v-if="task.recurrenceInterval"
            variant="soft"
            color="success"
            size="xs"
          >
            每 {{ task.recurrenceInterval }} 天
          </UBadge>
        </div>
        <p
          v-if="task.description"
          class="text-muted mt-0.5 line-clamp-2 text-xs"
        >
          {{ task.description }}
        </p>
        <div v-if="task.steps.length" class="mt-1 flex items-center gap-1">
          <UIcon name="i-lucide-list" class="text-muted size-3" />
          <span class="text-muted text-xs"
            >{{ task.steps.length }} 个子步骤</span
          >
        </div>
      </div>

      <!-- Add button -->
      <UButton
        :icon="added ? 'i-lucide-check' : 'i-lucide-plus'"
        :color="added ? 'success' : 'primary'"
        :variant="added ? 'soft' : 'soft'"
        size="xs"
        :disabled="added"
        class="mt-0.5 shrink-0"
        @click="emit('add')"
      >
        {{ added ? '已添加' : '添加' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedTask } from '~/stores/chat';

const props = defineProps<{
  task: ParsedTask;
  added?: boolean;
}>();

const emit = defineEmits<{
  add: [];
}>();

const ICON_MAP: Record<string, string> = {
  clothing: 'i-lucide-shirt',
  electronics: 'i-lucide-cpu',
  cleaning: 'i-lucide-sparkles',
  supplies: 'i-lucide-package',
  other: 'i-lucide-tag',
};

const COLOR_MAP: Record<string, string> = {
  clothing: 'text-violet-500',
  electronics: 'text-blue-500',
  cleaning: 'text-teal-500',
  supplies: 'text-amber-500',
  other: 'text-neutral-500',
};

const BG_MAP: Record<string, string> = {
  clothing: 'bg-violet-500/10',
  electronics: 'bg-blue-500/10',
  cleaning: 'bg-teal-500/10',
  supplies: 'bg-amber-500/10',
  other: 'bg-neutral-500/10',
};

const LABEL_MAP: Record<string, string> = {
  clothing: '衣物',
  electronics: '电子',
  cleaning: '清洁',
  supplies: '物资',
  other: '其他',
};

const categoryIcon = computed(
  () => ICON_MAP[props.task.category] ?? 'i-lucide-tag',
);
const categoryColor = computed(
  () => COLOR_MAP[props.task.category] ?? 'text-neutral-500',
);
const categoryBg = computed(
  () => BG_MAP[props.task.category] ?? 'bg-neutral-500/10',
);
const categoryLabel = computed(
  () => LABEL_MAP[props.task.category] ?? props.task.category,
);
</script>
