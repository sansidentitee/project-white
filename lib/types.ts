export type TaskStatus = 'todo' | 'partial' | 'blocked' | 'done';
export type TaskKind = 'homework' | 'exam' | 'event' | 'study';
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

export type Subject = {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  createdAt?: string;
};

export type Chapter = {
  id: string;
  subjectId: string;
  title: string;
  status: 'discover' | 'learning' | 'reinforce' | 'solid' | 'mastered';
  createdAt?: string;
};

export type Task = {
  id: string;
  subjectId?: string | null;
  title: string;
  details?: string | null;
  kind: TaskKind;
  dueAt?: string | null;
  plannedStart?: string | null;
  durationMin: number;
  status: TaskStatus;
  quadrant: Quadrant;
  priority: number;
  createdAt?: string;
};

export type Grade = {
  id: string;
  subjectId: string;
  title: string;
  score: number;
  outOf: number;
  coefficient: number;
  takenAt: string;
};

export type WorkSession = {
  id: string;
  taskId?: string | null;
  subjectId?: string | null;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  outcome: 'done' | 'partial' | 'resume' | 'blocked';
};

export type Resource = {
  id: string;
  subjectId: string;
  chapterId?: string | null;
  title: string;
  url: string;
  kind: 'link' | 'file';
  createdAt?: string;
};

export type AcademicError = {
  id: string;
  subjectId?: string | null;
  title: string;
  details?: string | null;
  correction?: string | null;
  status: 'open' | 'review' | 'mastered';
  nextReviewAt?: string | null;
  createdAt?: string;
};

export type AcademicGoal = {
  id: string;
  title: string;
  details?: string | null;
  targetValue?: number | null;
  currentValue: number;
  unit?: string | null;
  dueAt?: string | null;
  status: 'active' | 'done' | 'paused';
  createdAt?: string;
};

export type AcademicPreferences = {
  averageGoal: number;
};

export type ProjectState = {
  subjects: Subject[];
  chapters: Chapter[];
  tasks: Task[];
  grades: Grade[];
  sessions: WorkSession[];
  resources: Resource[];
  errors: AcademicError[];
  goals: AcademicGoal[];
  preferences: AcademicPreferences;
};
