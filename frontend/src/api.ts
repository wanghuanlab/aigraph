export interface PublicUser {
  username: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
}

export interface ExamRecord {
  id: string;
  mode: 'practice' | 'exam' | 'theory' | 'theory-practice';
  status: 'active' | 'submitted';
  startedAt: number;
  updatedAt: number;
  submittedAt?: number;
  submissionReason?: 'manual' | 'timeout';
  questionIds: string[];
  answers: Record<string, Record<string, { text: string }>>;
  markedQuestionIds?: string[];
  assessment?: {
    status: string;
    provider?: string;
    assessedAt?: number;
    total: number;
    maxTotal: number;
    items: Array<{
      questionId: string;
      suggestedPoints?: number;
      maxPoints?: number;
      reason?: string;
      correct?: boolean;
      awarded?: number;
      points?: number;
      answer?: string[];
    }>;
  };
}

export interface TheoryQuestion {
  id: string;
  kind: 'judge' | 'single' | 'multi';
  number: number;
  stem: string;
  options: string[] | Array<{ key: string; text: string }>;
  points: number;
}

export interface TheoryBank {
  bankVersion: string;
  rules: {
    durationMinutes: number;
    judge: { count: number; points: number };
    single: { count: number; points: number };
    multi: { count: number; points: number };
  };
  questions: TheoryQuestion[];
}

export interface LearningRecord {
  quiz: { answers: Record<string, number>; updatedAt: number | null };
  exams: Record<string, ExamRecord>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || '请求没有完成。');
  return body as T;
}

export const api = {
  bank: () => request<{ bank: { bankVersion: string; groups: Array<{ id: string; title: string; points: number }>; questions: Question[] } }>('/api/exam/bank'),
  theoryBank: () => request<{ bank: TheoryBank }>('/api/exam/theory'),
  theoryCheck: (id: string, selected: string[]) => request<{ correct: boolean; answer: string[]; points: number }>('/api/exam/theory/check', { method: 'POST', body: JSON.stringify({ id, selected }) }),
  theoryGrade: (id: string) => request<NonNullable<ExamRecord['assessment']>>(`/api/exam/theory/grade/${id}`, { method: 'POST', body: '{}' }),
  captcha: () => request<{ id: string; svg: string }>('/api/auth/captcha'),
  me: () => request<{ user: PublicUser | null }>('/api/auth/me'),
  login: (body: object) => request<{ user: PublicUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: object) => request<{ user: PublicUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  password: (body: object) => request<{ user: PublicUser }>('/api/auth/password', { method: 'POST', body: JSON.stringify(body) }),
  learning: () => request<{ record: LearningRecord }>('/api/learning'),
  saveQuiz: (answers: Record<string, number>) => request<{ quiz: LearningRecord['quiz'] }>('/api/learning/quiz', { method: 'PUT', body: JSON.stringify({ answers }) }),
  saveExam: (exam: object) => request<{ exam: ExamRecord }>('/api/learning/exams', { method: 'PUT', body: JSON.stringify(exam) }),
  deleteExam: (id: string) => request<{ ok: boolean }>(`/api/learning/exams/${id}`, { method: 'DELETE' }),
  overview: () => request<{ userCount: number; quizAnswers: number; examCount: number; users: Array<Record<string, unknown>> }>('/api/admin/overview'),
  model: () => request<{ model: { configured: boolean; baseUrl: string; model: string; keyHint: string } }>('/api/admin/model'),
  saveModel: (body: object) => request<{ model: { configured: boolean; baseUrl: string; model: string; keyHint: string } }>('/api/admin/model', { method: 'PUT', body: JSON.stringify(body) }),
  grade: (id: string, images: unknown[]) => request<{ assessment: ExamRecord['assessment'] }>(`/api/grading/exams/${id}`, { method: 'POST', body: JSON.stringify({ images }) }),
};

export interface Question {
  id: string;
  groupId: string;
  title: string;
  points: number;
  durationMinutes: number;
  content: ContentBlock[];
  materials: { zip: Asset; files: Asset[] };
  answerSections: Array<{ id: string; title: string; description?: string; fields: AnswerField[] }>;
}

export interface Asset { name?: string; key: string; bytes: number; sha256: string }
export interface AnswerField {
  id: string;
  label: string;
  kind: 'text' | 'file';
  description?: string;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  expectedNames?: string[];
  required?: boolean;
}
export type ContentBlock =
  | { type: 'heading'; level: number; text: string; hidden?: boolean }
  | { type: 'paragraph'; text: string; hidden?: boolean }
  | { type: 'note'; text: string; hidden?: boolean }
  | { type: 'list'; style: string; items: Array<{ marker: string; blocks: ContentBlock[] }>; hidden?: boolean }
  | { type: 'options'; stem: string; choices: string[]; hidden?: boolean }
  | { type: 'table'; columns: string[]; rows: string[][]; note?: string; hidden?: boolean };
