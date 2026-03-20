<template>
  <div
    class="border-default bg-default overflow-hidden rounded-xl border transition-shadow hover:shadow-sm"
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
        <!-- 标题行 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-highlighted text-sm font-medium">{{
            product.name
          }}</span>
          <UBadge variant="outline" color="neutral" size="xs">
            {{ categoryLabel }}
          </UBadge>
          <UBadge
            v-if="product.brand"
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
          <!-- 状态标签 -->
          <UBadge
            v-if="product.status === 'bookmarked'"
            variant="soft"
            color="info"
            size="xs"
          >
            已收藏
          </UBadge>
          <UBadge
            v-else-if="product.status === 'purchased'"
            variant="soft"
            color="success"
            size="xs"
          >
            已购买
          </UBadge>
        </div>

        <!-- 描述 -->
        <p
          v-if="product.description"
          class="text-muted mt-0.5 line-clamp-2 text-xs"
        >
          {{ product.description }}
        </p>

        <!-- 推荐理由 -->
        <p
          v-if="product.reason"
          class="text-primary mt-0.5 line-clamp-1 text-xs italic"
        >
          💡 {{ product.reason }}
        </p>

        <!-- 评分（已评分时显示） -->
        <div
          v-if="product.rating != null"
          class="mt-1 flex items-center gap-1"
        >
          <UIcon name="i-lucide-star" class="text-warning size-3" />
          <span class="text-muted text-xs">{{ product.rating }} / 5</span>
        </div>
      </div>

      <!-- 操作按钮组 -->
      <div class="mt-0.5 flex shrink-0 gap-1">
        <!-- 收藏 -->
        <UButton
          v-if="product.status !== 'bookmarked' && product.status !== 'purchased'"
          icon="i-lucide-bookmark"
          variant="ghost"
          color="primary"
          size="xs"
          title="收藏"
          @click="emit('bookmark', product.id)"
        />
        <!-- 标记已购买 -->
        <UButton
          v-if="product.status !== 'purchased'"
          icon="i-lucide-shopping-cart"
          variant="ghost"
          color="success"
          size="xs"
          title="标记已购买"
          @click="emit('purchased', product.id)"
        />
        <!-- 购买链接 -->
        <UButton
          v-if="product.purchaseUrl"
          icon="i-lucide-external-link"
          variant="ghost"
          color="neutral"
          size="xs"
          title="购买链接"
          :to="product.purchaseUrl"
          target="_blank"
        />
        <!-- 删除 -->
        <UButton
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          size="xs"
          title="删除"
          @click="emit('delete', product.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '#shared/types/db';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits<{
  bookmark: [id: number];
  purchased: [id: number];
  delete: [id: number];
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
  storage: '收纳用品',
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
