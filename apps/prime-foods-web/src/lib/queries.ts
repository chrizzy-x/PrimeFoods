import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Category, MenuItem, Order, OrderItem, Profile } from '@primefoods/types';
import { supabase } from './supabase';

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ['menu_items', categoryId ?? 'all'],
    queryFn: async (): Promise<MenuItem[]> => {
      let q = supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .eq('is_available', true)
        .order('name');
      if (categoryId) q = q.eq('category_id', categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeaturedMenuItems() {
  return useQuery({
    queryKey: ['menu_items', 'featured'],
    queryFn: async (): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .eq('is_available', true)
        .eq('is_featured', true)
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menu_items', id],
    queryFn: async (): Promise<MenuItem | null> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { full_name: string; phone: string; avatar_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useOrders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
}

// ─── Place Order ──────────────────────────────────────────────────────────────

interface PlaceOrderPayload {
  items: Array<{ menuItemId: string; name: string; price: number; quantity: number; notes?: string }>;
  total: number;
  notes?: string;
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlaceOrderPayload): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          total: payload.total,
          notes: payload.notes ?? null,
          status: 'pending',
        })
        .select('id')
        .single();
      if (orderErr) throw orderErr;

      const orderItems: Omit<OrderItem, 'id' | 'menu_item'>[] = payload.items.map((i) => ({
        order_id: order.id,
        menu_item_id: i.menuItemId,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
        notes: i.notes ?? null,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      return order.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
