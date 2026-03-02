import { defineStore } from 'pinia';
import type { Task } from '#shared/types/db';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);

  async function fetch(
    filters: {
      status?: string;
      category?: string;
      roomId?: number;
      dueToday?: boolean;
    } = {},
  ) {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.roomId !== undefined)
        params.set('roomId', String(filters.roomId));
      if (filters.dueToday) params.set('dueToday', '1');

      const query = params.toString() ? `?${params}` : '';
      tasks.value = await $fetch<Task[]>(`/api/tasks${query}`);
    } finally {
      loading.value = false;
    }
  }

  async function saveTasks(
    items: Array<{
      key?: string;
      title: string;
      description: string;
      category: Task['category'];
      room?: string;
      steps?: string[];
      recurrenceInterval?: number;
    }>,
  ) {
    const created = await $fetch<Task[]>('/api/tasks', {
      method: 'POST',
      body: { tasks: items },
    });
    tasks.value = [...tasks.value, ...created];
    return created;
  }

  async function updateStatus(id: number, status: Task['status']) {
    const updated = await $fetch<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: { status },
    });
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx !== -1) tasks.value[idx] = updated;
  }

  const byCategory = computed(() => {
    const map = new Map<Task['category'], Task[]>();
    for (const task of tasks.value) {
      const list = map.get(task.category) ?? [];
      list.push(task);
      map.set(task.category, list);
    }
    return map;
  });

  const byRoom = computed(() => {
    const map = new Map<number | null, Task[]>();
    for (const task of tasks.value) {
      const list = map.get(task.roomId) ?? [];
      list.push(task);
      map.set(task.roomId, list);
    }
    return map;
  });

  const completedCount = computed(
    () => tasks.value.filter((t) => t.status === 'done').length,
  );

  return {
    tasks,
    loading,
    byCategory,
    byRoom,
    completedCount,
    fetch,
    saveTasks,
    updateStatus,
  };
});
