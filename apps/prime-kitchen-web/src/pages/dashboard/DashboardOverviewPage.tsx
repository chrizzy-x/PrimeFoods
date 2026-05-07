import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  averageRating: number;
}

export function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setIsLoading(true);

      // Fetch restaurant owned by current user
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!restaurant) {
        setIsLoading(false);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [pendingResult, todayResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .in('status', ['pending', 'confirmed', 'preparing']),
        supabase
          .from('orders')
          .select('total')
          .eq('restaurant_id', restaurant.id)
          .gte('created_at', todayStart.toISOString()),
      ]);

      const todayOrders = todayResult.data ?? [];
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        pendingOrders: pendingResult.count ?? 0,
        todayOrders: todayOrders.length,
        todayRevenue,
        averageRating: 0, // populated from restaurant aggregate
      });

      setIsLoading(false);
    };

    void fetchStats();
  }, [user]);

  const statCards: Array<{ label: string; value: string; color: string }> = stats
    ? [
        {
          label: 'Pending Orders',
          value: String(stats.pendingOrders),
          color: '#f59e0b',
        },
        {
          label: "Today's Orders",
          value: String(stats.todayOrders),
          color: '#3b82f6',
        },
        {
          label: "Today's Revenue",
          value: `$${stats.todayRevenue.toFixed(2)}`,
          color: '#22c55e',
        },
      ]
    : [];

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Dashboard</h2>

      {isLoading ? (
        <p style={{ color: '#737373' }}>Loading…</p>
      ) : stats === null ? (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No restaurant found</p>
          <p style={{ fontSize: '0.875rem', color: '#737373' }}>
            You haven't set up a restaurant yet. Go to Settings to create one.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {statCards.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#fff',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                boxShadow: '0 1px 2px rgb(0 0 0 / 0.05)',
                borderTop: `4px solid ${color}`,
              }}
            >
              <p style={{ fontSize: '0.75rem', color: '#737373', fontWeight: 500, marginBottom: '0.5rem' }}>
                {label}
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
