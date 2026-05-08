import { useNavigate } from 'react-router-dom';
import { useOrders } from '../lib/queries';
import { OrderCard } from '../components/OrderCard';

export function Orders() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();

  return (
    <div className="min-h-full">
      <div className="px-4 pt-10 pb-4">
        <h1 className="font-display font-bold text-2xl text-text-primary">My Orders</h1>
        <p className="text-text-secondary text-sm mt-0.5">Track your order history</p>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-28 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="font-display font-bold text-xl text-text-primary">No orders yet</h2>
          <p className="text-text-secondary text-sm mt-1.5">Start ordering your favourite Nigerian dishes</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 bg-accent text-white px-6 py-3.5 rounded-2xl font-semibold text-sm hover:bg-accent-dark transition-colors"
          >
            Start Ordering
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
