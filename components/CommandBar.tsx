'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, Command, FileText, Home, Plus, Search, X } from './icons';
import { useProject } from './ProjectProvider';
import { parsePronoteText } from '@/lib/parser';

export function CommandBar({open,onClose,onQuickAdd}:{open:boolean;onClose:()=>void;onQuickAdd:()=>void}){
  const [q,setQ]=useState(''); const router=useRouter(); const {state,addTask}=useProject();
  const actions=useMemo(()=>[
    ['Aujourd’hui','/today',Home],['Planning','/planning',CalendarDays],['Matières','/subjects',BookOpen],['Travail','/work',FileText]
  ] as const,[]);
  if(!open) return null;
  async function submit(){
    const v=q.trim(); if(!v)return;
    if(/^ajouter\s+/i.test(v)){
      const raw=v.replace(/^ajouter\s+/i,''); const parsed=parsePronoteText(raw,state.subjects)[0]; if(parsed) await addTask(parsed); onClose(); return;
    }
    const match=actions.find(a=>a[0].toLowerCase().includes(v.toLowerCase())); if(match){router.push(match[1]);onClose();}
  }
  return <div className="overlay" onMouseDown={onClose}><div className="command-modal" onMouseDown={e=>e.stopPropagation()}>
    <div className="command-input"><Search size={20}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}} placeholder="Rechercher ou écrire : ajouter maths ex 1-5 jeudi"/><button onClick={onClose}><X size={18}/></button></div>
    <div className="command-help"><Command size={16}/> Navigation et ajout instantané</div>
    <div className="command-list">
      {actions.filter(a=>!q||a[0].toLowerCase().includes(q.toLowerCase())).map(([label,href,Icon])=><button key={href} onClick={()=>{router.push(href);onClose();}}><span className="cmd-icon"><Icon size={18}/></span>{label}<span>↵</span></button>)}
      <button onClick={onQuickAdd}><span className="cmd-icon"><Plus size={18}/></span>Ajouter un élément<span>+</span></button>
    </div>
  </div></div>
}
