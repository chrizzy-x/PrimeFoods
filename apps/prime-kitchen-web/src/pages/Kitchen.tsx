import { useAllOrders, useUpdateOrderStatus } from '@/lib/queries';
import { OrderKanbanCard } from '@/components/OrderKanbanCard';
import type { Order, OrderStatus } from '@primefoods/types';

const COLUMNS: { status: OrderStatus; label: string; color: string; dot: string }[] = [
  { status: 'accepted',  label: 'Accepted',  color: 'border-blue-500/30',   dot: 'bg-blue-400' },
  { status: 'preparing', label: 'Preparing', color: 'border-orange-500/30', dot: 'bg-orange-400' },
  { status: 'ready',     label: 'Ready',     color: 'border-green-500/30',  dot: 'bg-green-400' },
  { status: 'collected', label: 'Collected', color: 'border-gray-500/30',   dot: 'bg-gray-400' },
];

export function Kitchen() {
  const { data: allOrders = [] } = useAllOrders();
  const { mutate: updateStatus } = useUpdateOrderStatus();

  const byStatus = (status: OrderStatus): Order[] =>
    allOrders.filter((o) => o.status === status);

  const handleMove = (orderId: string, newStatus: OrderStatus) => {
    updateStatus({ orderId, status: newStatus });
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-5">
        <h1 className="font-display font-bold text-2xl text-text-primary">Kitchen Display</h1>
        <p className="text-text-secondary text-sm mt-0.5">Live order flow — updates in real time</p>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        {COLUMNS.map(({ status, label, color, dot }) => {
          const orders = byStatus(status);
          return (
            <div key={status} className={`bg-surface border ${color} rounded-2xl flex flex-col min-h-0`}>
              {/* Column header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="font-display font-semibold text-sm text-text-primary">{label}</span>
                </div>
                <span className="text-text-secondary text-xs font-bold">{orders.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-0">
                {orders.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-text-secondary text-xs">
                    No orders
                  </div>
                ) : (
                  orders.map((order) => (
                    <OrderKanbanCard key={order.id} order={order} onMove={handleMove} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
