'use client';
import { Sigma, FlaskConical, BookOpen, FileText, Leaf, Home, CalendarDays, BriefcaseBusiness, Clock3, Plus, Search, Settings, UserRound, ChevronRight, Command, CircleDot, Play, Pause, RotateCcw, Check, AlertCircle, Download, Target, LogOut, X, Link as LinkIcon, Upload, NotebookTabs, GraduationCap } from 'lucide-react';

export { Sigma, FlaskConical, BookOpen, FileText, Leaf, Home, CalendarDays, BriefcaseBusiness, Clock3, Plus, Search, Settings, UserRound, ChevronRight, Command, CircleDot, Play, Pause, RotateCcw, Check, AlertCircle, Download, Target, LogOut, X, LinkIcon, Upload, NotebookTabs, GraduationCap };

export function SubjectIcon({icon,size=26}:{icon:string;size?:number}) {
  const p={size,strokeWidth:1.65};
  if(icon==='flask') return <FlaskConical {...p}/>;
  if(icon==='book') return <BookOpen {...p}/>;
  if(icon==='file') return <FileText {...p}/>;
  if(icon==='leaf') return <Leaf {...p}/>;
  return <Sigma {...p}/>;
}
