# Tidy AI - 改善执行计划

> 基于 IMPROVEMENTS.md 的系统优化，按优先级分批执行（认证系统除外）。

## 执行进度

| #   | 项目                                                                   | 状态      | 分类        |
| --- | ---------------------------------------------------------------------- | --------- | ----------- |
| 4   | 迁移到 Vercel AI SDK（server: streamText, client: data stream parser） | ✅ 已完成 | 🟡 高优先级 |
| 5   | Dashboard 布局：侧边栏 + useConversations 分组                         | ✅ 已完成 | 🟡 高优先级 |
| 6   | UChatMessages + 自定义 slot（任务卡片）                                | ✅ 已完成 | 🟡 高优先级 |
| 7   | Shiki Stream 实时代码高亮                                              | ✅ 已完成 | 🟠 中优先级 |
| 8   | Reasoning 思维链组件                                                   | ✅ 已完成 | 🟠 中优先级 |
| 10  | 颜色模式切换按钮                                                       | ✅ 已完成 | 🟠 中优先级 |
| 11  | 键盘快捷键（c = 新建对话，esc = 关闭侧边栏）                           | ✅ 已完成 | 🟠 中优先级 |
| 13  | 模型选择通过 Cookie 持久化                                             | ✅ 已完成 | 🔵 低优先级 |
| 14  | 对话删除确认 Modal                                                     | ✅ 已完成 | 🔵 低优先级 |
| 15  | 对话标题 AI 自动生成                                                   | ✅ 已完成 | 🔵 低优先级 |

## 技术方案

### #4 AI SDK 迁移

**Server**: 将 `chat.post.ts` 改为使用 `streamText` + `toDataStreamResponse()`。
使用 `createOpenAICompatible` 创建 provider，保留系统提示词和 DB 模型查找逻辑。

**Client**: 保留 Pinia store 架构，更新 SSE 解析器以处理 AI SDK data stream 格式：

- 旧格式：`data: text`
- 新格式：`0:"text"` (JSON-encoded text chunk)

### #5 Dashboard 布局

使用 `UDashboardGroup` + `UDashboardSidebar` 替换当前 header + USlideover 方案。
新增 `useConversations` composable，按「今天/昨天/本周/本月/更早」日期分组。

### #7 Shiki Stream

新增 `app/composables/useHighlighter.ts` 和 `app/components/prose/PreStream.vue`，
在 `MDCCached` 的 `components` prop 中注入 `{ pre: PreStream }`。

### #8 Reasoning

新增 `app/components/Reasoning.vue`，检测 AI 响应中的 `<thinking>` 标签，
使用 `UCollapsible` 展示，流式时显示「思考中…」。

### #13 Cookie 持久化

将 `providersStore.selectedModelId` 改为 `useCookie` 驱动。

### #14 删除确认 Modal

新增 `app/components/ModalConfirm.vue` + 在 layout 中通过 `useOverlay()` 调用。

### #15 AI 标题生成

在 `/api/conversations/index.post.ts` 中，若 `title` 缺失，用 `generateText` 生成 3-8 字标题。

---

# Tidy AI - 项目规划文档

## 项目背景

基于大模型制作一个**教人如何整理的 Web App**，帮助用户解决：

- 不知道怎么分类衣物、日常用品
- 有大量专业物品（嵌入式元器件、开发板、3D 打印耗材）
- 养宠物（猫粮、猫砂等消耗品管理）
- 不知道如何清洁厨房、厕所、房间、衣物

## 核心洞察

> 用户最缺的不是"方法论"，而是"针对我自己的东西的具体指令"

大模型的优势：能理解"我有 STM32 开发板和 ESP32 模块需要整理"，而不是只会说"把电子产品放在一起"。

## 技术栈

| 层        | 技术                                   | 备注                         |
| --------- | -------------------------------------- | ---------------------------- |
| 前端框架  | **Nuxt 4**                             |                              |
| UI 组件库 | **@nuxt/ui 4**                         |                              |
| 状态管理  | **Pinia**                              |                              |
| AI 接口   | **Vercel AI SDK + OpenAI 兼容格式**    | `baseURL` 可配置，不锁定模型 |
| MD 渲染   | **@nuxtjs/mdc + Shiki + shiki-stream** | 流式代码高亮                 |
| 动画      | **motion-v**                           |                              |
| 数据库    | **LibSQL（SQLite）+ Drizzle ORM**      | 轻量，适合家庭服务器         |
| 部署      | **Docker**                             |                              |

## 项目目录规划

```
tidy-ai/
├── .vscode/
│   └── mcp.json                  # Nuxt + Nuxt UI MCP Server 配置
├── server/
│   ├── api/
│   │   ├── chat.post.ts          # AI 对话接口（流式输出，Vercel AI SDK）
│   │   ├── conversations/        # 对话 CRUD（含 AI 自动生成标题）
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [conversationId].get.ts
│   │   │   ├── [conversationId].patch.ts
│   │   │   └── [conversationId].delete.ts
│   │   ├── providers/            # AI Provider 管理（含模型列表拉取）
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [providerId].patch.ts
│   │   │   ├── [providerId].delete.ts
│   │   │   └── [providerId]/fetch-models.post.ts
│   │   ├── models/               # 模型 CRUD
│   │   │   ├── index.get.ts
│   │   │   └── [modelId].patch.ts
│   │   ├── rooms/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   └── [roomId].delete.ts
│   │   └── tasks/
│   │       ├── index.get.ts      # 支持 roomId / dueToday 过滤
│   │       ├── index.post.ts     # 含房间自动 upsert
│   │       └── [taskId].patch.ts # 完成时自动计算 nextDueAt
│   ├── db/
│   │   ├── schema.ts             # Drizzle 表结构
│   │   ├── index.ts              # LibSQL 连接
│   │   └── migrations/           # 自动迁移文件
│   ├── plugins/
│   │   └── migrations.ts         # 服务端启动时自动执行迁移
│   └── utils/
│       └── ai.ts                 # AI provider 工厂 + System Prompt
├── app/
│   ├── stores/
│   │   ├── chat.ts               # 对话状态 + AI 流 + 任务解析
│   │   ├── conversations.ts      # 对话列表状态
│   │   ├── providers.ts          # Provider / 模型选择（Cookie 持久化）
│   │   ├── tasks.ts              # 任务清单状态
│   │   └── rooms.ts              # 房间/场景状态
│   ├── composables/
│   │   ├── useConversations.ts   # 按日期分组对话列表
│   │   └── useHighlighter.ts     # Shiki 高亮器单例
│   ├── pages/
│   │   ├── index.vue             # 对话页（主页）
│   │   ├── tasks.vue             # 任务追踪页
│   │   └── settings.vue          # Provider / 模型设置页
│   ├── layouts/
│   │   └── default.vue           # Dashboard 布局（侧边栏 + 快捷键）
│   └── components/
│       ├── ModalConfirm.vue      # 通用确认 Modal
│       ├── Reasoning.vue         # 思维链折叠组件
│       ├── TaskItem.vue          # 任务卡片（含子步骤）
│       ├── TaskSuggestionCard.vue # AI 建议任务预览卡片
│       └── prose/
│           └── PreStream.vue     # Shiki 流式代码高亮块
├── shared/
│   └── types/
│       └── db.ts                 # 共享类型（Provider、Model 等）
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
└── PLAN.md
```

## MVP 核心流程

````
用户在对话框描述自己的物品/空间（可指定"厨房"、"工具台"等场景）
    ↓
Server API 调用 AI，流式返回整理方案
    ↓
AI 在回复末尾输出 ```tasks JSON（含 room、steps、recurrenceInterval）
    ↓
前端解析任务列表，展示任务预览卡片（含子步骤、周期说明）
    ↓
用户确认 → 一键保存：rooms 自动 upsert、任务批量写入 SQLite
    ↓
任务页展示进度，可按房间/分类/今日待办切换视图
    ↓
勾选完成 → 重复任务自动计算下次 nextDueAt，形成整理节奏
````

## 功能模块

### 1. 对话页（主页）

- 用户输入描述（文字）
- AI 流式输出整理方案
- 方案末尾自动解析 `\`\`\`tasks` 块，生成任务预览列表
- 一键将任务（含房间、子步骤、周期）批量保存到待办

### 2. 任务追踪页

- 展示所有整理任务，支持**按房间**或**按分类**分组
- 展开任务查看子步骤，逐步勾选
- 勾选完成显示进度；重复任务完成后自动计算 `nextDueAt`
- 支持"今日待办"视图（过滤 `nextDueAt ≤ 今天` 的重复任务）

### 3. 房间 / 场景管理

- 用户可手动创建房间（厨房、卧室、工具台等）
- AI 对话中提到的场景名称会自动 upsert 到 rooms 表
- 任务页可按房间切换视图

### 4. AI 提示词设计重点

- 明确要求输出 `room`（场景）、`steps`（子步骤数组）、`recurrenceInterval`（天数）
- 针对特殊物品类别（电子元器件、3D耗材）给出专业分类方案
- 清洁任务包含：分区步骤 + 所需清洁剂 + 建议频率（映射到 recurrenceInterval）

## 数据库 Schema

```ts
// server/db/schema.ts

rooms: {
  (id, name, description, createdAt, updatedAt);
}

tasks: {
  (id,
    roomId, // FK → rooms.id（ON DELETE SET NULL）
    title, // 任务标题
    description, // 详细说明
    category, // clothing | electronics | cleaning | supplies | other
    status, // todo | in_progress | done
    steps, // JSON string[] 子步骤列表
    recurrenceInterval, // 整数（天），null 表示一次性任务
    lastDoneAt, // 上次完成时间
    nextDueAt, // 下次建议执行时间 = lastDoneAt + recurrenceInterval days
    createdAt,
    updatedAt);
}

conversations: {
  (id, messages(JSON), createdAt);
}
```

## AI 任务输出格式

````jsonc
// 包裹在 ```tasks 代码块中
[
  {
    "title": "清洁厨房灶台",
    "description": "使用油污清洁剂擦拭灶台，重点处理油污积累区域",
    "category": "cleaning",
    "room": "厨房",
    "steps": [
      "清空灶台物品",
      "喷涂清洁剂静置 3 分钟",
      "用百洁布擦拭",
      "清水擦净",
      "归位物品",
    ],
    "recurrenceInterval": 7,
  },
]
````

## 环境变量

```env
# .env
# 数据库路径（LibSQL/SQLite）
DATABASE_URL=file:./data/tidy.db
```

> AI Provider（baseURL、API Key、模型）均在应用「设置」页面动态配置，持久化到数据库，无需通过环境变量注入。

## MCP 配置（开发时使用）

创建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "nuxt": {
      "type": "http",
      "url": "https://nuxt.com/mcp"
    },
    "nuxt-ui": {
      "type": "http",
      "url": "https://ui.nuxt.com/mcp"
    }
  }
}
```

## 下一步执行计划

- [x] 1. 安装项目依赖（nuxt-ui、drizzle-orm、better-sqlite3、openai）
- [x] 2. 配置 `.vscode/mcp.json`
- [x] 3. 配置 `nuxt.config.ts`（nuxt-ui 模块、运行时配置、pinia、imports.dirs）
- [x] 4. 创建 DB schema（`server/db/schema.ts`）+ DB 连接（`server/db/index.ts`）+ `drizzle.config.ts`
- [x] 5. 实现 `server/api/chat.post.ts`（流式 AI 对话接口）
- [x] 6. 实现 `server/api/tasks/` CRUD 接口（GET / POST / PATCH）
- [x] 7. 实现 Pinia stores（`app/stores/chat.ts`、`app/stores/tasks.ts`）
- [x] 8. Schema 升级：增加 `rooms` 表，tasks 表扩展 `steps`、`recurrenceInterval`、`lastDoneAt`、`nextDueAt`、`roomId` 字段
- [x] 9. 实现 `server/api/rooms/` CRUD 接口（GET / POST / DELETE），tasks POST 自动 upsert 房间
- [x] 10. 任务 PATCH 完成时自动计算 `nextDueAt`；GET 支持 `roomId` / `dueToday` 过滤
- [x] 11. 实现 `app/stores/rooms.ts`，tasks store 扩展 `byRoom` computed 和新字段
- [x] 12. System Prompt 更新：AI 输出包含 `room`、`steps`、`recurrenceInterval`
- [x] 13. 生成 DB migration（`0001_slim_the_santerians.sql`）
- [x] 14. 实现对话页 `app/pages/index.vue`（含任务预览与一键保存）
- [x] 15. 实现任务追踪页 `app/pages/tasks.vue`（按房间/分类分组，子步骤展开，今日待办视图）
- [x] 16. 实现房间管理入口（`/tasks` 页内 Modal 弹窗）
- [x] 17. Docker 部署配置（`Dockerfile` + `docker-compose.yml`）
