import { createBrowserClient } from '@supabase/ssr';

const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey
);

export const supabase = hasSupabaseEnv
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      publicKey!
    )
  : null;
