import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient<any, any, any> | null = null;

function getSupabaseClient(): SupabaseClient<any, any, any> | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  _client = createClient(url, anonKey);
  return _client;
}

export const supabase = getSupabaseClient() as SupabaseClient<any, any, any>;
export default supabase;

export function getClient(): SupabaseClient<any, any, any> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase environment variables are missing.');
  }
  return client;
}

// Helper to get current authenticated user
export const getUser = async () => {
  const client = getClient();
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  return session?.user ?? null;
};
