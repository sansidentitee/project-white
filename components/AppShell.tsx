'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CalendarDays, Home, BookOpen, FileText, Settings, Search, Plus, LayoutDashboard,
  TrendingUp, Moon, Sun, Target, NotebookTabs, BriefcaseBusiness
} from './icons';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { useWorld } from './WorldProvider';
import { CommandBar } from './CommandBar';
import { QuickAddModal } from './QuickAddModal';

const academicNav=[
  {href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
  {href:'/subjects',label:'Matières',icon:BookOpen},
  {href:'/today',label:'Devoirs',icon:FileText},
  {href:'/work',label:'Révisions',icon:NotebookTabs},
  {href:'/subjects',label:'Notes',icon:TrendingUp},
  {href:'/planning',label:'Planning',icon:CalendarDays},
  {href:'/subjects',label:'Ressources',icon:BookOpen},
  {href:'/dashboard',label:'Objectifs',icon:Target},
];

const financeNav=[
  {href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
  {href:'/trading',label:'Trading',icon:TrendingUp},
  {href:'/finance/analyses',label:'Analyses',icon:BriefcaseBusiness},
  {href:'/finance/journal',label:'Journal',icon:NotebookTabs},
  {href:'/finance/planning',label:'Planification',icon:CalendarDays},
  {href:'/finance/resources',label:'Ressources',icon:BookOpen},
  {href:'/finance/goals',label:'Objectifs',icon:Target},
];

export function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const router=useRouter();
  const {user,configured,loading}=useAuth();
  const {theme,toggleTheme}=useTheme();
  const {world,setWorld}=useWorld();
  const [command,setCommand]=useState(false);
  const [quick,setQuick]=useState(false);
  const nav=world==='academic'?academicNav:financeNav;

  useEffect(()=>{
    if(!loading && configured && !user && path!='/login') router.replace('/login');
  },[loading,configured,user,path,router]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setCommand(true);}
      if(e.key==='Escape'){setCommand(false);setQuick(false);}
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[]);

  if(loading || (configured && !user)) return <div className="page-loader">Project White</div>;

  return <div className="app-shell pw-shell">
    <aside className="sidebar pw-sidebar">
      <Link href="/dashboard" className="brand pw-brand"><span className="brand-orb"/>project white <small>PRO</small></Link>
      <nav className="pw-nav">
        {nav.map(({href,label,icon:Icon},index)=>{
          const active=(path===href||path.startsWith(href+'/')) && (index===0 || !nav.slice(0,index).some(x=>x.href===href));
          return <Link key={`${world}-${label}`} href={href} className={`nav-item ${active?'active':''}`}>
            <Icon size={18}/><span>{label}</span>
          </Link>
        })}
      </nav>
      <div className="sidebar-bottom pw-side-bottom">
        <div className="motivation-card"><div className="mountain-mark"/><span>Discipline<br/>aujourd’hui,<br/>liberté demain.</span></div>
        <Link className="profile-card" href="/settings"><span className="profile-orb"/><span><strong>Alexandre</strong><small>Compte Pro</small></span><span>›</span></Link>
      </div>
    </aside>

    <div className="main-wrap">
      <header className="topbar pw-topbar">
        <button className="search-pill pw-search" onClick={()=>setCommand(true)}><Search size={17}/><span>{world==='academic'?'Rechercher une matière, un devoir, une ressource...':'Rechercher un actif, une analyse, une ressource...'}</span></button>
        <div className="world-switch" role="tablist" aria-label="Changer de monde">
          <button className={world==='academic'?'selected':''} onClick={()=>{setWorld('academic');router.push('/dashboard')}}><BookOpen size={16}/>Monde académique</button>
          <button className={world==='finance'?'selected':''} onClick={()=>{setWorld('finance');router.push('/dashboard')}}><TrendingUp size={16}/>Monde financier</button>
        </div>
        <button className="icon-button theme-toggle" aria-label="Changer de thème" onClick={toggleTheme}>{theme==='light'?<Moon size={17}/>:<Sun size={17}/>}</button>
        <Link href="/settings" className="avatar pw-avatar">A</Link>
      </header>
      <main>{children}</main>
      <button className="floating-add" aria-label="Ajouter" onClick={()=>setQuick(true)}><Plus size={24}/></button>
    </div>

    <CommandBar open={command} onClose={()=>setCommand(false)} onQuickAdd={()=>{setCommand(false);setQuick(true)}}/>
    <QuickAddModal open={quick} onClose={()=>setQuick(false)}/>
  </div>;
}
