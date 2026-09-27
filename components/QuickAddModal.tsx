'use client';
import { useState } from 'react';
import { X } from './icons';
import { GoldButton, NeuButton } from './Neu';
import { useProject } from './ProjectProvider';

export function QuickAddModal({open,onClose}:{open:boolean;onClose:()=>void}){
  const {state,addTask,addGrade}=useProject();
  const [mode,setMode]=useState<'task'|'grade'>('task'); const [title,setTitle]=useState(''); const [subjectId,setSubjectId]=useState(''); const [date,setDate]=useState(''); const [score,setScore]=useState('');
  if(!open)return null;
  async function save(){
    if(mode==='task'){
      if(!title.trim())return;
      await addTask({subjectId:subjectId||null,title:title.trim(),details:null,kind:'homework',dueAt:date?new Date(`${date}T20:00:00`).toISOString():null,plannedStart:null,durationMin:45,status:'todo',quadrant:'schedule',priority:2});
    } else {
      if(!subjectId||!score)return;
      await addGrade({subjectId,title:title||'Évaluation',score:Number(score),outOf:20,coefficient:1,takenAt:new Date().toISOString()});
    }
    setTitle('');setSubjectId('');setDate('');setScore('');onClose();
  }
  return <div className="overlay" onMouseDown={onClose}><div className="form-modal neu-card" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-title"><div><span className="eyebrow">AJOUT RAPIDE</span><h2>{mode==='task'?'Nouveau travail':'Nouveau résultat'}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
    <div className="segmented"><button className={mode==='task'?'selected':''} onClick={()=>setMode('task')}>Travail</button><button className={mode==='grade'?'selected':''} onClick={()=>setMode('grade')}>Résultat</button></div>
    <label>Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Aucune</option>{state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>{mode==='task'?'Consigne':'Évaluation'}<input value={title} onChange={e=>setTitle(e.target.value)} placeholder={mode==='task'?'Exercices 7 à 12':'DS Suites'}/></label>
    {mode==='task'?<label>Échéance<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>:<label>Note / 20<input type="number" min="0" max="20" step="0.1" value={score} onChange={e=>setScore(e.target.value)}/></label>}
    <div className="modal-actions"><NeuButton onClick={onClose}>Annuler</NeuButton><GoldButton onClick={save}>Enregistrer</GoldButton></div>
  </div></div>
}
