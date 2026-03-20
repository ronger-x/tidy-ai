<template>
  <div class="flex h-full flex-col">
    <!-- 会话标题 header -->
    <div class="border-default flex h-12 shrink-0 items-center border-b px-4">
      <UDashboardSidebarCollapse />
      <h2
        v-if="chatStore.messages.length > 0 && currentTitle"
        class="text-highlighted truncate text-sm font-semibold"
      >
        {{ currentTitle }}
      </h2>
    </div>

    <!-- Scrollable content area -->
    <div class="mt-3 min-h-0 flex-1 overflow-y-auto">
      <!-- Empty state -->
      <div
        v-if="chatStore.messages.length === 0"
        class="flex min-h-full flex-col items-center justify-center gap-4 py-24 text-center"
      >
        <div class="bg-primary/10 rounded-full p-5">
          <UIcon name="i-lucide-sparkles" class="text-primary size-10" />
        </div>
        <h1 class="text-highlighted text-2xl font-bold">Tidy AI 整理助手</h1>
        <p class="text-muted max-w-md text-sm leading-relaxed">
          描述你需要整理的物品或空间，AI
          会为你生成专属整理方案，并自动拆分成可执行的任务清单。
        </p>
        <div class="mt-2 flex flex-wrap justify-center gap-2">
          <UButton
            v-for="tip in suggestions"
            :key="tip"
            variant="soft"
            color="neutral"
            size="sm"
            @click="inputText = tip"
          >
            {{ tip }}
          </UButton>
        </div>
      </div>

      <!-- Messages -->
      <UChatMessages
        v-else
        :messages="uiMessages"
        :status="chatStatus"
        should-auto-scroll
        class="mx-auto w-full max-w-4xl"
        :assistant="{
          icon: 'i-lucide-sparkles',
        }"
      >
        <template #content="{ message }">
          <!-- 用户消息 -->
          <template v-if="message.role === 'user'">
            <div
              v-if="chatStore.messages[Number(message.id)]?.images?.length"
              class="mb-1.5 flex flex-wrap gap-1.5"
            >
              <img
                v-for="(img, imgIdx) in chatStore.messages[Number(message.id)]
                  ?.images"
                :key="imgIdx"
                :src="img"
                class="size-20 cursor-pointer rounded-lg border border-white/20 object-cover"
                @click="previewImage = img"
              />
            </div>
            <p class="whitespace-pre-wrap">
              {{ chatStore.messages[Number(message.id)]?.content }}
            </p>
          </template>

          <!-- 助手消息 -->
          <template v-else>
            <!-- 模型标签 -->
            <div
              v-if="chatStore.messages[Number(message.id)]?.modelLabel"
              class="mb-1 flex items-center gap-1"
            >
              <UIcon name="i-lucide-cpu" class="text-muted size-3" />
              <span class="text-muted text-xs">
                {{ chatStore.messages[Number(message.id)]?.modelLabel }}
              </span>
            </div>

            <!-- Reasoning 思维链 -->
            <Reasoning
              v-if="chatStore.messages[Number(message.id)]?.reasoning"
              :text="chatStore.messages[Number(message.id)]?.reasoning ?? ''"
              :is-streaming="
                chatStore.streaming &&
                Number(message.id) === chatStore.messages.length - 1
              "
              class="mb-2 max-w-full"
            />

            <!-- 流式输出阶段：纯文本 + 光标 -->
            <template
              v-if="
                chatStore.streaming &&
                Number(message.id) === chatStore.messages.length - 1
              "
            >
              <div
                v-if="chatStore.messages[Number(message.id)]?.content"
                class="whitespace-pre-wrap"
              >
                {{
                  stripTasksBlock(
                    chatStore.messages[Number(message.id)]?.content ?? '',
                  )
                }}
                <span
                  class="bg-primary ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm align-middle"
                />
              </div>
            </template>
            <!-- 流式完成后：MDC 渲染 + Shiki Stream -->
            <MDCCached
              v-else
              :value="
                chatStore.messages[Number(message.id)]?.displayContent ||
                stripTasksBlock(
                  chatStore.messages[Number(message.id)]?.content || '',
                )
              "
              :cache-key="`msg-${message.id}`"
              :components="mdcComponents"
              :parser-options="{ highlight: false }"
              class="prose dark:prose-invert prose-sm max-w-none *:first:mt-0 *:last:mb-0"
            />

            <!-- 任务建议卡片（流式完成后展示） -->
            <template
              v-if="
                chatStore.messages[Number(message.id)]?.tasks?.length &&
                !(
                  chatStore.streaming &&
                  Number(message.id) === chatStore.messages.length - 1
                )
              "
            >
              <div class="mt-2 flex items-center gap-2 px-1">
                <UIcon
                  name="i-lucide-list-checks"
                  class="text-primary size-3.5"
                />
                <span class="text-muted text-xs font-medium">
                  解析到
                  {{ chatStore.messages[Number(message.id)]!.tasks!.length }}
                  个整理任务
                </span>
                <div class="flex-1" />
                <UButton
                  v-if="
                    chatStore.messages[Number(message.id)]!.tasks!.some(
                      (t) => !t.key || !addedKeySet.has(t.key),
                    )
                  "
                  size="xs"
                  variant="soft"
                  color="primary"
                  leading-icon="i-lucide-save"
                  :loading="savingAll.has(Number(message.id))"
                  @click="
                    addAllTasks(
                      Number(message.id),
                      chatStore.messages[Number(message.id)]!.tasks!,
                    )
                  "
                >
                  一键添加全部
                </UButton>
                <UButton
                  v-else
                  size="xs"
                  variant="soft"
                  color="success"
                  leading-icon="i-lucide-check"
                  to="/tasks"
                >
                  前往任务清单
                </UButton>
              </div>
              <div class="mt-2 flex flex-col gap-2">
                <TaskSuggestionCard
                  v-for="(task, ti) in chatStore.messages[Number(message.id)]!
                    .tasks"
                  :key="ti"
                  :task="task"
                  :added="!!(task.key && addedKeySet.has(task.key))"
                  @add="addSingleTask(Number(message.id), ti, task)"
                />
              </div>
            </template>

            <!-- 产品推荐卡片（包含任务内嵌产品 + 独立推荐） -->
            <template
              v-if="
                collectProducts(Number(message.id)).length &&
                !(
                  chatStore.streaming &&
                  Number(message.id) === chatStore.messages.length - 1
                )
              "
            >
              <div class="mt-3 flex items-center gap-2 px-1">
                <UIcon
                  name="i-lucide-shopping-bag"
                  class="text-primary size-3.5"
                />
                <span class="text-muted text-xs font-medium">
                  推荐了
                  {{ collectProducts(Number(message.id)).length }}
                  个清洁/收纳产品
                </span>
                <div class="flex-1" />
                <UButton
                  v-if="
                    collectProducts(Number(message.id)).some(
                      (p) =>
                        !p.key || !savedProductKeySet.has(p.key),
                    )
                  "
                  size="xs"
                  variant="soft"
                  color="primary"
                  leading-icon="i-lucide-bookmark-plus"
                  :loading="savingAllProducts.has(Number(message.id))"
                  @click="saveAllProducts(Number(message.id))"
                >
                  一键收藏全部
                </UButton>
                <UButton
                  v-else
                  size="xs"
                  variant="soft"
                  color="success"
                  leading-icon="i-lucide-check"
                  to="/products"
                >
                  查看产品库
                </UButton>
              </div>
              <div class="mt-2 flex flex-col gap-2">
                <ProductSuggestionCard
                  v-for="(product, pi) in collectProducts(
                    Number(message.id),
                  )"
                  :key="pi"
                  :product="product"
                  :saved="
                    !!(
                      product.key &&
                      savedProductKeySet.has(product.key)
                    )
                  "
                  @save="saveSingleProduct(product)"
                />
              </div>
            </template>
          </template>
        </template>

        <!-- 复制按钮（助手消息，流式完成后） -->
        <template #actions="{ message }">
          <UButton
            v-if="
              message.role === 'assistant' &&
              !(
                chatStore.streaming &&
                Number(message.id) === chatStore.messages.length - 1
              )
            "
            :icon="
              copiedIndex === message.id
                ? 'i-lucide-copy-check'
                : 'i-lucide-copy'
            "
            variant="ghost"
            color="neutral"
            size="xs"
            :label="copiedIndex === message.id ? '已复制' : ''"
            @click="
              copyMessage(
                message.id,
                chatStore.messages[Number(message.id)]?.displayContent ||
                  stripTasksBlock(
                    chatStore.messages[Number(message.id)]?.content || '',
                  ),
              )
            "
          />
        </template>
      </UChatMessages>
    </div>
    <!-- /Scrollable content area -->

    <!-- Image preview overlay -->
    <div
      v-if="previewImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      @click="previewImage = null"
    >
      <img
        :src="previewImage"
        class="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
      />
    </div>

    <!-- Input area: fixed at bottom, outside the scroll area -->
    <div
      class="bg-default/95 supports-[backdrop-filter]:bg-default/80 mx-auto w-full max-w-4xl px-4 pt-2 pb-4 backdrop-blur"
    >
      <!-- Attached image previews -->
      <div
        v-if="pendingImages.length"
        class="border-default bg-default/80 mb-1 flex flex-wrap gap-2 rounded-xl border px-3 py-2 backdrop-blur"
      >
        <div v-for="(img, i) in pendingImages" :key="i" class="group relative">
          <img :src="img" class="size-14 rounded-lg object-cover" />
          <button
            class="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
            @click="removeImage(i)"
          >
            <UIcon name="i-lucide-x" class="size-3" />
          </button>
        </div>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onFileChange"
      />

      <UChatPrompt
        v-model="inputText"
        :disabled="chatStore.streaming"
        placeholder="描述你需要整理的物品或空间，例如：厨房里有很多调料和厨具..."
        variant="outline"
        class="shadow-lg"
        @submit="handleSend"
      >
        <template #footer>
          <div class="flex items-center gap-1">
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              leading-icon="i-lucide-trash-2"
              :disabled="chatStore.messages.length === 0"
              @click="chatStore.clear()"
            >
              清空对话
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-image"
              :disabled="chatStore.streaming"
              @click="fileInput?.click()"
            />
            <USelectMenu
              v-model="selectedModelId"
              :items="modelOptions"
              value-key="value"
              placeholder="选择模型"
              size="xs"
              class="w-56"
              :ui="{ content: 'w-72' }"
            >
              <template #leading>
                <UIcon name="i-lucide-cpu" class="text-muted size-3.5" />
              </template>
            </USelectMenu>
          </div>

          <UChatPromptSubmit
            :status="chatStore.streaming ? 'streaming' : 'ready'"
            color="primary"
            size="sm"
            @stop="chatStore.stop()"
          />
        </template>
      </UChatPrompt>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParsedTask } from '~/stores/chat';
import type { ParsedProduct } from '~~/shared/types/db';
import type { DefineComponent } from 'vue';
import ProseStreamPre from '~/components/prose/PreStream.vue';
import { useClipboard } from '@vueuse/core';

const chatStore = useChatStore();
const tasksStore = useTasksStore();
const productsStore = useProductsStore();
const providersStore = useProvidersStore();
const conversationsStore = useConversationsStore();
const toast = useToast();

// 当前会话标题
const currentTitle = computed(() => {
  if (!chatStore.currentConversationId) return null;
  return (
    conversationsStore.list.find(
      (c) => c.id === chatStore.currentConversationId,
    )?.title ?? null
  );
});

// ── Clipboard ────────────────────────────────────────────────────────────────
const { copy: copyToClipboard } = useClipboard();
const copiedIndex = ref<string | null>(null);

function copyMessage(id: string, content: string) {
  copyToClipboard(content);
  copiedIndex.value = id;
  setTimeout(() => {
    if (copiedIndex.value === id) copiedIndex.value = null;
  }, 2000);
}

// ── UChatMessages 数据格式转换 ───────────────────────────────────────────────
const uiMessages = computed(() =>
  chatStore.messages.map((msg, i) => ({
    id: String(i),
    role: msg.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: msg.content }],
  })),
);

const chatStatus = computed(() => {
  if (!chatStore.streaming) return 'ready' as const;
  const lastMsg = chatStore.messages.at(-1);
  if (lastMsg?.role === 'assistant' && !lastMsg.content)
    return 'submitted' as const;
  return 'streaming' as const;
});

// ── MDC component overrides (Shiki Stream for code blocks) ───────────────────
const mdcComponents = { pre: ProseStreamPre as unknown as DefineComponent };

const inputText = ref('');

/** 通过 sourceKey 判断任务是否已存入数据库（跨会话有效） */
const addedKeySet = computed(
  () => new Set(tasksStore.tasks.map((t) => t.sourceKey).filter(Boolean)),
);
const savingAll = ref(new Set<number>());

/** 通过 sourceKey 判断产品是否已保存（去重） */
const savedProductKeySet = computed(() => productsStore.savedKeySet);
const savingAllProducts = ref(new Set<number>());

// ── Image upload ─────────────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null);
const pendingImages = ref<string[]>([]);
const previewImage = ref<string | null>(null);

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        pendingImages.value.push(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  });
  // Reset input so the same file can be selected again
  if (fileInput.value) fileInput.value.value = '';
}

function removeImage(idx: number) {
  pendingImages.value.splice(idx, 1);
}

// ── Model selection ──────────────────────────────────────────────────────────

const selectedModelId = computed({
  get: () => providersStore.selectedModelId ?? undefined,
  set: (v: number | undefined) => {
    providersStore.selectedModelId = v ?? null;
  },
});

onMounted(() => {
  providersStore.fetchAllModels();
  tasksStore.fetch();
});

const modelOptions = computed(() =>
  providersStore.enabledModels.map((m) => ({
    label: `${m.providerName ?? '?'} / ${m.modelId}`,
    value: m.id,
  })),
);

const selectedModelLabel = computed(() => {
  if (!selectedModelId.value) return undefined;
  const m = providersStore.enabledModels.find(
    (x) => x.id === selectedModelId.value,
  );
  return m ? `${m.providerName ?? '?'} / ${m.modelId}` : undefined;
});

const suggestions = [
  '帮我整理厨房的调料和锅具',
  '我有很多 ESP32 和 STM32 开发板，如何分类存放？',
  '卧室的衣橱衣物太乱了',
  '工作台上堆满了 3D 打印耗材和工具',
  '家里养了两只猫，猫粮猫砂怎么管理？',
];

// ── Chat ─────────────────────────────────────────────────────────────────────

function stripTasksBlock(content: string) {
  return content.replace(/```(?:tasks|products|json)[\s\S]*?```/g, '').trim();
}

async function handleSend() {
  const text = inputText.value.trim();
  if (!text || chatStore.streaming) return;

  // 校验模型配置
  if (providersStore.enabledModels.length === 0) {
    toast.add({
      title: '请先配置 AI 供应商',
      description: '前往设置页面添加供应商并启用模型后即可开始对话',
      icon: 'i-lucide-alert-triangle',
      color: 'warning',
      actions: [
        {
          label: '前往设置',
          onClick: () => {
            navigateTo('/settings');
          },
        },
      ],
    });
    return;
  }
  if (!selectedModelId.value) {
    toast.add({
      title: '请选择模型',
      description: '请在输入框下方选择一个 AI 模型后再发送消息',
      icon: 'i-lucide-alert-triangle',
      color: 'warning',
    });
    return;
  }

  inputText.value = '';
  const images = pendingImages.value.slice();
  pendingImages.value = [];
  await chatStore.send(
    text,
    selectedModelId.value,
    selectedModelLabel.value,
    images.length ? images : undefined,
  );
}

// ── Task management ──────────────────────────────────────────────────────────

async function addSingleTask(
  msgIdx: number,
  taskIdx: number,
  task: ParsedTask,
) {
  try {
    await tasksStore.saveTasks([task]);
    // tasksStore.tasks 更新后，addedTitleSet 自动响应，无需手动维护 Map
    toast.add({
      title: '任务已添加',
      description: task.title,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  } catch {
    toast.add({
      title: '添加失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function addAllTasks(msgIdx: number, tasks: ParsedTask[]) {
  savingAll.value = new Set(savingAll.value).add(msgIdx);
  try {
    const toAdd = tasks.filter((t) => !t.key || !addedKeySet.value.has(t.key));
    if (!toAdd.length) return;
    await tasksStore.saveTasks(toAdd);
    // tasksStore.tasks 更新后，addedTitleSet 自动响应
    toast.add({
      title: '任务已保存',
      description: `${toAdd.length} 个任务已添加到清单`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  } catch {
    toast.add({
      title: '保存失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    savingAll.value.delete(msgIdx);
    savingAll.value = new Set(savingAll.value);
  }
}

// ── Product management ──────────────────────────────────────────────────────

/** 收集某条消息中的所有产品（任务内嵌 + 独立推荐） */
function collectProducts(msgIdx: number): ParsedProduct[] {
  const msg = chatStore.messages[msgIdx];
  if (!msg) return [];
  const all: ParsedProduct[] = [];
  // 任务内嵌的产品
  if (msg.tasks) {
    for (const task of msg.tasks) {
      if (task.products) all.push(...task.products);
    }
  }
  // 独立推荐的产品
  if (msg.products) all.push(...msg.products);
  // 按 key 去重
  const seen = new Set<string>();
  return all.filter((p) => {
    if (!p.key || seen.has(p.key)) return false;
    seen.add(p.key);
    return true;
  });
}

async function saveSingleProduct(product: ParsedProduct) {
  try {
    await productsStore.saveProducts([product]);
    toast.add({
      title: '产品已收藏',
      description: product.name,
      color: 'success',
      icon: 'i-lucide-bookmark-check',
    });
  } catch {
    toast.add({
      title: '收藏失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
}

async function saveAllProducts(msgIdx: number) {
  savingAllProducts.value = new Set(savingAllProducts.value).add(msgIdx);
  try {
    const all = collectProducts(msgIdx);
    const toSave = all.filter(
      (p) => !p.key || !savedProductKeySet.value.has(p.key),
    );
    if (!toSave.length) return;
    await productsStore.saveProducts(toSave);
    toast.add({
      title: '产品已保存',
      description: `${toSave.length} 个产品已添加到产品库`,
      color: 'success',
      icon: 'i-lucide-bookmark-check',
    });
  } catch {
    toast.add({
      title: '保存失败',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    savingAllProducts.value.delete(msgIdx);
    savingAllProducts.value = new Set(savingAllProducts.value);
  }
}

useHead({ title: 'Tidy AI - 整理助手' });
</script>
