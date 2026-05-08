import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { usePlaceOrder } from '../lib/queries';

const DELIVERY_FEE = 500;

export function Cart() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0));
  const [notes, setNotes] = useState('');
  const { mutateAsync: placeOrder, isPending } = usePlaceOrder();

  const handlePlaceOrder = async () => {
    try {
      await placeOrder({
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          name: i.menuItem.name,
          price: i.menuItem.price,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        total: subtotal + DELIVERY_FEE,
        notes: notes || undefined,
      });
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Order failed:', err);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display font-bold text-xl text-text-primary">Your cart is empty</h2>
        <p className="text-text-secondary text-sm mt-1.5">Add some delicious items to get started</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-6 bg-accent text-white px-6 py-3.5 rounded-2xl font-semibold text-sm transition-colors hover:bg-accent-dark"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="text-text-secondary">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display font-bold text-2xl text-text-primary">My Cart</h1>
        </div>
        <p className="text-text-secondary text-sm ml-8">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-4 space-y-3">
        {items.map((item) => (
          <div key={item.menuItem.id} className="bg-surface border border-border rounded-2xl p-3 flex gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
              {item.menuItem.image_url ? (
                <img src={item.menuItem.image_url} alt={item.menuItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-semibold line-clamp-1">{item.menuItem.name}</p>
              <p className="text-accent text-sm font-bold mt-0.5">₦{item.menuItem.price.toLocaleString()}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-2 py-0.5">
                  <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center text-text-primary">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 12H4" /></svg>
                  </button>
                  <span className="text-text-primary text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center text-text-primary">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                <button onClick={() => removeItem(item.menuItem.id)} className="text-red-400 text-xs font-medium">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="px-4 mt-4">
        <label className="text-text-secondary text-sm font-medium block mb-1.5">Order notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions?"
          rows={3}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text-primary placeholder:text-muted text-sm focus:outline-none focus:border-accent resize-none transition-colors"
        />
      </div>

      {/* Summary */}
      <div className="px-4 mt-4 bg-surface border border-border rounded-2xl mx-4 p-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="text-text-primary font-medium">₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Delivery fee</span>
          <span className="text-text-primary font-medium">₦{DELIVERY_FEE.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-2.5 border-t border-border">
          <span className="text-text-primary font-semibold">Total</span>
          <span className="text-accent font-bold text-lg">₦{(subtotal + DELIVERY_FEE).toLocaleString()}</span>
        </div>
      </div>

      <div className="px-4 mt-5 pb-6">
        <button
          onClick={handlePlaceOrder}
          disabled={isPending}
          className="w-full bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition-colors text-sm active:scale-95"
        >
          {isPending ? 'Placing order…' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
