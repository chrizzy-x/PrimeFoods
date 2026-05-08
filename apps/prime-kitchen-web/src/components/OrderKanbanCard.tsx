import type { Order, OrderStatus } from '@primefoods/types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'collected',
};

const STATUS_COLORS: Record<string, string> = {
  accepted: 'border-blue-500/30 bg-blue-500/5',
  preparing: 'border-orange-500/30 bg-orange-500/5',
  ready: 'border-green-500/30 bg-green-500/5',
  collected: 'border-gray-500/30 bg-gray-500/5',
};

function minutesSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

interface Props {
  order: Order;
  onMove: (orderId: string, status: OrderStatus) => void;
}

export function OrderKanbanCard({ order, onMove }: Props) {
  const nextStatus = NEXT_STATUS[order.status];
  const elapsed = minutesSince(order.updated_at);
  const colorClass = STATUS_COLORS[order.status] ?? 'border-border bg-surface';

  const nextLabel: Record<string, string> = {
    preparing: 'Mark Preparing',
    ready: 'Mark Ready',
    collected: 'Mark Collected',
  };

  return (
    <div className={`border rounded-xl p-3.5 mb-2.5 ${colorClass}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-text-secondary">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        <span className={`text-xs font-medium ${elapsed > 30 ? 'text-red-400' : 'text-text-secondary'}`}>
          {elapsed}m ago
        </span>
      </div>

      <p className="text-text-primary text-sm font-semibold">
        {order.customer?.full_name ?? 'Customer'}
      </p>

      <div className="mt-2 space-y-0.5">
        {order.items.slice(0, 3).map((item) => (
          <p key={item.id} className="text-text-secondary text-xs">
            {item.quantity}× {item.menu_item?.name ?? 'Item'}
            {item.notes ? <span className="text-muted"> ({item.notes})</span> : null}
          </p>
        ))}
        {order.items.length > 3 && (
          <p className="text-muted text-xs">+{order.items.length - 3} more</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
        <span className="text-accent text-sm font-bold">₦{order.total.toLocaleString()}</span>
        {nextStatus && (
          <button
            onClick={() => onMove(order.id, nextStatus)}
            className="text-xs font-semibold px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors active:scale-95"
          >
            {nextLabel[nextStatus]}
          </button>
        )}
      </div>
    </div>
  );
}
