// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AppShell }          from '@/components/layout/AppShell';
import { LoginPage }         from '@/pages/LoginPage';
import { DashboardPage }     from '@/pages/DashboardPage';
import { ProductsPage }      from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { TaskBoardPage }     from '@/pages/TaskBoardPage';

// Guard: redirect to /login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard: redirect to / if already logged in
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <RedirectIfAuth><LoginPage /></RedirectIfAuth>
      } />

      <Route element={
        <RequireAuth><AppShell /></RequireAuth>
      }>
        <Route index            element={<DashboardPage />} />
        <Route path="products"  element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="tasks"     element={<TaskBoardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
