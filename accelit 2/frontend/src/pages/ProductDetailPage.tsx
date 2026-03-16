// src/pages/ProductDetailPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { useProduct, useProductAssets, useTasks } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Card, Button, Spinner, Modal, Input, Select,
  TaskTypeBadge, EmptyState,
} from '@/components/ui';
import { formatDate, isDelayed, ASSET_TYPE_ICON, cn } from '@/lib/utils';
import type { AssetType } from '@/types';

type Tab = 'info' | 'assets' | 'tasks';

export function ProductDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { isAdmin } = useAuth();

  const { data: product, loading: pLoading } = useProduct(id!);
  const { data: assets,  loading: aLoading, refetch: refetchAssets } = useProductAssets(id!);
  const { data: tasks,   loading: tLoading } = useTasks({ productId: id! });

  const [tab, setTab]             = useState<Tab>('info');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', type: 'creative_video' as AssetType, link: '' });
  const [saving, setSaving]       = useState(false);

  async function handleUploadAsset() {
    setSaving(true);
    try {
      await api.post('/assets', { ...assetForm, productId: id });
      setShowAssetModal(false);
      setAssetForm({ name: '', type: 'creative_video', link: '' });
      refetchAssets();
    } finally {
      setSaving(false);
    }
  }

  if (pLoading) return <div className="flex items-center justify-center h-64"><Spinner className="w-6 h-6" /></div>;
  if (!product) return <div className="p-8 text-sm text-gray-500">Product not found.</div>;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'info',   label: 'Product Info' },
    { id: 'assets', label: `Assets (${assets?.length ?? 0})` },
    { id: 'tasks',  label: `Tasks (${tasks?.length ?? 0})` },
  ];

  return (
    <div className="p-7 max-w-5xl">

      {/* Back + Header */}
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-600 transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Products
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>
        </div>
        <Button onClick={() => setShowAssetModal(true)}>
          <Plus size={14} /> Upload Asset
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-purple-100 mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Info tab ──────────────────────────────────────────── */}
      {tab === 'info' && (
        <Card>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: 'Ad Accounts',    value: product.adAccounts    ?? '—' },
              { label: 'Monthly Budget', value: product.monthlyBudget ?? '—' },
              { label: 'Status',         value: product.status },
              { label: 'Created By',     value: product.creator?.name ?? '—' },
              { label: 'Created',        value: formatDate(product.createdAt) },
              { label: 'Total Assets',   value: String(assets?.length ?? 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Assets tab ────────────────────────────────────────── */}
      {tab === 'assets' && (
        <Card className="p-0 overflow-hidden">
          {aLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !assets?.length ? (
            <EmptyState message="No assets yet. Complete tasks or upload manually." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-50 bg-[#F4F3FF]">
                  {['Asset Name', 'Type', 'Created By', 'Date', 'Source Task', 'Link'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-[#F4F3FF] transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      <span className="mr-2">{ASSET_TYPE_ICON[asset.type]}</span>
                      {asset.name}
                    </td>
                    <td className="px-5 py-3">
                      <TaskTypeBadge type={asset.type} />
                    </td>
                    <td className="px-5 py-3 text-gray-600">{asset.creator?.name}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(asset.createdAt)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {asset.sourceTask?.title ?? <span className="text-gray-300">Manual upload</span>}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={asset.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 font-medium"
                      >
                        Open <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Tasks tab ─────────────────────────────────────────── */}
      {tab === 'tasks' && (
        <Card className="p-0 overflow-hidden">
          {tLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !tasks?.length ? (
            <EmptyState message="No tasks linked to this product." />
          ) : (
            <div className="divide-y divide-purple-50">
              {tasks.map(task => {
                const delayed = isDelayed(task.dueDate, task.status);
                return (
                  <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F4F3FF]">
                    <span className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      task.status === 'done' ? 'bg-emerald-400'
                        : delayed ? 'bg-red-400' : 'bg-purple-400'
                    )} />
                    <span className="flex-1 text-sm text-gray-800">{task.title}</span>
                    <TaskTypeBadge type={task.type} />
                    <span className="text-xs text-gray-400">{task.assignee?.name}</span>
                    <span className={cn('text-xs', delayed ? 'text-red-500 font-medium' : 'text-gray-400')}>
                      {delayed && '⚑ '}{task.dueDate}
                    </span>
                    {task.status === 'done' && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Upload asset modal */}
      <Modal open={showAssetModal} onClose={() => setShowAssetModal(false)} title="Upload Asset">
        <div className="space-y-4">
          <Input
            label="Asset Name *"
            value={assetForm.name}
            onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. 10 UGC Videos — Round 2"
          />
          <Select
            label="Asset Type *"
            value={assetForm.type}
            onChange={e => setAssetForm(f => ({ ...f, type: e.target.value as AssetType }))}
          >
            <option value="creative_video">Creative Video</option>
            <option value="creative_image">Creative Image</option>
            <option value="landing_page">Landing Page</option>
          </Select>
          <Input
            label="Google Drive Link *"
            type="url"
            value={assetForm.link}
            onChange={e => setAssetForm(f => ({ ...f, link: e.target.value }))}
            placeholder="https://drive.google.com/…"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAssetModal(false)}>Cancel</Button>
            <Button
              onClick={handleUploadAsset}
              loading={saving}
              disabled={!assetForm.name.trim() || !assetForm.link.trim()}
            >
              Upload Asset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
