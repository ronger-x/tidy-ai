<template>
  <div
    class="border-default bg-default overflow-hidden rounded-xl border transition-shadow hover:shadow-sm"
    :class="{ 'opacity-60': saved }"
  >
    <div class="flex items-start gap-3 px-4 py-3">
      <!-- 分类图标 -->
      <div
        class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
        :class="categoryBg"
      >
        <UIcon :name="categoryIcon" class="size-4" :class="categoryColor" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-highlighted text-sm font-medium">{{
            product.name
          }}</span>
          <UBadge variant="outline" color="neutral" size="xs">
            {{ categoryLabel }}
          </UBadge>
          <UBadge
            v-if="product.brand && product.brand !== '通用'"
            variant="soft"
            color="primary"
            size="xs"
          >
            {{ product.brand }}
          </UBadge>
          <UBadge
            v-if="product.priceRange"
            variant="soft"
            color="warning"
            size="xs"
          >
            ¥{{ product.priceRange }}
          </UBadge>
        </div>
        <p
          v-if="product.description"
          class="text-muted mt-0.5 line-clamp-2 text-xs"
        >
          {{ product.description }}
        </p>
        <p
          v-if="product.reason"
          class="text-primary mt-0.5 line-clamp-1 text-xs italic"
        >
          💡 {{ product.reason }}
        </p>
      </div>

      <!-- 保存按钮 -->
      <UButton
        :icon="saved ? 'i-lucide-check' : 'i-lucide-bookmark'"
        :color="saved ? 'success' : 'primary'"
        variant="soft"
        size="xs"
        :disabled="saved"
        class="mt-0.5 shrink-0"
        @click="emit('save')"
      >
        {{ saved ? '已保存' : '收藏' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedProduct } from '~~/shared/types/db';

const props = defineProps<{
  product: ParsedProduct;
  saved?: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const ICON_MAP: Record<string, string> = {
  cleaner: 'i-lucide-spray-can',
  tool: 'i-lucide-wrench',
  storage: 'i-lucide-box',
  consumable: 'i-lucide-package-open',
  other: 'i-lucide-tag',
};

const COLOR_MAP: Record<string, string> = {
  cleaner: 'text-cyan-500',
  tool: 'text-orange-500',
  storage: 'text-indigo-500',
  consumable: 'text-lime-500',
  other: 'text-neutral-500',
};

const BG_MAP: Record<string, string> = {
  cleaner: 'bg-cyan-500/10',
  tool: 'bg-orange-500/10',
  storage: 'bg-indigo-500/10',
  consumable: 'bg-lime-500/10',
  other: 'bg-neutral-500/10',
};

const LABEL_MAP: Record<string, string> = {
  cleaner: '清洁剂',
  tool: '工具',
  storage: '收纳',
  consumable: '耗材',
  other: '其他',
};

const categoryIcon = computed(
  () => ICON_MAP[props.product.category] ?? 'i-lucide-tag',
);
const categoryColor = computed(
  () => COLOR_MAP[props.product.category] ?? 'text-neutral-500',
);
const categoryBg = computed(
  () => BG_MAP[props.product.category] ?? 'bg-neutral-500/10',
);
const categoryLabel = computed(
  () => LABEL_MAP[props.product.category] ?? props.product.category,
);
</script>
