import type { ExamRecord, TheoryQuestion } from '../api';

const STORAGE_KEY = 'aigraph-theory-sessions';
export const THEORY_DURATION_MS = 90 * 60 * 1000;

export interface TheorySession {
  id: string;
  mode: 'theory' | 'theory-practice';
  status: 'active' | 'submitted';
  startedAt: number;
  updatedAt: number;
  deadlineAt?: number;
  submittedAt?: number;
  submissionReason?: 'manual' | 'timeout';
  questionIds: string[];
  answers: Record<string, string[]>;
  markedQuestionIds: string[];
  assessment?: ExamRecord['assessment'];
}

export function choicesOf(question: TheoryQuestion) {
  if (question.kind === 'judge') return [{ key: '正确', text: '正确' }, { key: '错误', text: '错误' }];
  return question.options as Array<{ key: string; text: string }>;
}

export function createTheorySession(mode: TheorySession['mode'], questions: TheoryQuestion[]): TheorySession {
  const picked = mode === 'theory'
    ? [
      ...draw(questions.filter((item) => item.kind === 'judge'), 40),
      ...draw(questions.filter((item) => item.kind === 'single'), 140),
      ...draw(questions.filter((item) => item.kind === 'multi'), 10),
    ]
    : [
      ...questions.filter((item) => item.kind === 'judge'),
      ...questions.filter((item) => item.kind === 'single'),
      ...questions.filter((item) => item.kind === 'multi'),
    ];
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    mode,
    status: 'active',
    startedAt: now,
    updatedAt: now,
    deadlineAt: mode === 'theory' ? now + THEORY_DURATION_MS : undefined,
    questionIds: picked.map((item) => item.id),
    answers: {},
    markedQuestionIds: [],
  };
}

export function toExamPayload(session: TheorySession) {
  const answers: Record<string, { choice: { text: string } }> = {};
  for (const [id, selected] of Object.entries(session.answers)) {
    if (selected.length) answers[id] = { choice: { text: selected.join(',') } };
  }
  return {
    id: session.id,
    mode: session.mode,
    status: session.status,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    submittedAt: session.submittedAt,
    submissionReason: session.submissionReason,
    questionIds: session.questionIds,
    answers,
    markedQuestionIds: session.markedQuestionIds,
  };
}

export function sessionFromRecord(exam: ExamRecord): TheorySession | null {
  if (exam.mode !== 'theory' && exam.mode !== 'theory-practice') return null;
  const answers: Record<string, string[]> = {};
  for (const [id, fields] of Object.entries(exam.answers || {})) {
    const text = fields.choice?.text || '';
    if (text) answers[id] = text.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  }
  return {
    id: exam.id,
    mode: exam.mode,
    status: exam.status,
    startedAt: exam.startedAt,
    updatedAt: exam.updatedAt,
    deadlineAt: exam.mode === 'theory' && exam.status === 'active' ? exam.startedAt + THEORY_DURATION_MS : undefined,
    submittedAt: exam.submittedAt,
    submissionReason: exam.submissionReason,
    questionIds: exam.questionIds,
    answers,
    markedQuestionIds: exam.markedQuestionIds || [],
    assessment: exam.assessment,
  };
}

export function rememberTheory(session: TheorySession) {
  const all = readAll();
  all[session.id] = session;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function readTheory(id: string): TheorySession | null {
  return readAll()[id] || null;
}

function readAll(): Record<string, TheorySession> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, TheorySession> : {};
  } catch {
    return {};
  }
}

function draw<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy.slice(0, count);
}
