import type { ExamRecord } from '../api';
import type { StoredFile } from './files';
import { EXAM_DURATION_MS, type ExamSession } from './session';
import { THEORY_DURATION_MS } from './theory';

const names: Record<ExamRecord['mode'], string> = {
  exam: '操作技能模拟考试',
  practice: '操作全题练习',
  theory: '理论知识模拟考试',
  'theory-practice': '理论练习',
};

export function examName(mode: ExamRecord['mode']) {
  return names[mode];
}

export function examLocation(exam: Pick<ExamRecord, 'mode' | 'id'>) {
  const name = exam.mode === 'theory' || exam.mode === 'theory-practice' ? 'theory' : 'workspace';
  return { name, params: { id: exam.id } };
}

export function examDeadline(exam: Pick<ExamRecord, 'mode' | 'startedAt' | 'status'>) {
  if (exam.status !== 'active') return;
  if (exam.mode === 'exam') return exam.startedAt + EXAM_DURATION_MS;
  if (exam.mode === 'theory') return exam.startedAt + THEORY_DURATION_MS;
}

export function practicalFromRecord(record: ExamRecord, bankVersion: string): ExamSession | null {
  if (record.mode !== 'exam' && record.mode !== 'practice') return null;
  const answers: ExamSession['answers'] = {};
  for (const [questionId, fields] of Object.entries(record.answers ?? {})) {
    answers[questionId] = Object.fromEntries(Object.entries(fields).map(([id, value]) =>
      [id, { text: value.text || '', fileIds: [] }],
    ));
  }
  return {
    id: record.id,
    schemaVersion: 1,
    bankVersion,
    mode: record.mode,
    status: record.status,
    questionIds: record.questionIds,
    currentQuestionId: record.questionIds[0],
    startedAt: record.startedAt,
    updatedAt: record.updatedAt,
    deadlineAt: examDeadline(record),
    submittedAt: record.submittedAt,
    submissionReason: record.submissionReason,
    answers,
    markedQuestionIds: record.markedQuestionIds ?? [],
    assessment: record.assessment as ExamSession['assessment'],
  };
}

export function restoreFileIds(exam: ExamSession, files: StoredFile[]) {
  for (const fields of Object.values(exam.answers)) {
    for (const field of Object.values(fields)) field.fileIds = [];
  }
  for (const file of files) {
    const fields = exam.answers[file.questionId] ??= {};
    const answer = fields[file.fieldId] ??= { text: '', fileIds: [] };
    answer.fileIds.push(file.id);
  }
}

export function clockLabel(ms: number) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return [Math.floor(total / 60), total % 60].map((part) => String(part).padStart(2, '0')).join(':');
}

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
});

export function examDate(value: number) {
  return dateFormat.format(value);
}

export function isLoginError(error: string) {
  return error === '请先登录。';
}

export function canUseExamShortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false;
  const target = event.target;
  return !(target instanceof HTMLElement && (
    target.isContentEditable || target.closest('input, textarea, select, dialog, [role="textbox"]')
  ));
}
