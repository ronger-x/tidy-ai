<template>
  <div class="flex h-full flex-col">
    <!-- 页面标题 -->
    <div
      class="border-default flex h-12 shrink-0 items-center justify-between border-b px-4"
    >
      <div class="flex items-center gap-2">
        <UDashboardSidebarCollapse />
        <h1 class="text-highlighted text-lg font-bold">产品库</h1>
        <span class="text-muted text-sm">
          {{ productsStore.products.length }} 个产品 ·
          {{ productsStore.bookmarked.length }} 个已收藏
        </span>
      </div>
      <div class="flex gap-2">
        <UButton
          leading-icon="i-lucide-refresh-cw"
          variant="ghost"
          color="neutral"
          size="sm"
          :loading="productsStore.loading"
          @click="handleRefresh"
        />
      </div>
    </div>

    <!-- 可滚动内容 -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <!-- 搜索栏 -->
        <div class="flex items-center gap-3">
          <UInput
            v-model="searchText"
            placeholder="搜索产品名称、品牌..."
            leading-icon="i-lucide-search"
            class="flex-1"
          />
        </div>

        <!-- Tab 视图 -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full" />

        <!-- 空状态 -->
        <div
          v-if="currentProducts.length === 0 && !productsStore.loading"
          class="flex flex-col items-center gap-3 py-16 text-center"
        >
          <div class="bg-neutral/10 rounded-full p-4">
            <UIcon name="i-lucide-shopping-bag" class="text-muted size-8" />
          </div>
          <p class="text-muted text-sm">
            {{ emptyMessage }}
          </p>
          <UButton
            to="/"
            variant="soft"
            color="primary"
            size="sm"
            leading-icon="i-lucide-message-circle"
          >
            去对话页获取推荐
          </UButton>
        </div>

        <!-- 按分类视图 -->
        <template v-else-if="activeTab === 'category'">
          <div
            v-for="group in byCategoryGroups"
            :key="group.category"
            class="flex flex-col gap-3"
          >
            <div class="flex items-center gap-2">
              <div
                class="flex size-5 items-center justify-center rounded"
                :class="pcBg(group.category)"
              >
                <UIcon
                  :name="pcIcon(group.category)"
                  class="size-3"
                  :class="pcColor(group.category)"
                />
              </div>
              <span class="text-highlighted text-sm font-semibold">{{
                pcLabel(group.category)
              }}</span>
              <UBadge variant="soft" color="neutral" size="xs">{{
                group.products.length
              }}</UBadge>
            </div>
            <ProductCard
              v-for="product in group.products"
              :key="product.id"
              :product="product"
              @bookmark="handleBookmark"
              @purchased="handlePurchased"
              @delete="handleDelete"
            />
          </div>
        </template>

        <!-- 列表视图（全部/已收藏/已购买） -->
        <template v-else>
          <ProductCard
            v-for="product in currentProducts"
            :key="product.id"
            :product="product"
            @bookmark="handleBookmark"
            @purchased="handlePurchased"
            @delete="handleDelete"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductCategory } from '#shared/types/db';

const productsStore = useProductsStore();
const toast = useToast();

// 加载数据
onMounted(() => productsStore.fetch());

// Tab 配置
const activeTab = ref('all');
const tabs = [
  { value: 'all', label: '全部', icon: 'i-lucide-list' },
  { value: 'bookmarked', label: '已收藏', icon: 'i-lucide-bookmark' },
  { value: 'purchased', label: '已购买', icon: 'i-lucide-shopping-cart' },
  { value: 'category', label: '按分类', icon: 'i-lucide-tag' },
];

// 搜索
const searchText = ref('');

/** 根据搜索词过滤 */
function filterBySearch(list: Product[]): Product[] {
  const q = searchText.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q),
  );
}

/** 当前 Tab 对应的产品列表 */
const currentProducts = computed(() => {
  let list: Product[];
  switch (activeTab.value) {
    case 'bookmarked':
      list = productsStore.bookmarked;
      break;
    case 'purchased':
      list = productsStore.purchased;
      break;
    default:
      list = productsStore.products;
  }
  return filterBySearch(list);
});

const emptyMessage = computed(() => {
  if (searchText.value.trim()) return '没有找到匹配的产品';
  switch (activeTab.value) {
    case 'bookmarked':
      return '还没有收藏产品';
    case 'purchased':
      return '还没有标记已购买的产品';
    default:
      return '产品库为空，和 AI 对话获取产品推荐吧';
  }
});

// 按分类分组
const categoryOrder: ProductCategory[] = [
  'cleaner',
  'tool',
  'storage',
  'consumable',
  'other',
];

const byCategoryGroups = computed(() => {
  const groups: Array<{ category: ProductCategory; products: Product[] }> = [];
  productsStore.byCategory.forEach(
    (items: Product[], category: ProductCategory) => {
      const filtered = filterBySearch(items);
      if (filtered.length > 0) {
        groups.push({ category, products: filtered });
      }
    },
  );
  groups.sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category),
  );
  return groups;
});

// 操作
async function handleBookmark(id: number) {
  try {
    await productsStore.bookmark(id);
    toast.add({
      title: '已收藏',
      icon: 'i-lucide-bookmark-check',
      color: 'success',
    });
  } catch {
    toast.add({ title: '操作失败', color: 'error' });
  }
}

async function handlePurchased(id: number) {
  try {
    await productsStore.markPurchased(id);
    toast.add({
      title: '已标记为已购买',
      icon: 'i-lucide-shopping-cart',
      color: 'success',
    });
  } catch {
    toast.add({ title: '操作失败', color: 'error' });
  }
}

async function handleDelete(id: number) {
  try {
    await productsStore.remove(id);
    toast.add({ title: '已删除', icon: 'i-lucide-trash-2', color: 'neutral' });
  } catch {
    toast.add({ title: '删除失败', color: 'error' });
  }
}

async function handleRefresh() {
  await productsStore.fetch();
}

// 产品分类图标/颜色/标签
function pcIcon(cat: ProductCategory) {
  const map: Record<string, string> = {
    cleaner: 'i-lucide-spray-can',
    tool: 'i-lucide-wrench',
    storage: 'i-lucide-box',
    consumable: 'i-lucide-package-open',
    other: 'i-lucide-tag',
  };
  return map[cat] ?? 'i-lucide-tag';
}

function pcColor(cat: ProductCategory) {
  const map: Record<string, string> = {
    cleaner: 'text-cyan-500',
    tool: 'text-orange-500',
    storage: 'text-indigo-500',
    consumable: 'text-lime-500',
    other: 'text-neutral-500',
  };
  return map[cat] ?? 'text-neutral-500';
}

function pcBg(cat: ProductCategory) {
  const map: Record<string, string> = {
    cleaner: 'bg-cyan-500/10',
    tool: 'bg-orange-500/10',
    storage: 'bg-indigo-500/10',
    consumable: 'bg-lime-500/10',
    other: 'bg-neutral-500/10',
  };
  return map[cat] ?? 'bg-neutral-500/10';
}

function pcLabel(cat: ProductCategory) {
  const map: Record<string, string> = {
    cleaner: '清洁剂',
    tool: '工具',
    storage: '收纳用品',
    consumable: '耗材',
    other: '其他',
  };
  return map[cat] ?? cat;
}

useHead({ title: 'Tidy AI - 产品库' });
</script>
