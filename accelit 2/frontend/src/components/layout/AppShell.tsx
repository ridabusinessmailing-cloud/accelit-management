// src/components/layout/AppShell.tsx

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Boxes, KanbanSquare, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/',         label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products', label: 'Products',   icon: Boxes           },
  { to: '/tasks',    label: 'Task Board', icon: KanbanSquare    },
];

export function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F3FF]">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 min-w-56 flex flex-col bg-[#0F0B1E] border-r border-white/5">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-purple-500">AC</span>
            <span className="text-white">CELIT</span>
          </span>
        </div>

        {/* User pill */}
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-xs text-purple-300 truncate">
            {user?.name} · {isAdmin ? 'Admin' : 'Team'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 pt-2 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 px-2.5 pt-3 pb-1.5">
            Platform
          </p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-purple-500/20 text-white border border-purple-500/30'
                    : 'text-purple-300/70 hover:bg-purple-500/10 hover:text-white'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/60 transition-colors w-full"
          >
            <LogOut size={13} />
            Sign out
          </button>
          <p className="text-[10px] text-white/15 mt-2">Accelit Management v1.0</p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-14 min-h-14 bg-white border-b border-purple-100 px-7 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span className="text-gray-300">Accelit</span>
            <ChevronRight size={13} />
            {/* Breadcrumb rendered by each page via context — kept simple here */}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              isAdmin
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            )}>
              {isAdmin ? 'Admin' : 'Team'}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] ?? '?'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
