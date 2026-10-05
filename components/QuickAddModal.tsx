'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useProject } from './ProjectProvider';

export function QuickAddModal({open,onClose}:{open:boolean;onClose:()=>void}) {
  const {state,addTask,addGrade} = useProject();
  const [mode,setMode] = useState<'task'|'grade'>('task');
  const [title,setTitle] = useState('');
  const [subjectId,setSubjectId] = useState('');
  const [date,setDate] = useState('');
  const [score,setScore] = useState('');

  if(!open) return null;

  async function save() {
    if(mode === 'task') {
      if(!title.trim()) return;
      await addTask({
        subjectId:subjectId || null,
        title:title.trim(),
        details:null,
        kind:'homework',
        dueAt:date ? new Date(date + 'T20:00:00').toISOString() : null,
        plannedStart:null,
        durationMin:45,
        status:'todo',
        quadrant:'schedule',
        priority:2
      });
    } else {
      if(!subjectId || !score) return;
      await addGrade({
        subjectId,
        title:title.trim() || 'Évaluation',
        score:Number(score),
        outOf:20,
        coefficient:1,
        takenAt:new Date().toISOString()
      });
    }
    setTitle(''); setSubjectId(''); setDate(''); setScore(''); onClose();
  }

  return (
    <div className="os-overlay" onMouseDown={onClose}>
      <div className="os-modal" onMouseDown={e=>e.stopPropagation()}>
        <div className="os-modal-head">
          <div><small>AJOUT RAPIDE</small><h2>{mode === 'task' ? 'Nouvelle tâche' : 'Nouvelle note'}</h2></div>
          <button className="os-icon-button" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="os-segmented">
          <button className={mode === 'task' ? 'selected' : ''} onClick={()=>setMode('task')}>Tâche</button>
          <button className={mode === 'grade' ? 'selected' : ''} onClick={()=>setMode('grade')}>Note</button>
        </div>
        <label className="os-field">Matière
          <select value={subjectId} onChange={e=>setSubjectId(e.target.value)}>
            <option value="">Aucune</option>
            {state.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="os-field">{mode === 'task' ? 'Consigne' : 'Évaluation'}
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={mode === 'task' ? 'Exercices 12 à 16' : 'DS Suites'}/>
        </label>
        {mode === 'task'
          ? <label className="os-field">Échéance<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          : <label className="os-field">Note / 20<input type="number" min="0" max="20" step="0.1" value={score} onChange={e=>setScore(e.target.value)}/></label>
        }
        <div className="os-modal-actions">
          <button className="os-button" onClick={onClose}>Annuler</button>
          <button className="os-button primary" onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
