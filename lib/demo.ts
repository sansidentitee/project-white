import { ProjectState } from './types';

const today = new Date();
const iso = (d: Date) => d.toISOString();
const plusDays = (n: number, hour = 18) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return iso(d);
};
const id = (s: string) => `demo-${s}`;

export const demoState: ProjectState = {
  subjects: [
    { id: id('math'), name: 'Mathématiques', shortName: 'Maths', icon: 'sigma' },
    { id: id('pc'), name: 'Physique-Chimie', shortName: 'PC', icon: 'flask' },
    { id: id('expert'), name: 'Maths expertes', shortName: 'Expert', icon: 'sigma' },
    { id: id('history'), name: 'Histoire', shortName: 'Histoire', icon: 'book' },
    { id: id('philo'), name: 'Philosophie', shortName: 'Philo', icon: 'file' },
    { id: id('svt'), name: 'SVT', shortName: 'SVT', icon: 'leaf' }
  ],
  chapters: [
    { id: id('c1'), subjectId: id('math'), title: 'Suites numériques', status: 'solid' },
    { id: id('c2'), subjectId: id('math'), title: 'Récurrence', status: 'reinforce' },
    { id: id('c3'), subjectId: id('pc'), title: 'Radioactivité', status: 'reinforce' },
    { id: id('c4'), subjectId: id('expert'), title: 'Nombres complexes', status: 'learning' },
    { id: id('c5'), subjectId: id('history'), title: 'La guerre froide', status: 'solid' },
    { id: id('c6'), subjectId: id('philo'), title: 'La liberté', status: 'learning' },
    { id: id('c7'), subjectId: id('svt'), title: 'Le système nerveux', status: 'learning' }
  ],
  tasks: [
    { id: id('t1'), subjectId: id('expert'), title: 'Nombres complexes — exercices 7 à 12', kind: 'study', dueAt: plusDays(2, 8), plannedStart: plusDays(0, 18), durationMin: 45, status: 'todo', quadrant: 'do', priority: 4 },
    { id: id('t2'), subjectId: id('pc'), title: 'Exercices sur la radioactivité', kind: 'homework', dueAt: plusDays(4, 8), plannedStart: plusDays(0, 19), durationMin: 40, status: 'todo', quadrant: 'schedule', priority: 3 },
    { id: id('t3'), subjectId: id('history'), title: 'Fiche de révision — La guerre froide', kind: 'study', dueAt: plusDays(7, 8), plannedStart: plusDays(1, 18), durationMin: 30, status: 'partial', quadrant: 'schedule', priority: 2 },
    { id: id('t4'), subjectId: id('philo'), title: 'Dissertation : La liberté', kind: 'homework', dueAt: plusDays(9, 8), plannedStart: plusDays(2, 18), durationMin: 90, status: 'todo', quadrant: 'schedule', priority: 3 },
    { id: id('t5'), subjectId: id('math'), title: 'Contrôle — Suites', kind: 'exam', dueAt: plusDays(8, 8), durationMin: 60, status: 'todo', quadrant: 'schedule', priority: 4 }
  ],
  grades: [
    { id: id('g1'), subjectId: id('math'), title: 'DS Suites', score: 18, outOf: 20, coefficient: 2, takenAt: plusDays(-14) },
    { id: id('g2'), subjectId: id('math'), title: 'Récurrence', score: 16, outOf: 20, coefficient: 1, takenAt: plusDays(-8) },
    { id: id('g3'), subjectId: id('pc'), title: 'Mouvements', score: 13.8, outOf: 20, coefficient: 1, takenAt: plusDays(-9) },
    { id: id('g4'), subjectId: id('expert'), title: 'Complexes', score: 16.1, outOf: 20, coefficient: 1, takenAt: plusDays(-5) },
    { id: id('g5'), subjectId: id('history'), title: 'Crise de 1929', score: 14, outOf: 20, coefficient: 1, takenAt: plusDays(-12) },
    { id: id('g6'), subjectId: id('philo'), title: 'Dissertation', score: 12.5, outOf: 20, coefficient: 1, takenAt: plusDays(-11) }
  ],
  sessions: [
    { id: id('s1'), taskId: id('t1'), subjectId: id('expert'), startedAt: plusDays(-1, 18), endedAt: plusDays(-1, 18), durationMin: 45, outcome: 'partial' },
    { id: id('s2'), taskId: id('t2'), subjectId: id('pc'), startedAt: plusDays(-2, 19), endedAt: plusDays(-2, 19), durationMin: 30, outcome: 'partial' },
    { id: id('s3'), taskId: id('t3'), subjectId: id('history'), startedAt: plusDays(-4, 18), endedAt: plusDays(-4, 18), durationMin: 25, outcome: 'partial' }
  ],
  resources: []
};
