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
