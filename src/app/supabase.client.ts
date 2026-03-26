import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../environments/environment';

let supabaseClient: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    environment.supabaseUrl &&
      environment.supabasePublishableKey &&
      !environment.supabaseUrl.includes('YOUR_SUPABASE_URL') &&
      !environment.supabasePublishableKey.includes('YOUR_SUPABASE_PUBLISHABLE_KEY'),
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (supabaseClient === undefined) {
    supabaseClient = createClient(
      environment.supabaseUrl,
      environment.supabasePublishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return supabaseClient;
}
