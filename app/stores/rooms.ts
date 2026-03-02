import { defineStore } from "pinia";
import type { Room } from "#shared/types/db";

export const useRoomsStore = defineStore("rooms", () => {
  const rooms = ref<Room[]>([]);
  const loading = ref(false);

  async function fetch() {
    loading.value = true;
    try {
      rooms.value = await $fetch<Room[]>("/api/rooms");
    } finally {
      loading.value = false;
    }
  }

  async function create(name: string, description = "") {
    const room = await $fetch<Room>("/api/rooms", {
      method: "POST",
      body: { name, description },
    });
    rooms.value = [...rooms.value, room];
    return room;
  }

  async function remove(id: number) {
    await $fetch(`/api/rooms/${id}`, { method: "DELETE" });
    rooms.value = rooms.value.filter((r) => r.id !== id);
  }

  /** 根据名称查找房间（用于对话导出任务时的名称匹配） */
  function findByName(name: string) {
    return rooms.value.find((r) => r.name.toLowerCase() === name.toLowerCase());
  }

  return { rooms, loading, fetch, create, remove, findByName };
});
