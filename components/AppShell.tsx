'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, CalendarDays, CandlestickChart, ChartNoAxesColumnIncreasing, ChevronRight,
  CircleUserRound, FolderOpen, Grid2X2, GraduationCap, HeartPulse, House, Landmark,
  NotebookPen, Plus, Search, Sparkles, SquareCheckBig, Target
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useProject } from './ProjectProvider';
import { QuickAddModal } from './QuickAddModal';

const mainNav = [
  { href:'/dashboard', label:'Accueil', icon:House },
  { href:'/calendar', label:'Calendrier', icon:CalendarDays },
  { href:'/tasks', label:'Tâches', icon:SquareCheckBig },
  { href:'/notes', label:'Notes', icon:NotebookPen },
  { href:'/goals', label:'Objectifs', icon:Target },
  { href:'/tracking', label:'Suivi', icon:ChartNoAxesColumnIncreasing },
  { href:'/resources', label:'Ressources', icon:FolderOpen },
  { href:'/search', label:'Recherche', icon:Search }
];

const spaces = [
  { href:'/academic', label:'Académique', icon:GraduationCap },
  { href:'/deen', label:'Deen', icon:Landmark },
  { href:'/finance', label:'Finance', icon:CandlestickChart },
  { href:'/vitality', label:'Vitalité', icon:HeartPulse },
  { href:'/life', label:'Life', icon:Grid2X2 }
];

export function AppShell({children}:{children:React.ReactNode}) {
  const path = usePathname();
  const router = useRouter();
  const {user,configured,loading} = useAuth();
  const {state} = useProject();
  const [quick,setQuick] = useState(false);
  const [query,setQuery] = useState('');

  useEffect(()=>{
    if(!loading && configured && !user && path !== '/login') router.replace('/login');
  },[loading,configured,user,path,router]);

  if(loading || (configured && !user)) return <div className="os-loader">Project White</div>;

  const now = Date.now();
  const dueSoon = state.tasks.filter(t=>{
    if(t.status === 'done' || !t.dueAt) return false;
    const d = new Date(t.dueAt).getTime();
    return d >= now - 86400000 && d <= now + 86400000;
  }).length;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ozan';

  function submitSearch(e:FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? '/search?q=' + encodeURIComponent(query.trim()) : '/search');
  }

  return (
    <div className="os-shell">
      <aside className="os-sidebar">
        <Link href="/dashboard" className="os-brand">
          <span className="os-brand-icon"><Sparkles size={18}/></span>
          <span><strong>Project White</strong><small>Personal OS</small></span>
        </Link>

        <nav className="os-nav" aria-label="Navigation principale">
          {mainNav.map(({href,label,icon:Icon})=>{
            const active = path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
            return <Link key={href} href={href} className={'os-nav-item ' + (active ? 'active' : '')}><Icon size={18}/><span>{label}</span></Link>;
          })}
        </nav>

        <div className="os-divider"/>

        <nav className="os-nav os-space-nav" aria-label="Espaces">
          {spaces.map(({href,label,icon:Icon})=>{
            const active = path === href || path.startsWith(href + '/');
            return <Link key={href} href={href} className={'os-nav-item os-space-item ' + (active ? 'active' : '')}><Icon size={18}/><span>{label}</span></Link>;
          })}
        </nav>

        <div className="os-sidebar-bottom">
          <button className="os-round-button" aria-label="Ajouter rapidement" onClick={()=>setQuick(true)}><Plus size={19}/></button>
          <Link href="/settings" className="os-profile">
            <CircleUserRound size={23}/>
            <span><strong>{displayName}</strong><small>Mon espace</small></span>
            <ChevronRight size={16}/>
          </Link>
        </div>
      </aside>

      <section className="os-main">
        <header className="os-topbar">
          <form className="os-search" onSubmit={submitSearch}>
            <Search size={18}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher..." aria-label="Rechercher"/>
          </form>
          <button className="os-icon-button os-bell" aria-label="Notifications" onClick={()=>router.push('/tasks')}>
            <Bell size={19}/>{dueSoon > 0 && <span>{dueSoon}</span>}
          </button>
          <Link href="/settings" className="os-avatar" aria-label="Profil"><CircleUserRound size={22}/></Link>
        </header>

        <main className="os-content">{children}</main>
        <button className="os-floating-add" aria-label="Ajouter" onClick={()=>setQuick(true)}><Plus size={22}/></button>
      </section>

      <QuickAddModal open={quick} onClose={()=>setQuick(false)}/>
    </div>
  );
}
