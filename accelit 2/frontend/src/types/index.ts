// src/types/index.ts
// Shared TypeScript types — mirrors the Prisma schema and API responses.

export type UserRole = 'admin' | 'team';

export type TaskType =
  | 'creative_video'
  | 'creative_image'
  | 'landing_page'
  | 'research'
  | 'other';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskVisibility = 'team' | 'admin_only';
export type AssetType = 'creative_video' | 'creative_image' | 'landing_page';
export type ProductStatus = 'active' | 'paused' | 'archived';

// ── Entities ──────────────────────────────────────────────────────────

export interface User {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  createdAt: string;
}

export interface Product {
  id:            string;
  name:          string;
  description:   string | null;
  adAccounts:    string | null;
  monthlyBudget: string | null;
  status:        ProductStatus;
  createdBy:     string;
  creator:       Pick<User, 'id' | 'name'>;
  createdAt:     string;
  _count?: {
    tasks:  number;
    assets: number;
  };
}

export interface Task {
  id:          string;
  title:       string;
  description: string | null;
  assignedTo:  string;
  assignee:    Pick<User, 'id' | 'name' | 'role'>;
  createdBy:   string;
  creator:     Pick<User, 'id' | 'name'>;
  productId:   string | null;
  product:     Pick<Product, 'id' | 'name'> | null;
  type:        TaskType;
  status:      TaskStatus;
  assetLink:   string | null;
  visibility:  TaskVisibility;
  dueDate:     string;
  createdAt:   string;
  asset?:      Pick<MediaAsset, 'id' | 'name' | 'link'> | null;
}

export interface MediaAsset {
  id:            string;
  productId:     string;
  product:       Pick<Product, 'id' | 'name'>;
  name:          string;
  type:          AssetType;
  link:          string;
  createdBy:     string;
  creator:       Pick<User, 'id' | 'name'>;
  sourceTaskId:  string | null;
  sourceTask:    Pick<Task, 'id' | 'title'> | null;
  createdAt:     string;
}

// ── API response shapes ───────────────────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  activeTasks:   number;
  delayedTasks:  number;
  recentAssets:  MediaAsset[];
}

export interface CompleteTaskResponse {
  task:         Task;
  assetCreated: boolean;
  asset:        MediaAsset | null;
}

// ── Auth ──────────────────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  name:   string;
  role:   UserRole;
}

export interface LoginResponse {
  token: string;
  user:  Pick<User, 'id' | 'name' | 'role'>;
}

// ── Kanban ────────────────────────────────────────────────────────────

// Column IDs map directly to user names used in the board
export type KanbanColumnId = 'Saida' | 'Oussama' | 'Sana' | 'Rida' | 'Done';

export const KANBAN_COLUMNS: KanbanColumnId[] = [
  'Saida', 'Oussama', 'Sana', 'Rida', 'Done',
];

export const ASSET_REQUIRED_TYPES: TaskType[] = [
  'creative_video',
  'creative_image',
  'landing_page',
];
