'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase } from '@/lib/supabase/client';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email:string,password:string)=>Promise<string | null>;
  signUp: (email:string,password:string)=>Promise<string | null>;
  signOut: ()=>Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [loading,setLoading] = useState(hasSupabaseEnv);

  useEffect(()=>{
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(({data})=>{ setUser(data.user); setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user ?? null));
    return ()=>subscription.unsubscribe();
  },[]);

  const value = useMemo<AuthCtx>(()=>({
    user, loading, configured: hasSupabaseEnv,
    async signIn(email,password) {
      if (!supabase) return null;
      const {error}=await supabase.auth.signInWithPassword({email,password});
      return error?.message ?? null;
    },
    async signUp(email,password) {
      if (!supabase) return null;
      const {error}=await supabase.auth.signUp({email,password});
      return error?.message ?? null;
    },
    async signOut() { if (supabase) await supabase.auth.signOut(); }
  }),[user,loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
