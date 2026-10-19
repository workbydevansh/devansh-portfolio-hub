import "server-only";

import { createClient } from "@supabase/supabase-js";

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

// Public reads on the server, limited by Row Level Security like any visitor.
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, serverAuthOptions);
}

// Bypasses Row Level Security. Only for trusted server code (stats sync,
// admin verification); the key must never reach the browser.
export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, serverAuthOptions);
}
