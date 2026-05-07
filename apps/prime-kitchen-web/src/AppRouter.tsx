import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardOverviewPage />} />
            <Route path="/dashboard/orders" element={<OrdersPage />} />
            {/* Additional routes added in future phases */}
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
