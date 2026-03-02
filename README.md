# Tidy AI

基于大模型的**整理助手 Web App**，帮助用户为自己的物品、空间生成个性化的整理方案，并追踪执行进度。

## 技术栈

| 层            | 技术                            |
| ------------- | ------------------------------- |
| 前端框架      | Nuxt 4                          |
| UI 组件库     | @nuxt/ui 4                      |
| 状态管理      | Pinia                           |
| AI 接口       | Vercel AI SDK + OpenAI 兼容格式 |
| Markdown 渲染 | @nuxtjs/mdc + Shiki 代码高亮    |
| 动画          | motion-v                        |
| 数据库        | LibSQL（SQLite） + Drizzle ORM  |
| 部署          | Docker                          |

## 功能特性

- **AI 对话**：流式输出整理方案，支持 `<thinking>` 思维链折叠展示
- **任务解析**：自动从 AI 回复中提取 `tasks` 代码块，生成任务预览卡片
- **任务追踪**：按房间/分类分组，子步骤展开，重复任务自动计算下次提醒时间
- **多 Provider 支持**：可在设置页配置任意 OpenAI 兼容接口（DeepSeek、Qwen 等）
- **对话管理**：侧边栏按日期分组，支持 AI 自动生成对话标题
- **实时代码高亮**：Shiki 流式语法高亮
- **快捷键**：`C` 新建对话，`Esc` 关闭侧边栏
- **深色/浅色模式**切换

## 本地开发

### 环境要求

- Node.js 22+
- pnpm 10+

### 安装依赖

```bash
pnpm install
```

### 环境变量

复制 `.env.example` 并填写：

```bash
cp .env.example .env
```

```env
# 数据库路径（默认 ./data/tidy.db）
DATATASE_URL=file:./data/tidy.db
```

AI Provider 在应用内的「设置」页面配置，支持运行时切换。

### 数据库初始化

```bash
# 生成 migration 文件（schema 变更后执行）
pnpm db:generate

# 应用 migration（服务端启动时会自动执行）
pnpm db:migrate
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000`。

### 类型检查 / Lint

```bash
pnpm typecheck
pnpm lint
pnpm lint:fix
```

## 生产构建

```bash
pnpm build
pnpm preview
```

## Docker 部署

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

数据持久化目录挂载在 `./data`，包含 SQLite 数据库文件。
