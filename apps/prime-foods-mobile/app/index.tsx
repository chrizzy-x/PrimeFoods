import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme/tokens';

export default function IndexRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
