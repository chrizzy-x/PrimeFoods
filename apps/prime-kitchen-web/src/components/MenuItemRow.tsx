import type { MenuItem } from '@primefoods/types';
import { useToggleMenuItemAvailability } from '@/lib/queries';

interface Props {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemRow({ item, onEdit, onDelete }: Props) {
  const { mutate: toggle, isPending } = useToggleMenuItemAvailability();

  return (
    <tr className="border-b border-border hover:bg-surface-2/50 transition-colors">
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-text-primary text-sm font-medium">{item.name}</p>
        <p className="text-text-secondary text-xs line-clamp-1 mt-0.5">{item.description}</p>
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm">
        {item.category?.emoji} {item.category?.name ?? '—'}
      </td>
      <td className="px-4 py-3 text-text-primary text-sm font-semibold">
        ₦{item.price.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm">{item.prep_time_minutes}m</td>
      <td className="px-4 py-3">
        <button
          onClick={() => toggle({ id: item.id, is_available: !item.is_available })}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
            item.is_available ? 'bg-accent' : 'bg-border'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              item.is_available ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="text-text-secondary hover:text-text-primary text-xs px-2.5 py-1 rounded-lg border border-border hover:border-accent/50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-300 text-xs px-2.5 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
