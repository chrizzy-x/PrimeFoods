import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export function RequireAuth() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <span>Loading…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
