<script setup lang="ts">
const { text, isStreaming = false } = defineProps<{
  text: string;
  isStreaming?: boolean;
}>();

const open = ref(false);

watch(
  () => isStreaming,
  (val) => {
    open.value = val;
  },
  { immediate: true },
);

function cleanMarkdown(t: string): string {
  return t
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#+\s+/gm, '');
}
</script>

<template>
  <UCollapsible v-model:open="open" class="my-4 flex flex-col gap-1">
    <UButton
      class="group p-0"
      color="neutral"
      variant="link"
      :trailing-icon="text.length > 0 ? 'i-lucide-chevron-down' : undefined"
      :ui="{
        trailingIcon:
          text.length > 0
            ? 'group-data-[state=open]:rotate-180 transition-transform duration-200'
            : 'hidden',
      }"
      :label="isStreaming ? '思考中…' : '查看思考过程'"
    />
    <template #content>
      <div class="flex flex-col gap-0.5 pl-1">
        <span
          v-for="(line, i) in cleanMarkdown(text).split('\n').filter(Boolean)"
          :key="i"
          class="text-muted text-xs font-normal whitespace-pre-wrap"
        >
          {{ line }}
        </span>
      </div>
    </template>
  </UCollapsible>
</template>
