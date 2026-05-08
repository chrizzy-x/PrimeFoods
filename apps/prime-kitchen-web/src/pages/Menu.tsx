import { useState } from 'react';
import {
  useAllMenuItems,
  useCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from '@/lib/queries';
import { MenuItemRow } from '@/components/MenuItemRow';
import type { MenuItem } from '@primefoods/types';

type FormData = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  prep_time_minutes: string;
  calories: string;
  is_featured: boolean;
  is_available: boolean;
};

const EMPTY: FormData = {
  name: '', description: '', price: '', image_url: '',
  category_id: '', prep_time_minutes: '15', calories: '',
  is_featured: false, is_available: true,
};

function MenuItemModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const { data: categories = [] } = useCategories();
  const { mutateAsync: create, isPending: creating } = useCreateMenuItem();
  const { mutateAsync: update, isPending: updating } = useUpdateMenuItem();
  const [form, setForm] = useState<FormData>(
    item
      ? {
          name: item.name,
          description: item.description,
          price: String(item.price),
          image_url: item.image_url ?? '',
          category_id: item.category_id,
          prep_time_minutes: String(item.prep_time_minutes),
          calories: item.calories != null ? String(item.calories) : '',
          is_featured: item.is_featured,
          is_available: item.is_available,
        }
      : EMPTY,
  );
  const [error, setError] = useState('');
  const pending = creating || updating;

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        ...(form.image_url ? { image_url: form.image_url } : {}),
        category_id: form.category_id,
        prep_time_minutes: parseInt(form.prep_time_minutes, 10),
        ...(form.calories ? { calories: parseInt(form.calories, 10) } : {}),
        is_featured: form.is_featured,
        is_available: form.is_available,
      };
      if (item) {
        await update({ id: item.id, ...payload });
      } else {
        await create(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const inputCls =
    'w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-muted text-sm focus:outline-none focus:border-accent transition-colors';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text-primary">
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-text-secondary text-xs font-medium block mb-1">Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Jollof Rice" />
            </div>
            <div className="col-span-2">
              <label className="text-text-secondary text-xs font-medium block mb-1">Description *</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} required placeholder="Rich tomato rice..." />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Price (₦) *</label>
              <input className={inputCls} type="number" min="0" step="50" value={form.price} onChange={(e) => set('price', e.target.value)} required placeholder="3500" />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Prep Time (min) *</label>
              <input className={inputCls} type="number" min="1" value={form.prep_time_minutes} onChange={(e) => set('prep_time_minutes', e.target.value)} required />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Category *</label>
              <select className={inputCls} value={form.category_id} onChange={(e) => set('category_id', e.target.value)} required>
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Calories</label>
              <input className={inputCls} type="number" min="0" value={form.calories} onChange={(e) => set('calories', e.target.value)} placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <label className="text-text-secondary text-xs font-medium block mb-1">Image URL</label>
              <input className={inputCls} type="url" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} className="accent-accent w-4 h-4" />
              <span className="text-text-secondary text-sm">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="accent-accent w-4 h-4" />
              <span className="text-text-secondary text-sm">Featured</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium">Cancel</button>
            <button type="submit" disabled={pending} className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-60 transition-colors">
              {pending ? 'Saving…' : item ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Menu() {
  const { data: items = [], isLoading } = useAllMenuItems();
  const { mutate: deleteItem } = useDeleteMenuItem();
  const [modalItem, setModalItem] = useState<MenuItem | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteItem(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Menu Manager</h1>
          <p className="text-text-secondary text-sm mt-0.5">{items.length} items</p>
        </div>
        <button
          onClick={() => setModalItem(null)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-text-secondary text-sm">No menu items yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Image</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Prep</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Available</th>
                <th className="px-4 py-3 text-left text-xs text-text-secondary font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onEdit={(i) => setModalItem(i)}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {modalItem !== undefined && (
        <MenuItemModal item={modalItem} onClose={() => setModalItem(undefined)} />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="font-display font-bold text-lg text-text-primary mb-1.5">Delete Item?</h3>
            <p className="text-text-secondary text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
