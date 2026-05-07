import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { borderRadius, colors, spacing, typography } from '@/theme/tokens';
import type { Order, OrderStatus } from '@/types/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#fffbeb', text: '#b45309' },
  confirmed: { bg: '#eff6ff', text: '#1d4ed8' },
  preparing: { bg: '#f5f3ff', text: '#6d28d9' },
  ready_for_pickup: { bg: '#ecfeff', text: '#0e7490' },
  out_for_delivery: { bg: '#fff7ed', text: '#c2410c' },
  delivered: { bg: '#f0fdf4', text: '#15803d' },
  cancelled: { bg: '#fef2f2', text: '#b91c1c' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void fetchOrders();

    const channel = supabase
      .channel(`customer-orders:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          void fetchOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    setOrders((data as Order[]) ?? []);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No orders yet. Start ordering!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusStyle = STATUS_COLORS[order.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(order.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.totalText}>${Number(order.total).toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { padding: spacing[6], paddingBottom: spacing[3] },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[900],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyText: { color: colors.neutral[400], fontSize: typography.fontSize.base },
  list: { padding: spacing[4], gap: spacing[3] },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  orderId: {
    fontWeight: '600',
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { color: colors.neutral[500], fontSize: typography.fontSize.sm },
  totalText: {
    fontWeight: '700',
    fontSize: typography.fontSize.lg,
    color: colors.neutral[900],
  },
});
