import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '@primefoods/types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setItemNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.menuItem.id === menuItem.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItem.id === menuItem.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { menuItem, quantity, notes: '' }] };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({ items: state.items.filter((i) => i.menuItem.id !== menuItemId) }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i,
          ),
        }));
      },

      setItemNotes: (menuItemId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, notes } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get total() {
        return get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      },
    }),
    { name: 'prime-foods-cart' },
  ),
);
