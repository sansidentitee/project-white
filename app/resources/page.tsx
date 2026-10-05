'use client';

import { useState } from 'react';
import { FileUp, FolderOpen, Link as LinkIcon } from 'lucide-react';
import { PageFrame } from '@/components/PageFrame';
import { useProject } from '@/components/ProjectProvider';

export default function ResourcesPage() {
  const {state,uploadResource,addResource}=useProject();
  const [subjectId,setSubjectId]=useState(state.subjects[0]?.id || '');
  const [url,setUrl]=useState('');
  const [title,setTitle]=useState('');

  async function addLink(){
    if(!subjectId || !url.trim() || !title.trim()) return;
    await addResource({subjectId,title:title.trim(),url:url.trim(),kind:'link'});
    setUrl('');setTitle('');
  }

  return <PageFrame>
    <div className="os-page-title"><h1>Ressources</h1><p>Un endroit unique pour les fichiers et liens utiles.</p></div>
    <div className="os-two-columns">
      <section className="os-card">
        <div className="os-card-head"><div><FolderOpen size={18}/><h2>Bibliothèque</h2></div><span className="os-card-meta">{state.resources.length}</span></div>
        <div className="os-resource-list">
          {state.resources.length ? state.resources.map(r=><a key={r.id} href={r.url} target="_blank" rel="noreferrer"><span>{r.kind==='file'?<FileUp size={17}/>:<LinkIcon size={17}/>}</span><strong>{r.title}</strong></a>) : <div className="os-empty">Aucune ressource enregistrée.</div>}
        </div>
      </section>
      <section className="os-card">
        <div className="os-card-head"><div><FileUp size={18}/><h2>Ajouter</h2></div></div>
        <label className="os-field">Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="os-field">Titre<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Cours chapitre 2"/></label>
        <label className="os-field">Lien<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/></label>
        <button className="os-button primary full" onClick={addLink}>Ajouter le lien</button>
        <label className="os-upload">Ou déposer un fichier<input type="file" onChange={async e=>{const f=e.target.files?.[0];if(f&&subjectId)await uploadResource(subjectId,f)}}/></label>
      </section>
    </div>
  </PageFrame>;
}
