import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

let browserClient: SupabaseClient | undefined;

// One shared client per browser tab instead of one per component: a single
// auth listener, and no "Multiple GoTrueClient instances" warning.
export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  browserClient ??= createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
