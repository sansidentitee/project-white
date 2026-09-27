'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarDays, Home, BookOpen, FileText, Settings, Search, Plus } from './icons';
import { useAuth } from './AuthProvider';
import { CommandBar } from './CommandBar';
import { QuickAddModal } from './QuickAddModal';

const nav=[
  {href:'/today',label:"Aujourd’hui",icon:Home},
  {href:'/planning',label:'Planning',icon:CalendarDays},
  {href:'/subjects',label:'Matières',icon:BookOpen},
  {href:'/work',label:'Travail',icon:FileText},
];

export function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname(); const router=useRouter();
  const {user,configured,loading}=useAuth();
  const [command,setCommand]=useState(false); const [quick,setQuick]=useState(false);
  useEffect(()=>{
    if(!loading && configured && !user && path!='/login') router.replace('/login');
  },[loading,configured,user,path,router]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommand(true);} if(e.key==='Escape'){setCommand(false);setQuick(false);} };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);
  if(loading || (configured && !user)) return <div className="page-loader">Project <span>White</span></div>;
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/today" className="brand">Project <span>White</span></Link>
      <nav>
        {nav.map(({href,label,icon:Icon})=>{const active=path===href||path.startsWith(href+'/'); return <Link key={href} href={href} className={`nav-item ${active?'active':''}`}><Icon size={22}/><span>{label}</span>{active&&<i/>}</Link>})}
      </nav>
      <div className="sidebar-bottom">
        <div className="quote">« Des petits efforts<br/>répétés font de grands<br/>résultats. »</div>
        <div className="quote-line"/>
        <Link className="mini-link" href="/settings"><Settings size={18}/>Paramètres</Link>
      </div>
    </aside>
    <div className="main-wrap">
      <header className="topbar">
        <button className="search-pill" onClick={()=>setCommand(true)}><Search size={18}/><span>Rechercher</span><kbd>Ctrl K</kbd></button>
        <Link href="/settings" className="avatar">A</Link>
      </header>
      <main>{children}</main>
      <button className="floating-add" aria-label="Ajouter" onClick={()=>setQuick(true)}><Plus size={30}/></button>
    </div>
    <CommandBar open={command} onClose={()=>setCommand(false)} onQuickAdd={()=>{setCommand(false);setQuick(true)}}/>
    <QuickAddModal open={quick} onClose={()=>setQuick(false)}/>
  </div>
}
