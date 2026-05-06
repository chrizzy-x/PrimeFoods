import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

export function DashboardLayout() {
  const { user, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '240px',
          background: '#262626',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #404040',
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#f97316',
            }}
          >
            Prime Kitchen
          </span>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {[
            { to: '/dashboard', label: 'Dashboard', end: true },
            { to: '/dashboard/orders', label: 'Orders', end: false },
            { to: '/dashboard/menu', label: 'Menu', end: false },
            { to: '/dashboard/settings', label: 'Settings', end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.625rem 1.5rem',
                color: isActive ? '#f97316' : '#d4d4d4',
                background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #404040',
            fontSize: '0.75rem',
          }}
        >
          <p style={{ color: '#a3a3a3', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
          <button
            onClick={() => void signOut()}
            style={{
              background: 'transparent',
              border: '1px solid #525252',
              color: '#d4d4d4',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: '#fafafa' }}>
        <Outlet />
      </main>
    </div>
  );
}
