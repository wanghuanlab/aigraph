import type { Question } from '../api';

export const EXAM_DURATION_MS = 120 * 60 * 1000;

const BANK_GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'] as const;
const EXAM_GROUPS = [
  { groups: ['1.1', '1.2'], points: 25 },
  { groups: ['2.1'], points: 15 },
  { groups: ['2.2'], points: 20 },
  { groups: ['3.1'], points: 15 },
  { groups: ['3.2'], points: 20 },
  { groups: ['4.1', '4.2'], points: 5 },
] as const;

export interface ExamSession {
  id: string;
  schemaVersion: 1;
  bankVersion: string;
  mode: 'practice' | 'exam';
  status: 'active' | 'submitted';
  questionIds: string[];
  currentQuestionId: string;
  startedAt: number;
  updatedAt: number;
  deadlineAt?: number;
  submittedAt?: number;
  submissionReason?: 'manual' | 'timeout';
  answers: Record<string, Record<string, { text: string; fileIds: string[] }>>;
  markedQuestionIds: string[];
  assessment?: {
    total: number;
    maxTotal: number;
    provider?: string;
    items: Array<{ questionId: string; suggestedPoints: number; maxPoints: number; reason?: string }>;
  };
}

export function validateQuestionBank(questions: Question[]): void {
  const expectedIds = new Set(BANK_GROUPS.flatMap((group) =>
    Array.from({ length: 5 }, (_, index) => `${group}.${index + 1}`),
  ));
  if (questions.length !== expectedIds.size) throw new Error('实操题库应包含 1.1.1 至 4.2.5 的全部 40 道题。');
  for (const question of questions) {
    if (!expectedIds.delete(question.id)) throw new Error(`题库中存在重复或无效题号：${question.id}`);
    const groupId = question.id.split('.').slice(0, 2).join('.');
    if (question.groupId !== groupId) throw new Error(`题目 ${question.id} 的分类与题号不一致。`);
    const rule = EXAM_GROUPS.find((item) => (item.groups as readonly string[]).includes(groupId));
    if (question.points !== rule?.points) throw new Error(`题目 ${question.id} 的分值应为 ${rule?.points} 分。`);
  }
}

function compareQuestionIds(a: Question, b: Question): number {
  const left = a.id.split('.').map(Number);
  const right = b.id.split('.').map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

export function createSession(mode: 'practice' | 'exam', questions: Question[], bankVersion: string, now = Date.now()): ExamSession {
  validateQuestionBank(questions);
  if (!bankVersion.trim()) throw new Error('题库版本不能为空。');
  const sorted = [...questions].sort(compareQuestionIds);
  const selected = mode === 'practice' ? sorted : EXAM_GROUPS.map((rule) => {
    const pool = sorted.filter((question) => (rule.groups as readonly string[]).includes(question.groupId));
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const questionIds = selected.map((question) => question.id);
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    bankVersion,
    mode,
    status: 'active',
    questionIds,
    currentQuestionId: questionIds[0],
    startedAt: now,
    updatedAt: now,
    ...(mode === 'exam' ? { deadlineAt: now + EXAM_DURATION_MS } : {}),
    answers: {},
    markedQuestionIds: [],
  };
}

export function remainingMilliseconds(session: ExamSession, now = Date.now()): number {
  if (session.mode !== 'exam' || session.deadlineAt === undefined) return 0;
  const effectiveNow = session.status === 'submitted' ? session.submittedAt ?? now : now;
  return Math.max(0, session.deadlineAt - effectiveNow);
}

export function isSessionExpired(session: ExamSession, now = Date.now()): boolean {
  return session.mode === 'exam' && session.status === 'active' && session.deadlineAt !== undefined && now >= session.deadlineAt;
}

export function submitSession(session: ExamSession, reason: 'manual' | 'timeout', now = Date.now()): ExamSession {
  if (session.status === 'submitted') return session;
  const expired = isSessionExpired(session, now);
  if (reason === 'timeout' && !expired) throw new Error('当前练习或考试尚未到期，不能自动交卷。');
  return {
    ...session,
    status: 'submitted',
    submittedAt: expired ? session.deadlineAt : now,
    updatedAt: now,
    submissionReason: expired ? 'timeout' : 'manual',
  };
}

export function questionStatus(question: Question, session: ExamSession): 'empty' | 'partial' | 'complete' {
  const answers = session.answers[question.id] ?? {};
  const fields = question.answerSections.flatMap((section) => section.fields);
  const filled = (field: typeof fields[number]) => {
    const answer = answers[field.id];
    return field.kind === 'file' ? Boolean(answer?.fileIds.length) : Boolean(answer?.text.trim());
  };
  if (!fields.some(filled)) return 'empty';
  return fields.filter((field) => field.required !== false).every(filled) ? 'complete' : 'partial';
}

const STORAGE = 'aigraph-open-sessions';

export function rememberSession(session: ExamSession) {
  const all = readSessions();
  all[session.id] = session;
  sessionStorage.setItem(STORAGE, JSON.stringify(all));
}

export function readSession(id: string): ExamSession | null {
  return readSessions()[id] ?? null;
}

function readSessions(): Record<string, ExamSession> {
  try { return JSON.parse(sessionStorage.getItem(STORAGE) || '{}'); }
  catch { return {}; }
}
