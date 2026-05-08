import type { Order, OrderStatus } from '@primefoods/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  accepted: { label: 'Accepted', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  preparing: { label: 'Preparing', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  ready: { label: 'Ready', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  collected: { label: 'Collected', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  order: Order;
}

export function OrderCard({ order }: Props) {
  const config = STATUS_CONFIG[order.status]!;
  const itemSummary = order.items
    .slice(0, 2)
    .map((i) => `${i.quantity}× ${i.menu_item?.name ?? 'Item'}`)
    .join(', ');
  const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-text-secondary text-xs mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}>
          {config.label}
        </span>
      </div>

      <p className="text-text-primary text-sm mt-2.5 line-clamp-1">
        {itemSummary}{extra}
      </p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-text-secondary text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        <span className="text-accent font-bold text-sm">₦{order.total.toLocaleString()}</span>
      </div>
    </div>
  );
}
