import { useEffect, useRef } from 'react';
import { useAllOrders, useTodayStats, useUpdateOrderStatus } from '@/lib/queries';
import { StatsCard } from '@/components/StatsCard';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import type { Order } from '@primefoods/types';

function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio blocked — silent fallback
  }
}

function sendBrowserNotification(order: Order) {
  if (Notification.permission === 'granted') {
    const itemNames = order.items.slice(0, 2).map((i) => i.menu_item?.name ?? 'Item').join(', ');
    new Notification('New Order!', {
      body: `${order.customer?.full_name ?? 'Customer'} ordered ${itemNames}`,
      icon: '/pwa-192x192.png',
    });
  }
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats } = useTodayStats();
  const { data: allOrders = [] } = useAllOrders();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const seenIds = useRef<Set<string>>(new Set());

  const pendingOrders = allOrders.filter((o) => o.status === 'pending');

  // Request notification permission + realtime new order detection
  useEffect(() => {
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const orderId = (payload.new as { id: string }).id;
          if (seenIds.current.has(orderId)) return;
          seenIds.current.add(orderId);

          await queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
          await queryClient.invalidateQueries({ queryKey: ['kitchen-stats-today'] });

          // Grab order details for notification
          const orders = queryClient.getQueryData<Order[]>(['kitchen-orders']) ?? [];
          const newOrder = orders.find((o) => o.id === orderId);
          if (newOrder) {
            playPing();
            sendBrowserNotification(newOrder);
          } else {
            playPing();
          }
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-0.5">Live order management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Today's Orders"
          value={stats?.totalOrders ?? 0}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatsCard
          label="Today's Revenue"
          value={`₦${(stats?.revenue ?? 0).toLocaleString()}`}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          accent
        />
        <StatsCard
          label="Pending"
          value={stats?.pendingCount ?? 0}
          sub="awaiting acceptance"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>}
        />
        <StatsCard
          label="Avg Prep Time"
          value={stats?.avgPrepMinutes ? `${stats.avgPrepMinutes}m` : '—'}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      {/* Incoming orders */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display font-bold text-lg text-text-primary">Incoming Orders</h2>
          {pendingOrders.length > 0 && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          )}
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-text-secondary text-sm">No pending orders. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-xs text-text-secondary">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className="text-text-secondary text-xs">·</span>
                      <p className="text-text-secondary text-xs">{timeAgo(order.created_at)}</p>
                    </div>
                    <p className="text-text-primary font-semibold text-sm">
                      {order.customer?.full_name ?? 'Customer'}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-text-secondary text-xs">
                          {item.quantity}× {item.menu_item?.name ?? 'Item'}
                          {item.notes ? <span className="text-muted"> — {item.notes}</span> : null}
                        </p>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="mt-1.5 text-xs text-muted italic">Note: {order.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-accent font-bold text-lg">₦{order.total.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => updateStatus({ orderId: order.id, status: 'accepted' })}
                    className="flex-1 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus({ orderId: order.id, status: 'cancelled' })}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
