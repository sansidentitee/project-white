'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarDays, Home, BookOpen, FileText, Settings, Search, Plus, LayoutDashboard, TrendingUp, Moon, Sun } from './icons';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { CommandBar } from './CommandBar';
import { QuickAddModal } from './QuickAddModal';

const nav=[
  {href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
  {href:'/trading',label:'Trading',icon:TrendingUp},
  {href:'/today',label:"Aujourd’hui",icon:Home},
  {href:'/planning',label:'Planning',icon:CalendarDays},
  {href:'/subjects',label:'Matières',icon:BookOpen},
  {href:'/work',label:'Travail',icon:FileText},
];

export function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname(); const router=useRouter();
  const {user,configured,loading}=useAuth();
  const {theme,toggleTheme}=useTheme();
  const [command,setCommand]=useState(false); const [quick,setQuick]=useState(false);

  useEffect(()=>{
    if(!loading && configured && !user && path!='/login') router.replace('/login');
  },[loading,configured,user,path,router]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommand(true);}
      if(e.key==='Escape'){setCommand(false);setQuick(false);}
    };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);

  if(loading || (configured && !user)) return <div className="page-loader">Project <span>White</span></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">project white</Link>
      <nav>
        {nav.map(({href,label,icon:Icon})=>{
          const active=path===href||path.startsWith(href+'/');
          return <Link key={href} href={href} className={`nav-item ${active?'active':''}`}>
            <Icon size={20}/><span>{label}</span>{active&&<i/>}
          </Link>
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="quote">Discipline aujourd’hui,<br/>liberté demain.</div>
        <div className="quote-line"/>
        <Link className="mini-link" href="/settings"><Settings size={17}/>Paramètres</Link>
      </div>
    </aside>

    <div className="main-wrap">
      <header className="topbar">
        <button className="search-pill" onClick={()=>setCommand(true)}><Search size={17}/><span>Rechercher</span><kbd>⌘ K</kbd></button>
        <button className="icon-button theme-toggle" aria-label="Changer de thème" onClick={toggleTheme}>
          {theme==='light'?<Moon size={18}/>:<Sun size={18}/>} 
        </button>
        <Link href="/settings" className="avatar">A</Link>
      </header>
      <main>{children}</main>
      <button className="floating-add" aria-label="Ajouter" onClick={()=>setQuick(true)}><Plus size={27}/></button>
    </div>

    <CommandBar open={command} onClose={()=>setCommand(false)} onQuickAdd={()=>{setCommand(false);setQuick(true)}}/>
    <QuickAddModal open={quick} onClose={()=>setQuick(false)}/>
  </div>
}
