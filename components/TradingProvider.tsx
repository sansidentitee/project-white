'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase/client';

export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed';

export type Trade = {
  id: string;
  asset: string;
  direction: TradeDirection;
  entry: number;
  exit?: number | null;
  quantity: number;
  status: TradeStatus;
  setup?: string | null;
  note?: string | null;
  openedAt: string;
  closedAt?: string | null;
};

type NewTrade = Omit<Trade,'id'|'openedAt'|'closedAt'|'status'> & { openedAt?: string };
type TradingContextValue = {
  trades: Trade[];
  loading: boolean;
  demoMode: boolean;
  addTrade: (trade:NewTrade)=>Promise<void>;
  closeTrade: (id:string,exit:number)=>Promise<void>;
  removeTrade: (id:string)=>Promise<void>;
  refresh: ()=>Promise<void>;
};

const Ctx = createContext<TradingContextValue | null>(null);
const LOCAL_KEY='project-white-trading-v1';

function readLocal():Trade[]{
  if(typeof window==='undefined') return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function saveLocal(trades:Trade[]){ if(typeof window!=='undefined') localStorage.setItem(LOCAL_KEY,JSON.stringify(trades)); }
function fromDb(x:any):Trade {
  return {
    id:x.id, asset:x.asset, direction:x.direction, entry:Number(x.entry),
    exit:x.exit===null?null:Number(x.exit), quantity:Number(x.quantity),
    status:x.status, setup:x.setup, note:x.note, openedAt:x.opened_at, closedAt:x.closed_at
  };
}

export function tradePnl(trade:Trade){
  if(trade.status!=='closed' || trade.exit==null) return 0;
  const raw=(trade.exit-trade.entry)*trade.quantity;
  return trade.direction==='long'?raw:-raw;
}

export function TradingProvider({children}:{children:React.ReactNode}){
  const {user,configured,loading:authLoading}=useAuth();
  const demoMode=!configured;
  const [trades,setTrades]=useState<Trade[]>([]);
  const [loading,setLoading]=useState(true);

  const refresh=useCallback(async()=>{
    if(authLoading) return;
    setLoading(true);
    if(!configured || !supabase){ setTrades(readLocal()); setLoading(false); return; }
    if(!user){ setTrades([]); setLoading(false); return; }
    const {data,error}=await supabase.from('trades').select('*').order('opened_at',{ascending:false});
    if(error){ console.error(error); setLoading(false); return; }
    setTrades((data??[]).map(fromDb));
    setLoading(false);
  },[user,configured,authLoading]);

  useEffect(()=>{refresh()},[refresh]);

  async function addTrade(input:NewTrade){
    const trade:Trade={
      ...input,id:crypto.randomUUID(),status:'open',
      openedAt:input.openedAt || new Date().toISOString(),closedAt:null,exit:input.exit??null
    };
    if(demoMode || !supabase || !user){
      setTrades(prev=>{const next=[trade,...prev];saveLocal(next);return next;});
      return;
    }
    const {data,error}=await supabase.from('trades').insert({
      user_id:user.id,asset:trade.asset,direction:trade.direction,entry:trade.entry,
      quantity:trade.quantity,status:'open',setup:trade.setup,note:trade.note,opened_at:trade.openedAt
    }).select('*').single();
    if(error) throw error;
    setTrades(prev=>[fromDb(data),...prev]);
  }

  async function closeTrade(id:string,exit:number){
    const closedAt=new Date().toISOString();
    if(demoMode || !supabase || !user){
      setTrades(prev=>{const next=prev.map(t=>t.id===id?{...t,exit,status:'closed' as const,closedAt}:t);saveLocal(next);return next;});
      return;
    }
    const {error}=await supabase.from('trades').update({exit,status:'closed',closed_at:closedAt}).eq('id',id);
    if(error) throw error;
    setTrades(prev=>prev.map(t=>t.id===id?{...t,exit,status:'closed',closedAt}:t));
  }

  async function removeTrade(id:string){
    if(demoMode || !supabase || !user){
      setTrades(prev=>{const next=prev.filter(t=>t.id!==id);saveLocal(next);return next;});
      return;
    }
    const {error}=await supabase.from('trades').delete().eq('id',id);
    if(error) throw error;
    setTrades(prev=>prev.filter(t=>t.id!==id));
  }

  const value=useMemo(()=>({trades,loading,demoMode,addTrade,closeTrade,removeTrade,refresh}),[trades,loading,demoMode,refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrading(){
  const value=useContext(Ctx);
  if(!value) throw new Error('useTrading must be used inside TradingProvider');
  return value;
}
