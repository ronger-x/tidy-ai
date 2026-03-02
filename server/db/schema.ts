import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * AI 供应商表
 * 每条记录代表一个 OpenAI 兼容的 API 供应商（如 OpenAI、DeepSeek、本地 Ollama 等）
 */
export const providers = sqliteTable('providers', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(), // 显示名称，例如 "DeepSeek"
  baseUrl: text().notNull(), // API base URL
  apiKey: text().notNull().default(''), // API 密钥（敏感，仅服务端读取）
  enabled: integer({ mode: 'boolean' }).notNull().default(true),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 模型表
 * 从供应商接口拉取，用户选择启用哪些模型
 */
export const models = sqliteTable('models', {
  id: integer().primaryKey({ autoIncrement: true }),
  providerId: integer()
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  /** 供应商返回的原始 model id，如 "gpt-4o"、"deepseek-chat" */
  modelId: text().notNull(),
  /** 展示名称，优先使用拉取时的 id，可手动修改 */
  name: text().notNull(),
  enabled: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

/**
 * 房间 / 场景表
 * 每个房间代表一个整理场景（如"卧室"、"工作台"、"厨房"）
 */
export const rooms = sqliteTable('rooms', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(), // 例如"卧室"、"工具台"
  description: text().notNull().default(''),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tasks = sqliteTable('tasks', {
  id: integer().primaryKey({ autoIncrement: true }),
  /** 关联的房间/场景，null 表示通用任务 */
  roomId: integer().references(() => rooms.id, { onDelete: 'set null' }),
  title: text().notNull(),
  description: text().notNull().default(''),
  category: text({
    enum: ['clothing', 'electronics', 'cleaning', 'supplies', 'other'],
  })
    .notNull()
    .default('other'),
  status: text({ enum: ['todo', 'in_progress', 'done'] })
    .notNull()
    .default('todo'),
  /**
   * 子步骤列表（JSON string[]）
   * 例如 ["清空台面", "擦拭桌面", "归位物品"]
   */
  steps: text({ mode: 'json' }).$type<string[]>().notNull().default([]),
  /**
   * 重复周期（天），null 表示一次性任务
   * 7 = 每周；30 = 每月；1 = 每天
   */
  recurrenceInterval: integer(),
  /** 上次完成时间，用于计算下次到期 */
  lastDoneAt: integer({ mode: 'timestamp' }),
  /** 下次建议执行时间（= lastDoneAt + recurrenceInterval days） */
  nextDueAt: integer({ mode: 'timestamp' }),
  /**
   * AI 生成的任务唯一标识（如 "clean_kitchen_stove"），用于跨会话去重。
   * 历史任务为 null。
   */
  sourceKey: text(),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Stored message shape inside a conversation record */
export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  displayContent?: string;
  modelId?: number;
  modelLabel?: string;
  /** Base64 data URLs for images attached to this message */
  images?: string[];
  tasks?: Array<{
    key: string;
    title: string;
    description: string;
    category: string;
    room?: string;
    steps: string[];
    recurrenceInterval?: number;
  }>;
}

export const conversations = sqliteTable('conversations', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull().default('新对话'),
  messages: text({ mode: 'json' })
    .$type<StoredMessage[]>()
    .notNull()
    .$default(() => []),
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskCategory = Task['category'];
export type TaskStatus = Task['status'];

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
