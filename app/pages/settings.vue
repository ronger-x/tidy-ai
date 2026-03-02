<template>
  <div class="contents">
    <!-- Two-panel layout -->
    <div class="flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden">
      <!-- ── Left sidebar: provider list ─────────────────────────────────────── -->
      <div class="border-default flex w-60 shrink-0 flex-col border-r lg:w-64">
        <!-- Search + add -->
        <div class="border-default flex items-center gap-2 border-b px-3 py-2">
          <UInput
            v-model="sidebarSearch"
            placeholder="搜索服务商..."
            size="sm"
            variant="none"
            leading-icon="i-lucide-search"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-plus"
            variant="ghost"
            color="primary"
            size="sm"
            @click="openAdd()"
          />
        </div>

        <!-- Provider groups -->
        <div class="flex-1 overflow-y-auto py-2">
          <!-- Loading skeleton -->
          <div v-if="store.loadingProviders" class="flex flex-col gap-1 px-2">
            <div
              v-for="n in 3"
              :key="n"
              class="bg-elevated/50 h-10 animate-pulse rounded-lg"
            />
          </div>

          <template v-else>
            <!-- Enabled group -->
            <div v-if="enabledFiltered.length">
              <div
                class="text-muted px-3 py-1 text-[11px] font-semibold tracking-wider uppercase"
              >
                已启用
              </div>
              <button
                v-for="p in enabledFiltered"
                :key="p.id"
                class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
                :class="
                  selectedId === p.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-default hover:bg-elevated/60'
                "
                @click="selectProvider(p.id)"
              >
                <div
                  class="flex size-6 shrink-0 items-center justify-center rounded-md"
                  :class="selectedId === p.id ? 'bg-primary/20' : 'bg-elevated'"
                >
                  <UIcon name="i-lucide-cloud" class="size-3.5" />
                </div>
                <span class="truncate text-sm font-medium">{{ p.name }}</span>
                <span
                  class="bg-success ml-auto size-1.5 shrink-0 rounded-full"
                />
              </button>
            </div>

            <!-- Disabled group -->
            <div
              v-if="disabledFiltered.length"
              :class="enabledFiltered.length ? 'mt-2' : ''"
            >
              <div
                class="text-muted px-3 py-1 text-[11px] font-semibold tracking-wider uppercase"
              >
                未启用
              </div>
              <button
                v-for="p in disabledFiltered"
                :key="p.id"
                class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors"
                :class="
                  selectedId === p.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-elevated/60'
                "
                @click="selectProvider(p.id)"
              >
                <div
                  class="bg-elevated flex size-6 shrink-0 items-center justify-center rounded-md"
                >
                  <UIcon name="i-lucide-cloud" class="size-3.5" />
                </div>
                <span class="truncate text-sm">{{ p.name }}</span>
              </button>
            </div>

            <!-- Empty state -->
            <div
              v-if="!enabledFiltered.length && !disabledFiltered.length"
              class="text-muted flex flex-col items-center gap-2 py-8 text-center text-xs"
            >
              <UIcon name="i-lucide-cloud-off" class="size-6" />
              <span>暂无供应商</span>
            </div>
          </template>
        </div>
      </div>

      <!-- ── Right panel ─────────────────────────────────────────────────────── -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- No selection placeholder -->
        <div
          v-if="!selectedProvider"
          class="flex flex-1 flex-col items-center justify-center gap-3 text-center"
        >
          <div class="bg-elevated rounded-full p-5">
            <UIcon name="i-lucide-settings" class="text-muted size-10" />
          </div>
          <p class="text-muted text-sm">从左侧选择一个供应商进行配置</p>
          <UButton
            leading-icon="i-lucide-plus"
            variant="soft"
            color="primary"
            size="sm"
            @click="openAdd()"
          >
            添加供应商
          </UButton>
        </div>

        <!-- Provider detail -->
        <template v-else>
          <!-- Provider header bar -->
          <div
            class="border-default flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-xl"
              >
                <UIcon name="i-lucide-cloud" class="text-primary size-5" />
              </div>
              <div class="min-w-0">
                <h2 class="text-highlighted truncate text-base font-semibold">
                  {{ selectedProvider.name }}
                </h2>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <USwitch
                :model-value="selectedProvider.enabled"
                @update:model-value="
                  store.updateProvider(selectedProvider!.id, {
                    enabled: $event,
                  })
                "
              />
              <UButton
                variant="ghost"
                color="neutral"
                size="sm"
                icon="i-lucide-pencil"
                @click="openEdit(selectedProvider)"
              />
              <UButton
                variant="ghost"
                color="error"
                size="sm"
                icon="i-lucide-trash-2"
                :loading="deletingId === selectedProvider.id"
                @click="handleDelete(selectedProvider.id)"
              />
            </div>
          </div>

          <!-- Settings fields -->
          <div class="border-default shrink-0 border-b px-6 py-5">
            <div class="grid grid-cols-[1fr_auto] items-start gap-y-5">
              <!-- API Key row -->
              <div>
                <div class="text-highlighted text-sm font-medium">API Key</div>
                <div class="text-muted mt-0.5 text-xs">用于鉴权的密钥</div>
              </div>
              <UButton
                variant="soft"
                color="neutral"
                size="xs"
                leading-icon="i-lucide-pencil"
                @click="openEdit(selectedProvider)"
              >
                修改
              </UButton>

              <!-- Base URL row -->
              <div>
                <div class="text-highlighted text-sm font-medium">
                  API 代理地址
                </div>
                <div class="text-muted mt-0.5 text-xs">必须包含 http(s)://</div>
              </div>
              <div class="text-muted truncate text-right text-sm">
                {{ selectedProvider.baseUrl }}
              </div>
            </div>
          </div>

          <!-- Model list -->
          <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
            <!-- Model list header -->
            <div class="mb-3 flex shrink-0 items-center gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <span class="text-highlighted text-sm font-semibold"
                  >模型列表</span
                >
                <span v-if="selectedModels.length" class="text-muted text-xs">
                  共 {{ selectedModels.length }} 个可用
                </span>
              </div>
              <div class="ml-auto flex items-center gap-2">
                <UInput
                  v-if="selectedModels.length"
                  v-model="modelSearch"
                  placeholder="搜索模型..."
                  size="xs"
                  leading-icon="i-lucide-search"
                  class="w-40"
                />
                <UButton
                  size="xs"
                  variant="soft"
                  color="primary"
                  leading-icon="i-lucide-refresh-cw"
                  :loading="fetchingModels"
                  @click="fetchModels(selectedProvider.id)"
                >
                  获取模型列表
                </UButton>
              </div>
            </div>

            <!-- Empty: no models fetched yet -->
            <div
              v-if="!selectedModels.length"
              class="border-default flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center"
            >
              <UIcon name="i-lucide-cpu" class="text-muted size-8" />
              <p class="text-muted text-sm">
                尚未拉取模型，点击「获取模型列表」
              </p>
            </div>

            <!-- Model rows -->
            <div v-else class="min-h-0 flex-1 overflow-y-auto">
              <!-- Enabled models group -->
              <div v-if="enabledModelsFiltered.length" class="mb-4">
                <div
                  class="text-muted mb-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase"
                >
                  <span>已启用</span>
                  <UIcon name="i-lucide-eye" class="size-3" />
                </div>
                <div
                  class="border-default divide-default divide-y overflow-hidden rounded-xl border"
                >
                  <div
                    v-for="model in enabledModelsFiltered"
                    :key="model.id"
                    class="flex items-center gap-3 px-4 py-2.5"
                  >
                    <UIcon
                      name="i-lucide-cpu"
                      class="text-primary size-3.5 shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <div
                        class="text-highlighted truncate text-sm font-medium"
                      >
                        {{ model.modelId }}
                      </div>
                      <div
                        v-if="model.name && model.name !== model.modelId"
                        class="text-muted truncate text-xs"
                      >
                        {{ model.name }}
                      </div>
                    </div>
                    <USwitch
                      :model-value="model.enabled"
                      size="xs"
                      @update:model-value="handleToggleModel(model.id, $event)"
                    />
                  </div>
                </div>
              </div>

              <!-- Disabled models group -->
              <div v-if="disabledModelsFiltered.length">
                <div
                  class="text-muted mb-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase"
                >
                  <span>未启用</span>
                  <UIcon name="i-lucide-eye-off" class="size-3" />
                </div>
                <div
                  class="border-default divide-default divide-y overflow-hidden rounded-xl border"
                >
                  <div
                    v-for="model in disabledModelsFiltered"
                    :key="model.id"
                    class="flex items-center gap-3 px-4 py-2.5"
                  >
                    <UIcon
                      name="i-lucide-cpu"
                      class="text-muted size-3.5 shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="text-muted truncate text-sm">
                        {{ model.modelId }}
                      </div>
                      <div
                        v-if="model.name && model.name !== model.modelId"
                        class="text-muted/60 truncate text-xs"
                      >
                        {{ model.name }}
                      </div>
                    </div>
                    <USwitch
                      :model-value="model.enabled"
                      size="xs"
                      @update:model-value="handleToggleModel(model.id, $event)"
                    />
                  </div>
                </div>
              </div>

              <!-- No search results -->
              <div
                v-if="
                  !enabledModelsFiltered.length &&
                  !disabledModelsFiltered.length &&
                  modelSearch
                "
                class="text-muted py-8 text-center text-sm"
              >
                未找到匹配的模型
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Provider edit / add modal -->
    <UModal
      v-model:open="showModal"
      :title="editTarget ? '编辑供应商' : '添加供应商'"
    >
      <template #body>
        <form class="flex flex-col gap-4 p-1" @submit.prevent="handleSubmit">
          <UFormField label="显示名称" required>
            <UInput
              v-model="form.name"
              placeholder="DeepSeek / Ollama / OpenAI"
              class="w-full"
            />
          </UFormField>
          <UFormField label="API Base URL" required>
            <UInput
              v-model="form.baseUrl"
              placeholder="https://api.deepseek.com/v1"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="editTarget ? 'API Key（留空保持不变）' : 'API Key'"
          >
            <UInput
              v-model="form.apiKey"
              type="password"
              :placeholder="editTarget ? '••••••••（留空保持原值）' : 'sk-...'"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" @click="showModal = false"
              >取消</UButton
            >
            <UButton type="submit" :loading="submitting">
              {{ editTarget ? '保存' : '添加' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Provider } from '#shared/types/db';

const store = useProvidersStore();
const toast = useToast();

onMounted(async () => {
  await store.fetchProviders();
  await store.fetchAllModels();
  // Auto-select first provider
  if (!selectedId.value && store.providers.length) {
    selectedId.value = store.providers[0]!.id;
  }
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

const sidebarSearch = ref('');
const selectedId = ref<number | null>(null);

const filteredProviders = computed(() => {
  const q = sidebarSearch.value.trim().toLowerCase();
  return q
    ? store.providers.filter((p) => p.name.toLowerCase().includes(q))
    : store.providers;
});

const enabledFiltered = computed(() =>
  filteredProviders.value.filter((p) => p.enabled),
);
const disabledFiltered = computed(() =>
  filteredProviders.value.filter((p) => !p.enabled),
);

const selectedProvider = computed(
  () => store.providers.find((p) => p.id === selectedId.value) ?? null,
);

function selectProvider(id: number) {
  selectedId.value = id;
  modelSearch.value = '';
}

// ── Models for selected provider ──────────────────────────────────────────────

const modelSearch = ref('');

const selectedModels = computed(() =>
  selectedId.value ? (store.modelsByProvider.get(selectedId.value) ?? []) : [],
);

const filteredModels = computed(() => {
  const q = modelSearch.value.trim().toLowerCase();
  return q
    ? selectedModels.value.filter(
        (m) =>
          m.modelId.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q),
      )
    : selectedModels.value;
});

const enabledModelsFiltered = computed(() =>
  filteredModels.value.filter((m) => m.enabled),
);
const disabledModelsFiltered = computed(() =>
  filteredModels.value.filter((m) => !m.enabled),
);

// ── Toggle model enabled state ───────────────────────────────────────────────

async function handleToggleModel(id: number, enabled: boolean) {
  try {
    await store.toggleModel(id, enabled);
  } catch {
    toast.add({
      title: enabled ? '启用失败' : '禁用失败',
      description: '请检查网络后重试',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

// ── Fetch models ──────────────────────────────────────────────────────────────

const fetchingModels = ref(false);

async function fetchModels(providerId: number) {
  fetchingModels.value = true;
  try {
    const result = await store.fetchModelsFromProvider(providerId);
    toast.add({
      title: `已获取 ${result.length} 个模型`,
      icon: 'i-lucide-check-circle',
      color: 'success',
    });
  } catch (err) {
    toast.add({
      title: '获取失败',
      description: (err as Error).message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    fetchingModels.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const deletingId = ref<number | null>(null);

async function handleDelete(id: number) {
  deletingId.value = id;
  try {
    await store.deleteProvider(id);
    toast.add({ title: '已删除供应商', icon: 'i-lucide-trash-2' });
    // Select something else
    if (selectedId.value === id) {
      selectedId.value = store.providers[0]?.id ?? null;
    }
  } catch {
    toast.add({
      title: '删除失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    deletingId.value = null;
  }
}

// ── Add / Edit ────────────────────────────────────────────────────────────────

const showModal = ref(false);
const editTarget = ref<Provider | null>(null);
const submitting = ref(false);
const form = reactive({ name: '', baseUrl: '', apiKey: '' });

function openAdd() {
  editTarget.value = null;
  Object.assign(form, { name: '', baseUrl: '', apiKey: '' });
  showModal.value = true;
}

function openEdit(p: Provider) {
  editTarget.value = p;
  Object.assign(form, { name: p.name, baseUrl: p.baseUrl, apiKey: '' });
  showModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim() || !form.baseUrl.trim()) return;
  submitting.value = true;
  try {
    if (editTarget.value) {
      await store.updateProvider(editTarget.value.id, {
        name: form.name,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey || undefined,
      });
      toast.add({
        title: '供应商已更新',
        icon: 'i-lucide-check-circle',
        color: 'success',
      });
    } else {
      const p = await store.createProvider({
        name: form.name,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
      });
      selectedId.value = p.id;
      toast.add({
        title: '供应商已添加',
        icon: 'i-lucide-check-circle',
        color: 'success',
      });
    }
    showModal.value = false;
  } catch (err) {
    toast.add({
      title: '保存失败',
      description: (err as Error).message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    submitting.value = false;
  }
}

useHead({ title: 'Tidy AI - AI 供应商设置' });
</script>
