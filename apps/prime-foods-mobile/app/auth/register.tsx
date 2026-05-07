import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { borderRadius, colors, spacing, typography } from '@/theme/tokens';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), role: 'customer' },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Prime Foods</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!isSubmitting}
              placeholderTextColor={colors.neutral[400]}
              placeholder="Jane Smith"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              placeholderTextColor={colors.neutral[400]}
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
              placeholderTextColor={colors.neutral[400]}
              placeholder="At least 8 characters"
            />
          </View>

          {error !== null && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={() => void handleRegister()}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  inner: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing[10],
    alignItems: 'center',
  },
  logo: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.brand[500],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
  },
  form: {
    gap: spacing[4],
  },
  inputGroup: {
    gap: spacing[1],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[0],
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  errorText: {
    color: '#b91c1c',
    fontSize: typography.fontSize.sm,
  },
  button: {
    backgroundColor: colors.brand[500],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    backgroundColor: colors.brand[300],
  },
  buttonText: {
    color: colors.neutral[0],
    fontWeight: '600',
    fontSize: typography.fontSize.base,
  },
  linkButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
  linkText: {
    color: colors.brand[600],
    fontSize: typography.fontSize.sm,
  },
});
