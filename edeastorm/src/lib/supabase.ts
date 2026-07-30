/** @format */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let nextAuthSupabaseAccessToken: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. See env.example.txt for details."
  );
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => nextAuthSupabaseAccessToken,
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Keeps browser-side Supabase requests and Realtime channels scoped to the
 * current NextAuth user. The token is minted in the Auth.js session callback.
 */
export function setSupabaseAccessToken(token: string | null) {
  nextAuthSupabaseAccessToken = token;

  if (typeof window !== "undefined") {
    if (token) {
      void supabase.realtime.setAuth(token);
    } else {
      void supabase.realtime.setAuth();
    }
  }
}

// Server-side Supabase client with service role (bypass RLS)
// NOTE: Only use this for server-side operations where RLS bypass is truly needed
// (e.g., admin operations, background jobs). Prefer supabaseAuth for user operations.
export const supabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Create an authenticated Supabase client using a NextAuth session token.
 * This client will have the user's identity set, allowing RLS policies to work correctly.
 *
 * @param supabaseAccessToken - The JWT token from session.supabaseAccessToken
 * @returns A Supabase client with the user's authentication context
 */
export const createAuthenticatedClient = (supabaseAccessToken: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default supabase;
