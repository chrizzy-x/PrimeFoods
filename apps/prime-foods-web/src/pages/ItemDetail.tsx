import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuItem } from '../lib/queries';
import { useCartStore } from '../store/cart';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useMenuItem(id ?? '');
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const cartEntry = cartItems.find((i) => i.menuItem.id === id);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary">Item not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-accent font-medium text-sm">Go back</button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (cartEntry) {
      updateQuantity(item.id, cartEntry.quantity + quantity);
    } else {
      addItem(item, quantity);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Image */}
      <div className="relative h-72 flex-shrink-0 bg-surface-2">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-bg/80" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-4 w-9 h-9 bg-bg/70 backdrop-blur-sm rounded-full flex items-center justify-center text-text-primary"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-32">
        {item.category && (
          <span className="text-accent text-xs font-semibold uppercase tracking-wider">
            {item.category.emoji} {item.category.name}
          </span>
        )}
        <h1 className="font-display font-bold text-2xl text-text-primary mt-1.5">{item.name}</h1>
        <p className="text-text-secondary text-sm mt-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-text-secondary text-sm">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
            {item.prep_time_minutes} min
          </div>
          {item.calories && (
            <div className="flex items-center gap-1.5 text-text-secondary text-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {item.calories} cal
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-accent font-bold text-3xl">₦{item.price.toLocaleString()}</p>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center gap-4 mt-5">
          <span className="text-text-secondary text-sm">Quantity</span>
          <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary hover:bg-border transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-text-primary font-bold w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary hover:bg-border transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add to cart */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app px-5 pb-6 pt-3 bg-bg/95 backdrop-blur-sm border-t border-border">
        <button
          onClick={handleAddToCart}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-accent hover:bg-accent-dark text-white'
          }`}
        >
          {added ? '✓ Added to Cart!' : cartEntry ? `Update Cart (${cartEntry.quantity + quantity} total)` : `Add to Cart • ₦${(item.price * quantity).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
