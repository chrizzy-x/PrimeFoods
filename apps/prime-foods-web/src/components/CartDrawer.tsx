import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0));

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-surface border-t border-border rounded-t-3xl z-50 p-5 pb-8">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h2 className="font-display font-bold text-text-primary text-lg mb-3">Your Cart</h2>

        {items.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-4">Your cart is empty</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {items.map((item) => (
              <div key={item.menuItem.id} className="flex items-center justify-between gap-2">
                <span className="text-text-primary text-sm flex-1 line-clamp-1">{item.menuItem.name}</span>
                <span className="text-text-secondary text-sm">×{item.quantity}</span>
                <span className="text-accent text-sm font-semibold w-20 text-right">
                  ₦{(item.menuItem.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-text-secondary text-sm">Total</span>
              <span className="text-accent font-bold">₦{total.toLocaleString()}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/cart'); }}
              className="mt-4 w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              View Cart
            </button>
          </>
        )}
      </div>
    </>
  );
}
