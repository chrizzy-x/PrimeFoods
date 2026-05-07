import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme/tokens';
import type { Restaurant } from '@/types/database';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select(
        'id, name, description, logo_url, cuisine_type, average_rating, estimated_delivery_minutes, delivery_fee, is_open, city',
      )
      .eq('status', 'active')
      .order('average_rating', { ascending: false });

    setRestaurants((data as Restaurant[]) ?? []);
    setIsLoading(false);
  };

  const filtered = search.trim()
    ? restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.cuisine_type.some((c) => c.toLowerCase().includes(search.toLowerCase())),
      )
    : restaurants;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Prime Foods</Text>
        <Text style={styles.subtitle}>What are you craving?</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search restaurants or cuisine…"
        placeholderTextColor={colors.neutral[400]}
        clearButtonMode="while-editing"
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand[500]} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No restaurants found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => {
        // Navigation to restaurant detail handled via expo-router
        // router.push(`/restaurant/${restaurant.id}`)
      }}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{restaurant.name}</Text>
          <Text style={styles.cardCuisine}>{restaurant.cuisine_type.join(', ')}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>⭐ {Number(restaurant.average_rating).toFixed(1)}</Text>
            <Text style={styles.cardMetaDot}>·</Text>
            <Text style={styles.cardMetaText}>{restaurant.estimated_delivery_minutes} min</Text>
            <Text style={styles.cardMetaDot}>·</Text>
            <Text style={styles.cardMetaText}>
              {Number(restaurant.delivery_fee) === 0
                ? 'Free delivery'
                : `$${Number(restaurant.delivery_fee).toFixed(2)} delivery`}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: restaurant.is_open ? '#dcfce7' : '#fee2e2' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: restaurant.is_open ? '#15803d' : '#b91c1c' },
            ]}
          >
            {restaurant.is_open ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    padding: spacing[6],
    paddingBottom: spacing[3],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.brand[500],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
  },
  searchInput: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[0],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.base,
  },
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  cardBody: {
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  cardName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  cardCuisine: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  cardMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
  },
  cardMetaDot: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
});
