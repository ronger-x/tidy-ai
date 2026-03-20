/**
 * Shared DB type definitions (app + server accessible)
 * Manually mirrored from server/db/schema.ts to avoid cross-boundary imports
 */

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
}

export interface Provider {
  id: number;
  userId: number | null;
  name: string;
  baseUrl: string;
  /** apiKey is redacted on the client (returned as empty string) */
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Model {
  id: number;
  providerId: number;
  modelId: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskCategory =
  | 'clothing'
  | 'electronics'
  | 'cleaning'
  | 'supplies'
  | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Room {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  roomId: number | null;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  steps: string[];
  recurrenceInterval: number | null;
  lastDoneAt: Date | null;
  nextDueAt: Date | null;
  /** AI 生成的任务唯一标识，用于跨会话去重 */
  sourceKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory =
  | 'cleaner'
  | 'tool'
  | 'storage'
  | 'consumable'
  | 'other';
export type ProductStatus = 'recommended' | 'bookmarked' | 'purchased';

export interface Product {
  id: number;
  sourceKey: string | null;
  name: string;
  category: ProductCategory;
  description: string;
  brand: string;
  priceRange: string;
  purchaseUrl: string;
  imageUrl: string;
  rating: number | null;
  status: ProductStatus;
  metadata: Record<string, unknown>;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskProduct {
  id: number;
  taskId: number;
  productId: number;
  createdAt: Date;
}

/** AI 生成的产品推荐（解析后的前端结构） */
export interface ParsedProduct {
  key: string;
  name: string;
  category: ProductCategory;
  description: string;
  brand?: string;
  priceRange?: string;
  reason?: string;
}
