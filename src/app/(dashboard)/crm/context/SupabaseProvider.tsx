"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';

// Supabase client is created in src/lib/supabaseClient.ts and exported as default.
import supabase from '../../../../lib/supabaseClient';

interface SupabaseContextProps {
  supabase: SupabaseClient<any>;
  session: Session | null;
  user: any | null;
}

const SupabaseContext = createContext<SupabaseContextProps | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    // Initialize
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => {
  subscription?.unsubscribe?.();
};
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, session, user }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
};
