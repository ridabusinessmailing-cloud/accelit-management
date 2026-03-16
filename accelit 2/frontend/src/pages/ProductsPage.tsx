// src/pages/ProductsPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  PageHeader, Button, Modal, Input, Textarea, Select,
  Card, Spinner, EmptyState,
} from '@/components/ui';

export function ProductsPage() {
  const { data: products, loading, error, refetch } = useProducts();
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', adAccounts: '', monthlyBudget: '' });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      await api.post('/products', form);
      setShowModal(false);
      setForm({ name: '', description: '', adAccounts: '', monthlyBudget: '' });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  const EMOJI: Record<string, string> = {
    'Brain Supplement': '🧠',
    'Collagen Powder':  '✨',
    'Sleep Supplement': '🌙',
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="w-6 h-6" /></div>;
  if (error)   return <div className="p-8 text-sm text-red-600">{error}</div>;

  return (
    <div className="p-7 max-w-6xl">
      <PageHeader
        title="Products"
        description="Manage ecommerce products and their creative assets"
        action={
          isAdmin && (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Product
            </Button>
          )
        }
      />

      {!products?.length ? (
        <EmptyState message="No products yet. Create one to get started." />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {products.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/products/${p.id}`)}
              className="bg-white border border-purple-100 rounded-xl p-5 cursor-pointer hover:border-purple-400 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl mb-3">{EMOJI[p.name] ?? '📦'}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{p.description}</p>
              <div className="flex gap-4 text-xs text-gray-400">
                <span><strong className="text-gray-700">{p._count?.assets ?? 0}</strong> assets</span>
                <span><strong className="text-gray-700">{p._count?.tasks  ?? 0}</strong> tasks</span>
                {p.adAccounts && (
                  <span className="ml-auto text-purple-400 font-medium">{p.adAccounts}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create product modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Product">
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Vitamin D3 Supplement"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief product description…"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ad Accounts"
              value={form.adAccounts}
              onChange={e => setForm(f => ({ ...f, adAccounts: e.target.value }))}
              placeholder="Meta, TikTok…"
            />
            <Input
              label="Monthly Budget"
              value={form.monthlyBudget}
              onChange={e => setForm(f => ({ ...f, monthlyBudget: e.target.value }))}
              placeholder="$0,000/mo"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!form.name.trim()}>
              Create Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
