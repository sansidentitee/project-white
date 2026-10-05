'use client';
import { PageFrame } from '@/components/PageFrame';
import { NeuCard, GoldButton, NeuButton } from '@/components/Neu';
import { useAuth } from '@/components/AuthProvider';
import { useProject } from '@/components/ProjectProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun } from '@/components/icons';
import { useRouter } from 'next/navigation';

export default function SettingsPage(){
  const {user,signOut,configured}=useAuth();
  const {demoMode}=useProject();
  const {theme,setTheme}=useTheme();
  const router=useRouter();

  return <PageFrame>
    <div className="page-head"><div><h1>Paramètres</h1><p>Compte, apparence et synchronisation.</p></div></div>
    <div className="settings-grid">
      <NeuCard className="settings-card">
        <h2>Profil</h2>
        <label>Initiale<input value="A" readOnly/></label>
        <label>E-mail<input value={user?.email||'Mode démo local'} readOnly/></label>
      </NeuCard>

      <NeuCard className="settings-card">
        <h2>Apparence</h2>
        <p className="muted">Deux apparences complètes : blanc glacier et noir profond, avec les mêmes reliefs neumorphiques.</p>
        <div className="theme-choice">
          <button className={theme==='light'?'selected':''} onClick={()=>setTheme('light')}><Sun size={18}/><span>Blanc givré</span></button>
          <button className={theme==='dark'?'selected':''} onClick={()=>setTheme('dark')}><Moon size={18}/><span>Noir profond</span></button>
        </div>
      </NeuCard>

      <NeuCard className="settings-card">
        <h2>Données</h2>
        <p className="muted">{demoMode?'Les données sont sauvegardées dans le navigateur. Supabase active la synchronisation entre appareils et les comptes.':'Tes données académiques et ton journal de trading sont synchronisés avec Supabase et isolés par compte grâce à RLS.'}</p>
        <div className="modal-actions"><GoldButton onClick={()=>location.reload()}>Actualiser</GoldButton>{configured&&<NeuButton onClick={async()=>{await signOut();router.push('/login')}}>Se déconnecter</NeuButton>}</div>
      </NeuCard>
    </div>
  </PageFrame>
}
