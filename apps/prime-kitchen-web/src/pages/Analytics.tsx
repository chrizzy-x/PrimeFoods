import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalytics } from '@/lib/queries';

type Range = 'today' | '7d' | '30d';

function getDateRange(range: Range): [Date, Date] {
  const end = new Date();
  const start = new Date();
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return [start, end];
}

function fmtDate(iso: string, range: Range) {
  const d = new Date(iso);
  if (range === 'today') return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const COLORS = ['#e8521a', '#f06a34', '#fbbf24', '#34d399', '#60a5fa'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#60a5fa',
  preparing: '#f97316',
  ready: '#34d399',
  collected: '#9ca3af',
};

export function Analytics() {
  const [range, setRange] = useState<Range>('7d');
  const [start, end] = getDateRange(range);
  const { data: orders = [], isLoading } = useAnalytics(start, end);

  // Orders per day
  const ordersPerDay = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const key = fmtDate(o.created_at, range);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [orders, range]);

  // Revenue per day
  const revenuePerDay = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const key = fmtDate(o.created_at, range);
      map.set(key, (map.get(key) ?? 0) + o.total);
    });
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
  }, [orders, range]);

  // Top 5 items by quantity
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.menu_item?.name ?? 'Unknown';
        const existing = map.get(item.menu_item_id);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          map.set(item.menu_item_id, { name, qty: item.quantity });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  // Orders by status
  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => map.set(o.status, (map.get(o.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([status, value]) => ({ status, value }));
  }, [orders]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartTooltipStyle = {
    backgroundColor: '#171b24',
    border: '1px solid #252d3d',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 12,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Analytics</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {orders.length} orders · ₦{totalRevenue.toLocaleString()} revenue
          </p>
        </div>

        <div className="flex bg-surface border border-border rounded-xl p-1 gap-1">
          {(['today', '7d', '30d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                range === r ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Orders per day */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-4">Orders</h3>
          {ordersPerDay.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252d3d" />
                <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#e8521a" strokeWidth={2} dot={{ fill: '#e8521a', r: 3 }} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue per day */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-4">Revenue (₦)</h3>
          {revenuePerDay.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenuePerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252d3d" />
                <XAxis dataKey="date" tick={{ fill: '#8892a4', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#f06a34" strokeWidth={2} dot={{ fill: '#f06a34', r: 3 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top items */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-4">Top 5 Items by Quantity</h3>
          {topItems.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#252d3d" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8892a4', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#8892a4', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="qty" name="Qty" radius={[0, 4, 4, 0]}>
                  {topItems.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-4">Orders by Status</h3>
          {byStatus.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ status, percent }) => `${status} ${Math.round((percent as number) * 100)}%`}
                  labelLine={false}
                >
                  {byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend formatter={(v) => <span style={{ color: '#8892a4', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
