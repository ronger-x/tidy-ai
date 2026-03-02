import { defineStore } from 'pinia';

export interface Message {
  role: 'user' | 'assistant';
  /** Raw content (may include ```tasks block for assistant messages) */
  content: string;
  /** Content with ```tasks block stripped – used for MDC rendering */
  displayContent?: string;
  /** Thinking/reasoning text (for models that support it) */
  reasoning?: string;
  /** DB id of the model that generated this message (assistant only) */
  modelId?: number;
  /** Human-readable label for display: "ProviderName / model-id" */
  modelLabel?: string;
  /** Parsed tasks attached to this assistant message */
  tasks?: ParsedTask[];
  /** Base64 data URLs for image attachments (user messages only) */
  images?: string[];
}

export interface ParsedTask {
  /** AI 生成的唯一标识，用于跨会话去重（如 "clean_kitchen_stove"） */
  key: string;
  title: string;
  description: string;
  category: 'clothing' | 'electronics' | 'cleaning' | 'supplies' | 'other';
  /** 房间/场景名称（AI 输出的字符串） */
  room?: string;
  /** 子步骤列表 */
  steps: string[];
  /** 重复周期（天），undefined 表示一次性任务 */
  recurrenceInterval?: number;
}

/** Extract ```tasks ... ``` block from assistant reply.
 *  Falls back to any ```json block containing an array, or bare JSON arrays.
 */
function parseTasks(content: string): ParsedTask[] {
  // Primary: ```tasks block
  const jsonStr =
    content.match(/```tasks\s*([\s\S]*?)```/)?.[1]?.trim() ??
    // Fallback 1: ```json block that starts with [
    content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)?.[1]?.trim() ??
    // Fallback 2: bare JSON array after a blank line
    content.match(/\n\s*(\[[\s\S]*\])\s*$/)?.[1]?.trim();

  if (!jsonStr) return [];
  try {
    const raw = JSON.parse(jsonStr) as Array<Record<string, unknown>>;
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => ({
      key: String(t.key ?? ''),
      title: String(t.title ?? ''),
      description: String(t.description ?? ''),
      category: (t.category as ParsedTask['category']) ?? 'other',
      room: t.room ? String(t.room) : undefined,
      steps: Array.isArray(t.steps) ? (t.steps as string[]) : [],
      recurrenceInterval:
        typeof t.recurrenceInterval === 'number'
          ? t.recurrenceInterval
          : undefined,
    }));
  } catch {
    return [];
  }
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([]);
  const streaming = ref(false);
  const currentConversationId = ref<number | null>(null);
  let abortController: AbortController | null = null;

  /** Tasks from the latest assistant message (reactive shortcut for UI) */
  const pendingTasks = computed<ParsedTask[]>(() => {
    const last = [...messages.value]
      .reverse()
      .find((m) => m.role === 'assistant');
    return last?.tasks ?? [];
  });

  /**
   * Send a user message.
   * @param userContent - the text typed by the user
   * @param modelId - DB id of the chosen model (undefined = env fallback)
   * @param modelLabel - display label shown on the message bubble
   * @param images - base64 data URLs of attached images
   */
  async function send(
    userContent: string,
    modelId?: number,
    modelLabel?: string,
    images?: string[],
  ) {
    const userMsg: Message = {
      role: 'user',
      content: userContent,
      images: images?.length ? images : undefined,
    };
    messages.value.push(userMsg);

    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      displayContent: '',
      modelId,
      modelLabel,
    };
    messages.value.push(assistantMsg);
    streaming.value = true;

    // Create/persist conversation before streaming
    const isFirstMessage = messages.value.length === 2;
    if (isFirstMessage && !currentConversationId.value) {
      try {
        const created = await $fetch('/api/conversations', {
          method: 'POST',
          body: {
            // Send full user message for AI title generation
            userFirstMessage: userContent,
            messages: [],
          },
        });
        currentConversationId.value = (created as { id: number }).id;
      } catch {
        // Non-fatal: continue without persistence
      }
    }

    abortController = new AbortController();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          })),
          modelId,
        }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) throw new Error('Network error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // toTextStreamResponse() sends plain text chunks directly
        const text = decoder.decode(value, { stream: true });
        assistantMsg.content += text;

        // Strip tasks block for live display
        assistantMsg.displayContent = assistantMsg.content
          .replace(/```(?:tasks|json)[\s\S]*?```/g, '')
          .trim();
        // trigger reactivity
        messages.value = [...messages.value];
      }

      // Parse tasks from completed reply and attach to message
      assistantMsg.tasks = parseTasks(assistantMsg.content);
      assistantMsg.displayContent = assistantMsg.content
        .replace(/```(?:tasks|json)[\s\S]*?```/g, '')
        .trim();
      messages.value = [...messages.value];

      // Persist conversation to DB after each exchange
      if (currentConversationId.value) {
        await $fetch(`/api/conversations/${currentConversationId.value}`, {
          method: 'PATCH',
          body: { messages: messages.value },
        }).catch(() => {});
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') throw e;
    } finally {
      abortController = null;
      streaming.value = false;
    }
  }

  function stop() {
    abortController?.abort();
    streaming.value = false;
  }

  function clear() {
    messages.value = [];
    currentConversationId.value = null;
  }

  /** Load a saved conversation from DB */
  async function loadConversation(id: number) {
    const conv = await $fetch(`/api/conversations/${id}`);
    const data = conv as { id: number; messages: Message[] };
    messages.value = data.messages ?? [];
    currentConversationId.value = id;
  }

  return {
    messages,
    streaming,
    currentConversationId,
    pendingTasks,
    send,
    stop,
    clear,
    loadConversation,
  };
});
