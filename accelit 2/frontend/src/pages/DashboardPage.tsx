// src/pages/DashboardPage.tsx

import { useNavigate } from 'react-router-dom';
import { Boxes, ListTodo, AlertTriangle, Image } from 'lucide-react';
import { useDashboard } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { Card, Spinner, TaskTypeBadge } from '@/components/ui';
import { formatDate, ASSET_TYPE_ICON } from '@/lib/utils';

const WORKFLOW = ['Product', 'Tasks', 'Creatives', 'Ads Launch', 'Tracking'];

export function DashboardPage() {
  const { user }                  = useAuth();
  const { data, loading, error }  = useDashboard();
  const navigate                  = useNavigate();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-6 h-6" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-sm text-red-600">{error}</div>
  );

  const stats = data!;

  return (
    <div className="p-7 max-w-6xl">

      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <StatCard
          icon={<Boxes size={18} className="text-purple-500" />}
          label="Products"
          value={stats.totalProducts}
          sub="Active products"
          accent="border-purple-200"
          onClick={() => navigate('/products')}
        />
        <StatCard
          icon={<ListTodo size={18} className="text-blue-500" />}
          label="Active Tasks"
          value={stats.activeTasks}
          sub="Due today or upcoming"
          accent="border-blue-200"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Delayed"
          value={stats.delayedTasks}
          sub="Past due date"
          accent="border-red-200"
          valueClass={stats.delayedTasks > 0 ? 'text-red-600' : undefined}
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          icon={<Image size={18} className="text-emerald-500" />}
          label="Assets"
          value={stats.recentAssets.length}
          sub="Created recently"
          accent="border-emerald-200"
        />
      </div>

      {/* Workflow pipeline */}
      <Card className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Creative Production Workflow
        </p>
        <div className="flex items-center gap-0">
          {WORKFLOW.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold
                ${i === 1
                  ? 'bg-purple-500 text-white'
                  : 'bg-[#F4F3FF] text-gray-500 border border-purple-100'}
              `}>
                {step}
              </div>
              {i < WORKFLOW.length - 1 && (
                <span className="text-gray-300 px-1.5 text-sm">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Currently active: {stats.activeTasks} tasks across products — automation ready.
        </p>
      </Card>

      {/* Recent assets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">Recently Created Assets</p>
          <span className="text-xs text-purple-500 font-medium bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            Auto-created via Task completion
          </span>
        </div>

        {stats.recentAssets.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No assets yet</p>
        ) : (
          <div className="divide-y divide-purple-50">
            {stats.recentAssets.map(asset => (
              <div key={asset.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base flex-shrink-0">
                  {ASSET_TYPE_ICON[asset.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                  <p className="text-xs text-gray-400">
                    {asset.product?.name} · {asset.creator?.name} · {formatDate(asset.createdAt)}
                  </p>
                </div>
                <a
                  href={asset.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-500 hover:text-purple-700 font-medium whitespace-nowrap"
                >
                  Open ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Stat card sub-component ───────────────────────────────────────────
function StatCard({
  icon, label, value, sub, accent, valueClass, onClick,
}: {
  icon:        React.ReactNode;
  label:       string;
  value:       number;
  sub:         string;
  accent:      string;
  valueClass?: string;
  onClick?:    () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${accent} border-t-2 p-5 relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-bold text-gray-900 leading-none mb-1 ${valueClass ?? ''}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
