'use client';
import { PageFrame } from '@/components/PageFrame';
import { NeuCard, GoldButton, NeuButton } from '@/components/Neu';
import { useAuth } from '@/components/AuthProvider';
import { useProject } from '@/components/ProjectProvider';
import { useRouter } from 'next/navigation';
export default function SettingsPage(){const {user,signOut,configured}=useAuth();const {demoMode}=useProject();const router=useRouter();return <PageFrame><div className="page-head"><div><h1>Paramètres</h1><p>Compte et environnement Project White</p></div></div><div className="settings-grid"><NeuCard className="settings-card"><h2>Profil</h2><label>Initiale<input value="A" readOnly/></label><label>E-mail<input value={user?.email||'Mode démo local'} readOnly/></label><p className="muted">L’avatar reste volontairement « A » dans l’interface.</p></NeuCard><NeuCard className="settings-card"><h2>Données</h2><p className="muted">{demoMode?'Les données sont sauvegardées dans le navigateur. Ajoute les variables Supabase pour activer la synchronisation cloud et les comptes.':'Toutes les données sont synchronisées avec Supabase et protégées par RLS.'}</p><div className="modal-actions"><GoldButton onClick={()=>location.reload()}>Actualiser</GoldButton>{configured&&<NeuButton onClick={async()=>{await signOut();router.push('/login')}}>Se déconnecter</NeuButton>}</div></NeuCard></div></PageFrame>}
