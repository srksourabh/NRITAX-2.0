/**
 * Supabase client singletons.
 *
 * getServiceClient() — server-side only, uses SERVICE_ROLE_KEY, bypasses RLS.
 *   Use this in all API routes and server actions.
 *
 * getAnonClient() — safe for browser use, respects RLS.
 *   Only needed if client components call Supabase directly (none currently).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;

let serviceClient: SupabaseClient<AnyDb> | null = null;
let anonClient: SupabaseClient<AnyDb> | null = null;

function url(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  return v;
}

/** Server-only: full DB access, no RLS restrictions. */
export function getServiceClient(): SupabaseClient<AnyDb> {
  if (serviceClient) return serviceClient;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  serviceClient = createClient(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/** Browser-safe: anon key, respects Row Level Security. */
export function getAnonClient(): SupabaseClient<AnyDb> {
  if (anonClient) return anonClient;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  anonClient = createClient(url(), key);
  return anonClient;
}
