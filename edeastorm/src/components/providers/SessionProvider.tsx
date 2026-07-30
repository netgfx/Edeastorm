'use client';

import { useLayoutEffect } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { setSupabaseAccessToken } from '@/lib/supabase';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function SupabaseSessionBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useLayoutEffect(() => {
    if (status === 'loading') return;

    setSupabaseAccessToken(session?.supabaseAccessToken ?? null);

    return () => {
      setSupabaseAccessToken(null);
    };
  }, [session?.supabaseAccessToken, status]);

  if (status === 'loading') return null;

  return children;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      <SupabaseSessionBridge>{children}</SupabaseSessionBridge>
    </NextAuthSessionProvider>
  );
}
