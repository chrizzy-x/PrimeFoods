import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready_for_pickup: '#06b6d4',
  out_for_delivery: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!restaurant) {
        setIsLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      await fetchOrders(restaurant.id);
    };

    void init();
  }, [user]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders:restaurant_id=eq.${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          void fetchOrders(restaurantId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const fetchOrders = async (rid: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', rid)
      .not('status', 'in', '(delivered,cancelled)')
      .order('created_at', { ascending: false });

    setOrders((data as Order[]) ?? []);
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Live Orders</h2>

      {isLoading ? (
        <p style={{ color: '#737373' }}>Loading orders…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#737373' }}>No active orders at the moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#fff',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                boxShadow: '0 1px 2px rgb(0 0 0 / 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#737373' }}>
                  {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'} ·{' '}
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ fontWeight: 700 }}>${Number(order.total).toFixed(2)}</p>
                <span
                  style={{
                    background: STATUS_COLORS[order.status] + '20',
                    color: STATUS_COLORS[order.status],
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
