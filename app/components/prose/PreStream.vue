<script setup lang="ts">
import { ShikiCachedRenderer } from 'shiki-stream/vue';

const colorMode = useColorMode();
const highlighter = await useHighlighter();

const props = defineProps<{
  code: string;
  language: string;
  class?: string;
  meta?: string;
}>();

const trimmedCode = computed(() => props.code.trim().replace(/`+$/, ''));

const lang = computed(() => {
  switch (props.language) {
    case 'javascript':
      return 'js';
    case 'typescript':
      return 'ts';
    case 'vue':
      return 'vue';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    default:
      return props.language;
  }
});

const cacheKey = computed(
  () => `${lang.value}-${colorMode.value}-${trimmedCode.value.length}`,
);
</script>

<template>
  <ProsePre v-bind="props">
    <ShikiCachedRenderer
      :key="cacheKey"
      :highlighter="highlighter"
      :code="trimmedCode"
      :lang="lang"
      :theme="
        colorMode.value === 'dark'
          ? 'material-theme-palenight'
          : 'material-theme-lighter'
      "
    />
  </ProsePre>
</template>
