import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

let pendingGuestUser: Promise<User> | null = null;

async function findOrCreateGuestUser(): Promise<User> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (session?.user) return session.user;

  const { data: { user }, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!user) throw new Error('Could not start your guest session. Please try again.');
  return user;
}

// Share one request so simultaneous actions keep the same private guest identity.
export function getOrCreateGuestUser(): Promise<User> {
  if (!pendingGuestUser) {
    pendingGuestUser = findOrCreateGuestUser().finally(() => {
      pendingGuestUser = null;
    });
  }
  return pendingGuestUser;
}
