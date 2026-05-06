import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';
import { borderRadius, colors, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.email?.charAt(0) ?? 'U').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={() => void signOut()}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  section: {
    alignItems: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.brand[600],
  },
  email: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[700],
  },
  actions: {
    padding: spacing[6],
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  signOutText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: typography.fontSize.base,
  },
});
