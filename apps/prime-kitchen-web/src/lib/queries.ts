import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Category, MenuItem, Order } from '@primefoods/types';
import { supabase } from './supabase';

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useAllOrders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles(*),
          items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    refetchInterval: 30_000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] }),
  });
}

// ─── Today Stats ──────────────────────────────────────────────────────────────

export interface TodayStats {
  totalOrders: number;
  revenue: number;
  pendingCount: number;
  avgPrepMinutes: number;
}

export function useTodayStats() {
  return useQuery({
    queryKey: ['kitchen-stats-today'],
    queryFn: async (): Promise<TodayStats> => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('status, total, created_at, updated_at')
        .gte('created_at', todayStart.toISOString());

      if (error) throw error;
      const orders = data ?? [];

      const totalOrders = orders.length;
      const revenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum: number, o: { total: number }) => sum + o.total, 0);
      const pendingCount = orders.filter((o: { status: string }) => o.status === 'pending').length;

      const completedOrders = orders.filter(
        (o: { status: string; created_at: string; updated_at: string }) =>
          o.status === 'collected' || o.status === 'ready',
      );
      const avgPrepMinutes =
        completedOrders.length > 0
          ? Math.round(
              completedOrders.reduce(
                (sum: number, o: { created_at: string; updated_at: string }) =>
                  sum +
                  (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) /
                    60000,
                0,
              ) / completedOrders.length,
            )
          : 0;

      return { totalOrders, revenue, pendingCount, avgPrepMinutes };
    },
    refetchInterval: 60_000,
  });
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export function useAllMenuItems() {
  return useQuery({
    queryKey: ['kitchen-menu-items'],
    queryFn: async (): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .order('name');
      if (error) throw error;
      return data as MenuItem[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['kitchen-categories'],
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

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_available }) => {
      await queryClient.cancelQueries({ queryKey: ['kitchen-menu-items'] });
      const prev = queryClient.getQueryData<MenuItem[]>(['kitchen-menu-items']);
      queryClient.setQueryData<MenuItem[]>(['kitchen-menu-items'], (old) =>
        old?.map((m) => (m.id === id ? { ...m, is_available } : m)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['kitchen-menu-items'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] }),
  });
}

interface MenuItemPayload {
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: string;
  prep_time_minutes: number;
  calories?: number;
  is_featured: boolean;
  is_available: boolean;
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MenuItemPayload) => {
      const { error } = await supabase.from('menu_items').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] }),
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: MenuItemPayload & { id: string }) => {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] }),
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu-items'] }),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items: Array<{ menu_item_id: string; quantity: number; menu_item: { name: string } | null }>;
}

export function useAnalytics(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['kitchen-analytics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<AnalyticsOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, status, total, created_at,
          items:order_items(menu_item_id, quantity, menu_item:menu_items(name))
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .neq('status', 'cancelled');
      if (error) throw error;
      return (data ?? []) as unknown as AnalyticsOrder[];
    },
  });
}
