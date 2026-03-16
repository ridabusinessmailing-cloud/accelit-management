// src/components/ui/index.tsx
// Small, reusable primitives used across pages.

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';
import type { TaskType } from '@/types';
import { TASK_TYPE_META } from '@/lib/utils';

// ── Spinner ───────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-purple-500', className)} size={18} />;
}

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-purple-100 p-5', className)}>
      {children}
    </div>
  );
}

// ── Badge (task type) ─────────────────────────────────────────────────
export function TaskTypeBadge({ type }: { type: TaskType }) {
  const { label, bg, text } = TASK_TYPE_META[type];
  return (
    <span className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded', bg, text)}>
      {label}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?:    'sm' | 'md';
  loading?: boolean;
}
export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-purple-500 text-white hover:bg-purple-600 active:scale-[0.98]',
    secondary: 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100',
    danger:    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
    ghost:     'text-gray-500 hover:bg-gray-100',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ label, error, className, ...props }, ref) => (
  <label className="block">
    {label && <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>}
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm bg-[#F4F3FF] border border-purple-100 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition',
        'placeholder:text-gray-400',
        error && 'border-red-300 focus:ring-red-400',
        className
      )}
      {...props}
    />
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
));
Input.displayName = 'Input';

// ── Select ────────────────────────────────────────────────────────────
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(({ label, className, children, ...props }, ref) => (
  <label className="block">
    {label && <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>}
    <select
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm bg-[#F4F3FF] border border-purple-100 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition',
        className
      )}
      {...props}
    >
      {children}
    </select>
  </label>
));
Select.displayName = 'Select';

// ── Textarea ──────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(({ label, className, ...props }, ref) => (
  <label className="block">
    {label && <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>}
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        'w-full px-3 py-2 text-sm bg-[#F4F3FF] border border-purple-100 rounded-lg resize-y',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition',
        'placeholder:text-gray-400',
        className
      )}
      {...props}
    />
  </label>
));
Textarea.displayName = 'Textarea';

// ── Modal ─────────────────────────────────────────────────────────────
interface ModalProps {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: React.ReactNode;
  width?:   string;
}
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-[#0F0B1E]/60 flex items-center justify-center z-50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn('bg-white rounded-xl shadow-xl w-full', width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────
export function PageHeader({
  title, description, action,
}: {
  title:       string;
  description?: string;
  action?:     React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
