'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type World = 'academic' | 'finance';

type WorldContextValue = {
  world: World;
  setWorld: (world: World) => void;
  toggleWorld: () => void;
};

const WorldContext = createContext<WorldContextValue | null>(null);
const WORLD_KEY = 'project-white-world';

export function WorldProvider({children}:{children:React.ReactNode}){
  const [world,setWorldState]=useState<World>('academic');

  useEffect(()=>{
    const saved=localStorage.getItem(WORLD_KEY);
    if(saved==='finance' || saved==='academic') setWorldState(saved);
  },[]);

  function setWorld(next:World){
    setWorldState(next);
    localStorage.setItem(WORLD_KEY,next);
  }

  const value=useMemo(()=>({
    world,
    setWorld,
    toggleWorld:()=>setWorld(world==='academic'?'finance':'academic')
  }),[world]);

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld(){
  const value=useContext(WorldContext);
  if(!value) throw new Error('useWorld must be used inside WorldProvider');
  return value;
}
