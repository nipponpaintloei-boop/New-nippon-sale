import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cloud Sync Configuration
 * - false (default): Local-First mode. All reads and writes go to localStorage immediately with zero network delay.
 * - true: Cloud-First / Cloud-Sync mode. Enables sync with Supabase tables and realtime channels.
 */
export const USE_CLOUD_SYNC = false;

declare global {
  interface Window {
    NIPPON_SUPABASE_CONFIG?: {
      url: string;
      anonKey: string;
    };
    NIPPON_AUTH?: any;
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<boolean>;
    };
  }
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const windowCfg = window.NIPPON_SUPABASE_CONFIG;
  if (windowCfg && windowCfg.url && windowCfg.anonKey && !windowCfg.anonKey.startsWith('YOUR_')) {
    return { url: windowCfg.url, anonKey: windowCfg.anonKey };
  }
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }
  // Default config from original project
  return {
    url: 'https://mrkldhhubtkzhjbmnuaf.supabase.co',
    anonKey: 'sb_publishable_qlrwuXsgE1qpyLZOJoudgw_mywsHAU8',
  };
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    const config = getSupabaseConfig();
    supabaseClientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClientInstance;
}
