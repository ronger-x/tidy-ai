import { defineStore } from 'pinia';

export interface ConversationSummary {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useConversationsStore = defineStore('conversations', () => {
  const list = ref<ConversationSummary[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      list.value = await $fetch<ConversationSummary[]>('/api/conversations');
    } finally {
      loading.value = false;
    }
  }

  async function deleteOne(id: number) {
    await $fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    list.value = list.value.filter((c) => c.id !== id);
  }

  function refresh() {
    return fetchAll();
  }

  return { list, loading, fetchAll, deleteOne, refresh };
});
