import { defineStore } from 'pinia';
import type { Model, Provider } from '#shared/types/db';

export interface ModelWithProvider extends Model {
  providerName: string;
}

export const useProvidersStore = defineStore('providers', () => {
  const providers = ref<Provider[]>([]);
  const models = ref<ModelWithProvider[]>([]);
  const loadingProviders = ref(false);
  const loadingModels = ref(false);

  // Persist selected model ID via Cookie (works SSR + client)
  const selectedModelId = useCookie<number | null>(
    'tidy-ai:selected-model-id',
    {
      default: () => null,
      decode: (v) => (v ? Number(v) : null),
    },
  );

  // ── Providers ──────────────────────────────────────────────────────────────

  async function fetchProviders() {
    loadingProviders.value = true;
    try {
      providers.value = await $fetch<Provider[]>('/api/providers');
    } finally {
      loadingProviders.value = false;
    }
  }

  async function createProvider(data: {
    name: string;
    baseUrl: string;
    apiKey: string;
  }) {
    const p = await $fetch<Provider>('/api/providers', {
      method: 'POST',
      body: data,
    });
    providers.value = [...providers.value, p];
    return p;
  }

  async function updateProvider(
    id: number,
    data: {
      name?: string;
      baseUrl?: string;
      apiKey?: string;
      enabled?: boolean;
    },
  ) {
    const p = await $fetch<Provider>(`/api/providers/${id}`, {
      method: 'PATCH',
      body: data,
    });
    const idx = providers.value.findIndex((x) => x.id === id);
    if (idx !== -1) providers.value[idx] = p;
  }

  async function deleteProvider(id: number) {
    await $fetch(`/api/providers/${id}`, { method: 'DELETE' });
    providers.value = providers.value.filter((p) => p.id !== id);
    models.value = models.value.filter((m) => m.providerId !== id);
  }

  // ── Models ─────────────────────────────────────────────────────────────────

  async function fetchAllModels() {
    loadingModels.value = true;
    try {
      models.value = await $fetch<ModelWithProvider[]>('/api/models');
    } finally {
      loadingModels.value = false;
    }
  }

  async function fetchModelsFromProvider(providerId: number) {
    const result = await $fetch<Model[]>(
      `/api/providers/${providerId}/fetch-models`,
      { method: 'POST' },
    );
    // Refresh combined list
    await fetchAllModels();
    return result;
  }

  async function toggleModel(id: number, enabled: boolean) {
    // Optimistic update so the toggle feels instant
    const idx = models.value.findIndex((x) => x.id === id);
    if (idx !== -1) {
      models.value[idx] = { ...models.value[idx]!, enabled };
    }
    try {
      const m = await $fetch<Model>(`/api/models/${id}`, {
        method: 'PATCH',
        body: { enabled },
      });
      if (idx !== -1) models.value[idx] = { ...models.value[idx]!, ...m };
    } catch (err) {
      // Revert on failure
      if (idx !== -1) {
        models.value[idx] = { ...models.value[idx]!, enabled: !enabled };
      }
      throw err;
    }
  }

  /** Models grouped by provider, for the settings page */
  const modelsByProvider = computed(() => {
    const map = new Map<number, ModelWithProvider[]>();
    for (const m of models.value) {
      const list = map.get(m.providerId) ?? [];
      list.push(m);
      map.set(m.providerId, list);
    }
    return map;
  });

  /** Only enabled models, for the chat selector */
  const enabledModels = computed(() => models.value.filter((m) => m.enabled));

  return {
    providers,
    models,
    loadingProviders,
    loadingModels,
    selectedModelId,
    modelsByProvider,
    enabledModels,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    fetchAllModels,
    fetchModelsFromProvider,
    toggleModel,
  };
});
