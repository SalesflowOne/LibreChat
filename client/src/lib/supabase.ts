import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function resolveSupabaseUrl(): string {
  const url =
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    import.meta.env.VITE_SUPABASE_PROJECT_URL?.trim() ||
    '';
  return url;
}

function resolveSupabaseAnonKey(): string {
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    '';
  return key;
}

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseAuthEnabled()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  if (!client) {
    client = createClient(resolveSupabaseUrl(), resolveSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
