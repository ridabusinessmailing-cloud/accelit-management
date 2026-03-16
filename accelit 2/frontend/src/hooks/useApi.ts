// src/hooks/useApi.ts
// Lightweight fetch hooks using React state — no external library needed.
// Each hook handles loading, error and data states consistently.

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  DashboardStats, Product, Task, MediaAsset,
} from '@/types';

// ── Generic hook factory ──────────────────────────────────────────────

function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<T>(url);
      setData(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Specific hooks ────────────────────────────────────────────────────

export function useDashboard() {
  return useFetch<DashboardStats>('/dashboard');
}

export function useProducts() {
  return useFetch<Product[]>('/products');
}

export function useProduct(id: string) {
  return useFetch<Product>(`/products/${id}`);
}

export function useProductAssets(productId: string) {
  return useFetch<MediaAsset[]>(`/products/${productId}/assets`);
}

export function useTasks(params?: {
  assignedTo?: string;
  productId?:  string;
  date?:       string;
}) {
  const query = params
    ? '?' + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v != null) as [string, string][]
        )
      ).toString()
    : '';
  return useFetch<Task[]>(`/tasks${query}`, [query]);
}

export function useAssets(productId?: string) {
  const url = productId ? `/assets?productId=${productId}` : '/assets';
  return useFetch<MediaAsset[]>(url);
}

// ── Users ─────────────────────────────────────────────────────────────
export interface UserOption {
  id:   string;
  name: string;
  role: 'admin' | 'team';
}

export function useUsers() {
  return useFetch<UserOption[]>('/users');
}
