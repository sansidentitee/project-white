'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { demoState } from '@/lib/demo';
import type { AcademicError, Chapter, Grade, ProjectState, Resource, Subject, Task, WorkSession } from '@/lib/types';
import { autoPlan } from '@/lib/scheduler';

const empty: ProjectState = { subjects:[], chapters:[], tasks:[], grades:[], sessions:[], resources:[], errors:[] };
const LOCAL_KEY = 'project-white-state-v1';
const DEFAULT_SUBJECTS = [
  ['Mathématiques','Maths','sigma'],
  ['Physique-Chimie','PC','flask'],
  ['Maths expertes','Expert','sigma'],
  ['Histoire-Géographie','H-G','book'],
  ['Philosophie','Philo','file'],
  ['Anglais','Anglais','languages'],
  ['Espagnol','Espagnol','languages'],
  ['Enseignement scientifique','Ens. sci.','atom']
] as const;

type ProjectCtx = {
  state: ProjectState;
  loading: boolean;
  demoMode: boolean;
  refresh: ()=>Promise<void>;
  addTask: (task:Omit<Task,'id'>)=>Promise<Task>;
  updateTask: (id:string, patch:Partial<Task>)=>Promise<void>;
  removeTask: (id:string)=>Promise<void>;
  addGrade: (grade:Omit<Grade,'id'>)=>Promise<void>;
  addChapter: (chapter:Omit<Chapter,'id'>)=>Promise<void>;
  updateChapter: (id:string,patch:Partial<Chapter>)=>Promise<void>;
  addSession: (session:Omit<WorkSession,'id'>)=>Promise<void>;
  addResource: (resource:Omit<Resource,'id'>)=>Promise<void>;
  uploadResource: (subjectId:string,file:File)=>Promise<string>;
  addError: (error:Omit<AcademicError,'id'>)=>Promise<void>;
  updateError: (id:string, patch:Partial<AcademicError>)=>Promise<void>;
  removeError: (id:string)=>Promise<void>;
  organizeWeek: ()=>Promise<void>;
};

const Ctx=createContext<ProjectCtx|null>(null);
const uuid=()=>crypto.randomUUID();

function normalizeLocal(s:any):ProjectState {
  const base = s && typeof s === 'object' ? s : {};
  return {
    subjects:Array.isArray(base.subjects)?base.subjects:[],
    chapters:Array.isArray(base.chapters)?base.chapters:[],
    tasks:Array.isArray(base.tasks)?base.tasks:[],
    grades:Array.isArray(base.grades)?base.grades:[],
    sessions:Array.isArray(base.sessions)?base.sessions:[],
    resources:Array.isArray(base.resources)?base.resources:[],
    errors:Array.isArray(base.errors)?base.errors:[]
  };
}

function localLoad():ProjectState {
  if (typeof window==='undefined') return demoState;
  const raw=localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_KEY,JSON.stringify(demoState));
    return demoState;
  }
  try { return normalizeLocal(JSON.parse(raw)); } catch { return demoState; }
}
function localSave(s:ProjectState){ if(typeof window!=='undefined') localStorage.setItem(LOCAL_KEY,JSON.stringify(s)); }

const dbToSubject=(x:any):Subject=>({id:x.id,name:x.name,shortName:x.short_name,icon:x.icon,createdAt:x.created_at});
const dbToChapter=(x:any):Chapter=>({id:x.id,subjectId:x.subject_id,title:x.title,status:x.status,createdAt:x.created_at});
const dbToTask=(x:any):Task=>({id:x.id,subjectId:x.subject_id,title:x.title,details:x.details,kind:x.kind,dueAt:x.due_at,plannedStart:x.planned_start,durationMin:x.duration_min,status:x.status,quadrant:x.quadrant,priority:x.priority,createdAt:x.created_at});
const dbToGrade=(x:any):Grade=>({id:x.id,subjectId:x.subject_id,title:x.title,score:Number(x.score),outOf:Number(x.out_of),coefficient:Number(x.coefficient),takenAt:x.taken_at});
const dbToSession=(x:any):WorkSession=>({id:x.id,taskId:x.task_id,subjectId:x.subject_id,startedAt:x.started_at,endedAt:x.ended_at,durationMin:x.duration_min,outcome:x.outcome});
const dbToResource=(x:any):Resource=>({id:x.id,subjectId:x.subject_id,chapterId:x.chapter_id,title:x.title,url:x.url,kind:x.kind,createdAt:x.created_at});
const dbToError=(x:any):AcademicError=>({id:x.id,subjectId:x.subject_id,title:x.title,details:x.details,correction:x.correction,status:x.status,nextReviewAt:x.next_review_at,createdAt:x.created_at});

export function ProjectProvider({children}:{children:React.ReactNode}) {
  const {user,configured,loading:authLoading}=useAuth();
  const [state,setState]=useState<ProjectState>(empty);
  const [loading,setLoading]=useState(true);
  const demoMode=!configured;

  const refresh=useCallback(async()=>{
    if (authLoading) return;
    setLoading(true);
    if (!configured || !supabase) { setState(localLoad()); setLoading(false); return; }
    if (!user) { setState(empty); setLoading(false); return; }

    const [s,c,t,g,w,r,e] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at'),
      supabase.from('chapters').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('grades').select('*').order('taken_at',{ascending:false}),
      supabase.from('work_sessions').select('*').order('started_at',{ascending:false}).limit(100),
      supabase.from('resources').select('*').order('created_at',{ascending:false}),
      supabase.from('academic_errors').select('*').order('created_at',{ascending:false})
    ]);

    if (s.error) { console.error(s.error); setLoading(false); return; }

    let subjects=(s.data??[]).map(dbToSubject);
    if (!subjects.length) {
      const rows=DEFAULT_SUBJECTS.map(([name,short_name,icon])=>({user_id:user.id,name,short_name,icon}));
      const inserted=await supabase.from('subjects').insert(rows).select('*');
      subjects=(inserted.data??[]).map(dbToSubject);
    }

    setState({
      subjects,
      chapters:(c.data??[]).map(dbToChapter),
      tasks:(t.data??[]).map(dbToTask),
      grades:(g.data??[]).map(dbToGrade),
      sessions:(w.data??[]).map(dbToSession),
      resources:(r.data??[]).map(dbToResource),
      errors:(e.data??[]).map(dbToError)
    });
    setLoading(false);
  },[user,configured,authLoading]);

  useEffect(()=>{ refresh(); },[refresh]);

  const updateLocal=(fn:(s:ProjectState)=>ProjectState)=>{
    setState(prev=>{
      const next=fn(prev);
      localSave(next);
      return next;
    });
  };

  async function addTask(input:Omit<Task,'id'>) {
    if (demoMode || !supabase || !user) {
      const task={...input,id:uuid()};
      updateLocal(s=>({...s,tasks:[...s.tasks,task]}));
      return task;
    }
    const row={
      user_id:user.id,
      subject_id:input.subjectId,
      title:input.title,
      details:input.details,
      kind:input.kind,
      due_at:input.dueAt,
      planned_start:input.plannedStart,
      duration_min:input.durationMin,
      status:input.status,
      quadrant:input.quadrant,
      priority:input.priority
    };
    const {data,error}=await supabase.from('tasks').insert(row).select('*').single();
    if(error) throw error;
    const task=dbToTask(data);
    setState(s=>({...s,tasks:[...s.tasks,task]}));
    return task;
  }

  async function updateTask(id:string,patch:Partial<Task>) {
    if (demoMode || !supabase || !user) {
      updateLocal(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,...patch}:t)}));
      return;
    }
    const db:any={};
    const map:any={subjectId:'subject_id',dueAt:'due_at',plannedStart:'planned_start',durationMin:'duration_min'};
    Object.entries(patch).forEach(([k,v])=>db[map[k]??k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]=v);
    const {error}=await supabase.from('tasks').update(db).eq('id',id);
    if(error) throw error;
    setState(s=>({...s,tasks:s.tasks.map(t=>t.id===id?{...t,...patch}:t)}));
  }

  async function removeTask(id:string) {
    if (demoMode || !supabase || !user) {
      updateLocal(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id)}));
      return;
    }
    const {error}=await supabase.from('tasks').delete().eq('id',id);
    if(error) throw error;
    setState(s=>({...s,tasks:s.tasks.filter(t=>t.id!==id)}));
  }

  async function addGrade(input:Omit<Grade,'id'>) {
    if (demoMode || !supabase || !user) {
      const x={...input,id:uuid()};
      updateLocal(s=>({...s,grades:[x,...s.grades]}));
      return;
    }
    const {data,error}=await supabase.from('grades').insert({
      user_id:user.id,
      subject_id:input.subjectId,
      title:input.title,
      score:input.score,
      out_of:input.outOf,
      coefficient:input.coefficient,
      taken_at:input.takenAt
    }).select('*').single();
    if(error) throw error;
    setState(s=>({...s,grades:[dbToGrade(data),...s.grades]}));
  }

  async function addChapter(input:Omit<Chapter,'id'>) {
    if (demoMode || !supabase || !user) {
      const x={...input,id:uuid()};
      updateLocal(s=>({...s,chapters:[...s.chapters,x]}));
      return;
    }
    const {data,error}=await supabase.from('chapters').insert({
      user_id:user.id,
      subject_id:input.subjectId,
      title:input.title,
      status:input.status
    }).select('*').single();
    if(error) throw error;
    setState(s=>({...s,chapters:[...s.chapters,dbToChapter(data)]}));
  }

  async function updateChapter(id:string,patch:Partial<Chapter>) {
    if (demoMode || !supabase || !user) {
      updateLocal(s=>({...s,chapters:s.chapters.map(c=>c.id===id?{...c,...patch}:c)}));
      return;
    }
    const db:any={};
    if(patch.title!==undefined) db.title=patch.title;
    if(patch.status!==undefined) db.status=patch.status;
    const {error}=await supabase.from('chapters').update(db).eq('id',id);
    if(error) throw error;
    setState(s=>({...s,chapters:s.chapters.map(c=>c.id===id?{...c,...patch}:c)}));
  }

  async function addSession(input:Omit<WorkSession,'id'>) {
    if (demoMode || !supabase || !user) {
      const x={...input,id:uuid()};
      updateLocal(s=>({...s,sessions:[x,...s.sessions]}));
      return;
    }
    const {data,error}=await supabase.from('work_sessions').insert({
      user_id:user.id,
      task_id:input.taskId,
      subject_id:input.subjectId,
      started_at:input.startedAt,
      ended_at:input.endedAt,
      duration_min:input.durationMin,
      outcome:input.outcome
    }).select('*').single();
    if(error) throw error;
    setState(s=>({...s,sessions:[dbToSession(data),...s.sessions]}));
  }

  async function addResource(input:Omit<Resource,'id'>) {
    if (demoMode || !supabase || !user) {
      const x={...input,id:uuid()};
      updateLocal(s=>({...s,resources:[x,...s.resources]}));
      return;
    }
    const {data,error}=await supabase.from('resources').insert({
      user_id:user.id,
      subject_id:input.subjectId,
      chapter_id:input.chapterId,
      title:input.title,
      url:input.url,
      kind:input.kind
    }).select('*').single();
    if(error) throw error;
    setState(s=>({...s,resources:[dbToResource(data),...s.resources]}));
  }

  async function uploadResource(subjectId:string,file:File) {
    if (!supabase || !user) {
      const url=URL.createObjectURL(file);
      await addResource({subjectId,title:file.name,url,kind:'file'});
      return url;
    }
    const path=`${user.id}/${subjectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const {error}=await supabase.storage.from('resources').upload(path,file);
    if(error) throw error;
    const {data}=supabase.storage.from('resources').getPublicUrl(path);
    await addResource({subjectId,title:file.name,url:data.publicUrl,kind:'file'});
    return data.publicUrl;
  }

  async function addError(input:Omit<AcademicError,'id'>) {
    if (demoMode || !supabase || !user) {
      const x={...input,id:uuid()};
      updateLocal(s=>({...s,errors:[x,...s.errors]}));
      return;
    }
    const {data,error}=await supabase.from('academic_errors').insert({
      user_id:user.id,
      subject_id:input.subjectId,
      title:input.title,
      details:input.details,
      correction:input.correction,
      status:input.status,
      next_review_at:input.nextReviewAt
    }).select('*').single();
    if(error) throw error;
    setState(s=>({...s,errors:[dbToError(data),...s.errors]}));
  }

  async function updateError(id:string,patch:Partial<AcademicError>) {
    if (demoMode || !supabase || !user) {
      updateLocal(s=>({...s,errors:s.errors.map(x=>x.id===id?{...x,...patch}:x)}));
      return;
    }
    const db:any={};
    const map:any={subjectId:'subject_id',nextReviewAt:'next_review_at'};
    Object.entries(patch).forEach(([k,v])=>db[map[k]??k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())]=v);
    const {error}=await supabase.from('academic_errors').update(db).eq('id',id);
    if(error) throw error;
    setState(s=>({...s,errors:s.errors.map(x=>x.id===id?{...x,...patch}:x)}));
  }

  async function removeError(id:string) {
    if (demoMode || !supabase || !user) {
      updateLocal(s=>({...s,errors:s.errors.filter(x=>x.id!==id)}));
      return;
    }
    const {error}=await supabase.from('academic_errors').delete().eq('id',id);
    if(error) throw error;
    setState(s=>({...s,errors:s.errors.filter(x=>x.id!==id)}));
  }

  async function organizeWeek() {
    const planned=autoPlan(state.tasks);
    const changes=planned.filter(t=>t.plannedStart!==state.tasks.find(x=>x.id===t.id)?.plannedStart);
    for(const t of changes) await updateTask(t.id,{plannedStart:t.plannedStart});
  }

  const value=useMemo<ProjectCtx>(()=>({
    state,loading,demoMode,refresh,
    addTask,updateTask,removeTask,
    addGrade,addChapter,updateChapter,
    addSession,addResource,uploadResource,
    addError,updateError,removeError,
    organizeWeek
  }),[state,loading,demoMode,refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProject(){
  const c=useContext(Ctx);
  if(!c) throw new Error('useProject outside provider');
  return c;
}
