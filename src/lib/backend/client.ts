import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/**
 * The one Supabase client, made on first use (the demo never makes it).
 * The session lives in AsyncStorage and refreshes itself while the app is in
 * the foreground (Supabase's advice for React Native).
 */
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: AsyncStorage,
      storageKey: 'nightshift.auth',
      autoRefreshToken: true,
      persistSession: true,
      // Sign-in links come back as nightshift://#access_token=…; auth.tsx reads them.
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
  if (Platform.OS !== 'web') {
    const c = client;
    AppState.addEventListener('change', (state) => {
      if (state === 'active') c.auth.startAutoRefresh();
      else c.auth.stopAutoRefresh();
    });
  }
  return client;
}
