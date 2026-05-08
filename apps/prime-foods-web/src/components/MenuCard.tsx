import { useNavigate } from 'react-router-dom';
import type { MenuItem } from '@primefoods/types';
import { useCartStore } from '../store/cart';

interface Props {
  item: MenuItem;
}

export function MenuCard({ item }: Props) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item);
  };

  return (
    <div
      onClick={() => navigate(`/item/${item.id}`)}
      className="bg-surface rounded-2xl overflow-hidden border border-border cursor-pointer group active:scale-[0.98] transition-transform"
    >
      <div className="relative h-36 overflow-hidden bg-surface-2">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        {item.is_featured && (
          <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-display font-semibold text-text-primary text-sm leading-tight line-clamp-1">
          {item.name}
        </h3>
        <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">{item.description}</p>

        <div className="flex items-center justify-between mt-2.5">
          <div>
            <p className="text-accent font-bold text-sm">₦{item.price.toLocaleString()}</p>
            <p className="text-muted text-[10px]">{item.prep_time_minutes} min</p>
          </div>
          <button
            onClick={handleAdd}
            className="w-8 h-8 bg-accent hover:bg-accent-dark rounded-full flex items-center justify-center text-white transition-colors active:scale-95"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
