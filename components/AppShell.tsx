'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight,
  CircleUserRound, Clock3, FolderOpen, GraduationCap, HeartPulse, House, Landmark,
  ListChecks, Moon, Plus, Search, Sparkles, Sun, Target, TriangleAlert
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useProject } from './ProjectProvider';
import { QuickAddModal } from './QuickAddModal';
import { useTheme } from './ThemeProvider';

type Universe = 'academic' | 'islam' | 'finance' | 'health';

const universes = [
  {id:'academic' as const,label:'Académie',href:'/academic/dashboard',icon:GraduationCap},
  {id:'islam' as const,label:'Islam',href:'/islam',icon:Landmark},
  {id:'finance' as const,label:'Finance',href:'/finance',icon:ChartNoAxesColumnIncreasing},
  {id:'health' as const,label:'Santé',href:'/health',icon:HeartPulse}
];

const academicNav = [
  {href:'/academic/dashboard',label:'Vue d’ensemble',icon:House},
  {href:'/academic/grades',label:'Suivi des notes',icon:ChartNoAxesColumnIncreasing},
  {href:'/academic/tasks',label:'Tâches · Eisenhower',icon:ListChecks},
  {href:'/academic/calendar',label:'Calendrier · Agenda',icon:CalendarDays},
  {href:'/academic/subjects',label:'Matières',icon:BookOpen},
  {href:'/academic/errors',label:'Banque d’erreurs',icon:TriangleAlert},
  {href:'/academic/revisions',label:'Révisions · Focus',icon:Clock3},
  {href:'/academic/resources',label:'Ressources',icon:FolderOpen},
  {href:'/academic/goals',label:'Objectifs',icon:Target}
];

function universeFromPath(path:string):Universe {
  if(path.startsWith('/islam')) return 'islam';
  if(path.startsWith('/finance')) return 'finance';
  if(path.startsWith('/health')) return 'health';
  return 'academic';
}

export function AppShell({children}:{children:React.ReactNode}) {
  const path = usePathname();
  const router = useRouter();
  const {user,configured,loading} = useAuth();
  const {state} = useProject();
  const {theme,toggleTheme}=useTheme();
  const [quick,setQuick] = useState(false);
  const [query,setQuery] = useState('');

  useEffect(()=>{
    if(!loading && configured && !user && path !== '/login') router.replace('/login');
  },[loading,configured,user,path,router]);

  const universe = universeFromPath(path);
  const universeMeta = universes.find(x=>x.id===universe)!;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ozan';

  const dueSoon = useMemo(()=>{
    const now=Date.now();
    return state.tasks.filter(t=>{
      if(t.status==='done'||!t.dueAt) return false;
      const d=new Date(t.dueAt).getTime();
      return d>=now-86400000 && d<=now+86400000;
    }).length;
  },[state.tasks]);

  if(loading || (configured && !user)) return <div className="os-loader">Project White</div>;

  function submitSearch(e:FormEvent) {
    e.preventDefault();
    if(universe !== 'academic') return;
    router.push(query.trim()?'/search?q='+encodeURIComponent(query.trim()):'/academic/dashboard');
  }

  return (
    <div className="os-shell universe-shell">
      <aside className="os-sidebar universe-sidebar">
        <Link href="/academic/dashboard" className="os-brand">
          <span className="os-brand-icon"><Sparkles size={18}/></span>
          <span><strong>Project White</strong><small>{universeMeta.label.toUpperCase()} · OS</small></span>
        </Link>

        <div className="universe-current">
          <span className="universe-current-icon"><universeMeta.icon size={18}/></span>
          <span><small>UNIVERS</small><strong>{universeMeta.label}</strong></span>
        </div>

        {universe==='academic' ? (
          <nav className="os-nav academic-side-nav" aria-label="Académie">
            {academicNav.map(({href,label,icon:Icon})=>{
              const active=path===href;
              return <Link key={href} href={href} className={'os-nav-item '+(active?'active':'')}><Icon size={17}/><span>{label}</span></Link>;
            })}
          </nav>
        ) : (
          <div className="universe-placeholder-nav">
            <span className="label">CATÉGORIE</span>
            <div className="placeholder-nav-card">
              <universeMeta.icon size={19}/>
              <strong>Vue d’ensemble</strong>
              <small>Structure prête · développement à venir</small>
            </div>
          </div>
        )}

        <div className="os-sidebar-bottom">
          <div className="sidebar-quick-actions">
            {universe==='academic' && <button className="os-round-button" aria-label="Ajouter rapidement" onClick={()=>setQuick(true)}><Plus size={19}/></button>}
            <button className="os-round-button" aria-label={theme==='light'?'Activer le noir profond':'Activer le blanc glacier'} onClick={toggleTheme}>
              {theme==='light'?<Moon size={18}/>:<Sun size={18}/>}
            </button>
          </div>
          <Link href="/settings" className="os-profile">
            <CircleUserRound size={23}/>
            <span><strong>{displayName}</strong><small>Mon espace</small></span>
            <ChevronRight size={16}/>
          </Link>
        </div>
      </aside>

      <section className="os-main">
        <header className="os-topbar universe-topbar">
          <div className="universe-switch" role="navigation" aria-label="Changer d’univers">
            {universes.map(({id,label,href,icon:Icon})=>(
              <Link key={id} href={href} className={universe===id?'active':''} aria-current={universe===id?'page':undefined}>
                <span><Icon size={17}/></span>
                <b>{label}</b>
              </Link>
            ))}
          </div>

          <div className="topbar-actions">
            {universe==='academic' && (
              <form className="os-search compact-search" onSubmit={submitSearch}>
                <Search size={16}/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher..." aria-label="Rechercher"/>
              </form>
            )}
            <button className="os-icon-button os-bell" aria-label="Notifications" onClick={()=>router.push('/academic/tasks')}>
              <Bell size={18}/>{dueSoon>0&&<span>{dueSoon}</span>}
            </button>
            <Link href="/settings" className="os-avatar" aria-label="Profil"><CircleUserRound size={21}/></Link>
          </div>
        </header>

        <main className="os-content">{children}</main>
        {universe==='academic' && <button className="os-floating-add" aria-label="Ajouter" onClick={()=>setQuick(true)}><Plus size={22}/></button>}
      </section>

      <QuickAddModal open={quick} onClose={()=>setQuick(false)}/>
    </div>
  );
}
