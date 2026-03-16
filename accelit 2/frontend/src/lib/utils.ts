// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx';
import { format, isPast, isToday } from 'date-fns';
import type { TaskType, AssetType } from '@/types';

// Tailwind className helper
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date helpers
export function formatDate(iso: string): string {
  return format(new Date(iso), 'MMM d, yyyy');
}

export function isDelayed(dueDate: string, status: string): boolean {
  if (status === 'done') return false;
  const d = new Date(dueDate);
  return isPast(d) && !isToday(d);
}

// Task type → display label + colour classes
export const TASK_TYPE_META: Record<TaskType, { label: string; bg: string; text: string }> = {
  creative_video: { label: 'Video',    bg: 'bg-purple-50',  text: 'text-purple-700' },
  creative_image: { label: 'Image',    bg: 'bg-blue-50',    text: 'text-blue-700'   },
  landing_page:   { label: 'Landing',  bg: 'bg-pink-50',    text: 'text-pink-700'   },
  research:       { label: 'Research', bg: 'bg-green-50',   text: 'text-green-700'  },
  other:          { label: 'Other',    bg: 'bg-amber-50',   text: 'text-amber-700'  },
};

// Asset type icon
export const ASSET_TYPE_ICON: Record<AssetType, string> = {
  creative_video: '🎬',
  creative_image: '🖼️',
  landing_page:   '🌐',
};

// Column avatar colours for Kanban
export const COLUMN_COLORS: Record<string, string> = {
  Saida:   'bg-pink-400',
  Oussama: 'bg-purple-500',
  Sana:    'bg-cyan-500',
  Rida:    'bg-amber-400',
  Done:    'bg-emerald-500',
};

// Types that require an asset link before a task can be completed
export const ASSET_REQUIRED_TYPES: TaskType[] = [
  'creative_video',
  'creative_image',
  'landing_page',
];

export function requiresAssetLink(type: TaskType): boolean {
  return ASSET_REQUIRED_TYPES.includes(type);
}
