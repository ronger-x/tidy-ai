# Tidy AI — 改善建议（基于 chat 模板分析）

> 基于对 `templates/chat` 模板项目的系统分析，本文档整理了当前项目可优化的方向，按优先级排列。

---

## 🔴 已修复（本次修改）

### 1. MDC Markdown 渲染失效

**问题**：`@nuxtjs/mdc` 模块缺少 `shikiEngine` 配置，导致 `MDCCached` 无法正常初始化语法高亮引擎，渲染结果退化为纯文本。

**修复**：

```ts
// nuxt.config.ts
mdc: {
  headings: { anchorLinks: false },
  highlight: { shikiEngine: 'javascript' },
}
```

### 2. 任务块解析脆弱

**问题**：`parseTasks` 和 `stripTasksBlock` 只识别 ` ```tasks ` 代码块，但 AI 有时会输出 ` ```json ` 或行内 JSON，导致任务卡片无法解析且 JSON 渗入正文显示。

**修复**：

- 解析器新增fallback：先匹配 ` ```tasks `，再 ` ```json `，再行末裸 JSON 数组
- Strip 正则升级为 `/```(?:tasks|json)[\s\S]*?```/g`

### 3. AI 提示词结构不清晰

**问题**：原提示词对正文和 tasks 块的分离不够强调，模型容易将 JSON 字段内联在正文段落中。

**修复**：重写为两段式结构，明确约束 "正文中绝对不能出现 JSON"，并在提示词中提供完整示例。

---

## 🟡 高优先级改善

### 4. 迁移到 Vercel AI SDK（`ai` + `@ai-sdk/vue`）

**现状**：当前使用手写 `fetch` + SSE 解析实现流式输出，约 60 行代码，缺乏错误边界、abort 重试、reasoning 支持。

**模板做法**：

```ts
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';

const chat = new Chat({
  id: data.value.id,
  messages: data.value.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${id}`,
    body: { model },
  }),
});
```

**收益**：

- 开箱即用的 `status`（idle / loading / streaming / error）
- 支持 `reasoning` 消息块（用于 Gemini/Claude 的思考过程）
- 内置 abort / stop / regenerate
- 与 Nuxt UI `UChatMessages` + `UChatPromptSubmit` 完美对接（status 直接绑定）

**服务端改动**：将 `/api/chat.post.ts` 迁移为使用 `streamText` from `ai`：

```ts
import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const result = streamText({ model, messages, system: SYSTEM_PROMPT });
return result.toDataStreamResponse();
```

---

### 5. Dashboard 布局：侧边栏 + 对话历史

**现状**：单页无侧边栏，对话历史只存在内存中，刷新即丢失。

**模板做法**：使用 `UDashboardGroup` + `UDashboardSidebar` 布局，侧边栏按日期分组显示历史对话。

```
今天
  └─ 猫粮猫砂整理方案
昨天
  └─ 厨房调料收纳
上周
  └─ 工具台 ESP32 分类
```

**实现要点**：

```vue
<!-- app/layouts/default.vue -->
<UDashboardGroup>
  <UDashboardSidebar collapsible resizable>
    <!-- 对话历史列表 + 新建按钮 -->
  </UDashboardSidebar>
  <slot />
</UDashboardGroup>
```

```ts
// app/composables/useConversations.ts — 按日期分组（参考模板 useChats.ts）
import { isToday, isYesterday, subMonths } from 'date-fns'
export function useConversations(conversations: Ref<UIConversation[]>) { ... }
```

**相关 DB 改动**：`conversations` 表已有，补充 `title` 自动生成和 `GET /api/conversations` 分页。

---

### 6. 使用 `UChatMessages` 替换手写消息列表

**现状**：手写 `v-for` 渲染消息，没有 copy 按钮、没有自动滚动到底部（需要手动 `scrollIntoView`）。

**模板做法**：

```vue
<UChatMessages
  should-auto-scroll
  :messages="chat.messages"
  :status="chat.status"
  :assistant="{
    actions: [{ label: 'Copy', icon: 'i-lucide-copy', onClick: copy }],
  }"
  :spacing-offset="160"
>
  <template #content="{ message }">
    <MDCCached :value="part.text" ... />
  </template>
</UChatMessages>
```

**收益**：自动滚动、消息 actions（复制/重新生成）、统一的 loading 态。

---

## 🟠 中优先级改善

### 7. 实时代码块渲染（Shiki Stream）

**现状**：流式输出时全部显示纯文本，代码块只在完成后才渲染。

**模板做法**：使用 `shiki-stream` 在流式阶段渐进式高亮：

```vue
<!-- app/components/prose/PreStream.vue -->
<script setup>
import { ShikiCachedRenderer } from 'shiki-stream/vue';
const highlighter = await useHighlighter();
</script>
<template>
  <ProsePre v-bind="props">
    <ShikiCachedRenderer :highlighter :code :lang :theme />
  </ProsePre>
</template>
```

将 `PreStream` 注入 MDCCached 的 `components` prop：

```vue
<MDCCached :components="{ pre: ProseStreamPre }" ... />
```

**依赖**：需要安装 `shiki` + `shiki-stream`：

```bash
pnpm add shiki shiki-stream
```

---

### 8. 思维链展示（Reasoning）

**适用模型**：Gemini 2.5 Pro / Claude 3.7 Sonnet 等支持 `thinking` 的模型。

**现状**：不支持 reasoning 消息，即使模型输出了思考过程也会被忽略。

**模板做法**：

```vue
<Reasoning
  v-if="part.type === 'reasoning'"
  :text="part.text"
  :is-streaming="part.state !== 'done'"
/>
```

`Reasoning.vue` 使用 `UCollapsible` 展示，标题显示"思考中..."或"查看思考过程"。

---

### 9. 拖拽上传 + 文件预览

**现状**：图片上传通过 `<input type="file">` 实现，以 base64 存储在内存中，无进度反馈。

**模板做法**：

- `DragDropOverlay.vue`：检测拖拽状态，展示全屏放置区
- `FileAvatar.vue`：显示文件名/类型图标/预览图，支持 `status`（idle/uploading/done/error）
- `FileUploadButton.vue`：触发 file picker 的按钮
- `/api/upload/[chatId].put.ts`：将文件存储到 Blob Storage，返回 URL

**收益**：不再发送 base64（可能超过模型上下文限制），改为发送 URL 引用。

---

### 10. 颜色模式切换

**现状**：布局中没有颜色模式切换入口。

**修复**（5行代码）：

```vue
<!-- app/layouts/default.vue -->
<UColorModeButton />
```

---

### 11. 键盘快捷键

**现状**：无快捷键支持。

**模板做法**：使用 `defineShortcuts`：

```ts
defineShortcuts({
  c: () => navigateTo('/'), // 新建对话
  escape: () => (sidebarOpen.value = false),
});
```

---

## 🔵 低优先级 / 长期规划

### 12. 认证系统

**模板做法**：使用 `nuxt-auth-utils` + GitHub OAuth：

```bash
pnpm add nuxt-auth-utils
```

对于家庭服务器场景，可以考虑：

- 简单密码保护（单用户）
- 本地 `nuxt-auth-utils` session

---

### 13. 模型选配通过 Cookie 持久化

**现状**：选中模型存在 `providersStore`（内存），刷新重置。

**模板做法**：

```ts
const model = useCookie<string>('model', { default: () => 'gpt-4o' });
```

---

### 14. 对话删除确认 Modal

**现状**：清空对话没有二次确认。

**模板做法**：`ModalConfirm.vue` + `useOverlay()`：

```ts
const overlay = useOverlay();
const deleteModal = overlay.create(LazyModalConfirm, {
  props: { title: '删除对话', description: '此操作不可撤销' },
});
const result = await deleteModal.open().result;
if (result) await deleteConversation(id);
```

---

### 15. 对话标题自动生成

**现状**：标题截取自用户第一条消息的前30字。

**改善**：让 AI 生成简短标题（3-8字）。使用 `generateText` 并通过 `data` stream 推送：

```ts
// 流式输出时同步触发（不阻塞主流）
generateText({
  model,
  prompt: `为以下对话生成一个3-8字的简短标题：\n${userMessage}`,
}).then(({ text }) => updateConversationTitle(id, text));
```

---

## 参考文件映射

| 改善项         | 模板参考文件                                        |
| -------------- | --------------------------------------------------- |
| AI SDK 迁移    | `templates/chat/app/pages/chat/[id].vue`            |
| Dashboard 布局 | `templates/chat/app/layouts/default.vue`            |
| 对话分组       | `templates/chat/app/composables/useChats.ts`        |
| Shiki Stream   | `templates/chat/app/components/prose/PreStream.vue` |
| Reasoning      | `templates/chat/app/components/Reasoning.vue`       |
| 文件上传       | `templates/chat/app/composables/useFileUpload.ts`   |
| 文件预览       | `templates/chat/app/components/FileAvatar.vue`      |
| 拖拽上传       | `templates/chat/app/components/DragDropOverlay.vue` |
| 模型选择       | `templates/chat/app/components/ModelSelect.vue`     |
| 删除确认       | `templates/chat/app/components/ModalConfirm.vue`    |
