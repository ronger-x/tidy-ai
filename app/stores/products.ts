import { defineStore } from 'pinia';
import type {
  Product,
  ParsedProduct,
  ProductCategory,
  ProductStatus,
} from '#shared/types/db';

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);

  /** 获取产品列表，支持分类/状态/搜索筛选 */
  async function fetch(
    filters: {
      category?: ProductCategory;
      status?: ProductStatus;
      search?: string;
    } = {},
  ) {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      const query = params.toString() ? `?${params}` : '';
      products.value = await $fetch<Product[]>(`/api/products${query}`);
    } finally {
      loading.value = false;
    }
  }

  /** 批量保存 AI 推荐的产品（自动去重 by sourceKey） */
  async function saveProducts(items: ParsedProduct[]) {
    const created = await $fetch<Product[]>('/api/products', {
      method: 'POST',
      body: { products: items },
    });
    // 合并到本地状态，避免重复
    const existingKeys = new Set(products.value.map((p) => p.sourceKey));
    const newOnes = created.filter((p) => !existingKeys.has(p.sourceKey));
    products.value = [...products.value, ...newOnes];
    return created;
  }

  /** 关联产品到任务 */
  async function linkToTask(taskId: number, productId: number) {
    await $fetch(`/api/tasks/${taskId}/products`, {
      method: 'POST',
      body: { productId },
    });
  }

  /** 解除任务-产品关联 */
  async function unlinkFromTask(taskId: number, productId: number) {
    await $fetch(`/api/tasks/${taskId}/products/${productId}`, {
      method: 'DELETE',
    });
  }

  /** 收藏产品 */
  async function bookmark(id: number) {
    return updateProduct(id, { status: 'bookmarked' });
  }

  /** 标记为已购买 */
  async function markPurchased(id: number) {
    return updateProduct(id, { status: 'purchased' });
  }

  /** 更新产品字段 */
  async function updateProduct(id: number, data: Partial<Product>) {
    const updated = await $fetch<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: data,
    });
    const idx = products.value.findIndex((p) => p.id === id);
    if (idx !== -1) products.value[idx] = updated;
    return updated;
  }

  /** 删除产品 */
  async function remove(id: number) {
    await $fetch(`/api/products/${id}`, { method: 'DELETE' });
    products.value = products.value.filter((p) => p.id !== id);
  }

  // ── 计算属性 ──────────────────────────────────────────────────────────────

  /** 按分类分组 */
  const byCategory = computed(() => {
    const map = new Map<ProductCategory, Product[]>();
    for (const p of products.value) {
      const list = map.get(p.category as ProductCategory) ?? [];
      list.push(p);
      map.set(p.category as ProductCategory, list);
    }
    return map;
  });

  /** 已收藏的产品 */
  const bookmarked = computed(() =>
    products.value.filter((p) => p.status === 'bookmarked'),
  );

  /** 已购买的产品 */
  const purchased = computed(() =>
    products.value.filter((p) => p.status === 'purchased'),
  );

  /** 已保存产品的 sourceKey 集合，用于去重判断 */
  const savedKeySet = computed(
    () => new Set(products.value.map((p) => p.sourceKey).filter(Boolean)),
  );

  return {
    products,
    loading,
    byCategory,
    bookmarked,
    purchased,
    savedKeySet,
    fetch,
    saveProducts,
    linkToTask,
    unlinkFromTask,
    bookmark,
    markPurchased,
    updateProduct,
    remove,
  };
});
