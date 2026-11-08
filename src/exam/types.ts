/** Original practical question bank. Source pages contain questions only. */
export interface PracticalAnswerField {
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

export interface PracticalAnswerSection {
  id: string;
  title: string;
  description?: string;
  fields: PracticalAnswerField[];
}

export type ContentBlock =
  | { type: 'heading'; level: number; text: string; hidden?: boolean }
  | { type: 'paragraph'; text: string; hidden?: boolean }
  | { type: 'note'; text: string; hidden?: boolean }
  | { type: 'list'; style: 'paren-number' | 'number' | 'step' | 'bullet'; items: ContentListItem[]; hidden?: boolean }
  | { type: 'options'; stem: string; choices: string[]; hidden?: boolean }
  | { type: 'table'; columns: string[]; rows: string[][]; note?: string; hidden?: boolean };

export interface ContentListItem {
  marker: string;
  blocks: ContentBlock[];
}

export interface ExamAssetRecord {
  name?: string;
  key: string;
  bytes: number;
  sha256: string;
  archivePath?: string;
}

export interface PracticalQuestion {
  id: string;
  groupId: string;
  title: string;
  points: number;
  durationMinutes: number;
  source: { pdf: string; pages: number[] };
  content: ContentBlock[];
  materials: { zip: ExamAssetRecord; files: ExamAssetRecord[] };
  answerSections: PracticalAnswerSection[];
}

export interface PracticalGroup {
  id: string;
  title: string;
  points: number;
}

export type ExamMode = 'practice' | 'exam';

export interface AnswerValue {
  text: string;
  fileIds: string[];
  savedAt?: number;
}

export interface StoredAnswerFile {
  id: string;
  sessionId: string;
  questionId: string;
  fieldId: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  blob: Blob;
}

export interface ExamSession {
  id: string;
  schemaVersion: 1;
  bankVersion: string;
  mode: ExamMode;
  status: 'active' | 'submitted';
  questionIds: string[];
  currentQuestionId: string;
  startedAt: number;
  updatedAt: number;
  deadlineAt?: number;
  submittedAt?: number;
  submissionReason?: 'manual' | 'timeout';
  answers: Record<string, Record<string, AnswerValue>>;
  markedQuestionIds: string[];
  /** Reserved for a future grading adapter. Phase one never infers a score. */
  assessment?: AssessmentResult;
}

/** Future grading boundary; the browser repository remains independent of it. */
export interface AssessmentRequest {
  sessionId: string;
  bankVersion: string;
  questionIds: string[];
  answers: ExamSession['answers'];
  files: StoredAnswerFile[];
}

export interface AssessmentResult {
  status: 'pending' | 'needs_review' | 'completed';
  assessedAt?: number;
  provider?: string;
  items: Array<{
    questionId: string;
    criterionId: string;
    maxPoints: number;
    suggestedPoints?: number;
    correctedPoints?: number;
    reason?: string;
    evidence?: string[];
  }>;
}

export interface AssessmentProvider {
  assess(request: AssessmentRequest, signal?: AbortSignal): Promise<AssessmentResult>;
}
