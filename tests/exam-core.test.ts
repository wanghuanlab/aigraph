import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSession,
  EXAM_DURATION_MS,
  getQuestionStatus,
  isSessionExpired,
  remainingMilliseconds,
  submitSession,
} from '../src/exam/session.ts';
import type { PracticalQuestion } from '../src/exam/types.ts';

const GROUP_POINTS: Record<string, number> = {
  '1.1': 25, '1.2': 25, '2.1': 15, '2.2': 20,
  '3.1': 15, '3.2': 20, '4.1': 5, '4.2': 5,
};

const bank: PracticalQuestion[] = Object.entries(GROUP_POINTS).flatMap(([groupId, points]) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `${groupId}.${i + 1}`, groupId, points, title: `原题 ${groupId}.${i + 1}`,
    suggestedMinutes: 15, sourcePages: [1], pageImages: ['/question.png'],
    materialUrl: '/materials.zip', materialSize: 1, materialFiles: ['original.csv'],
    answerSections: [{ id: 'tasks', title: '答题', fields: [
      { id: 'description', label: '说明', kind: 'text', required: true },
      { id: 'result', label: '结果', kind: 'file', required: true },
      { id: 'note', label: '备注', kind: 'text', required: false },
    ] }],
  })),
);

test('practice includes all 40 original IDs in order without changing the bank', () => {
  const reversed = [...bank].reverse();
  const session = createSession('practice', reversed, 'v1', 1000);
  assert.equal(session.questionIds.length, 40);
  assert.deepEqual(session.questionIds, bank.map((question) => question.id));
  assert.equal(session.currentQuestionId, '1.1.1');
  assert.equal(reversed[0].id, '4.2.5');
  assert.equal(session.deadlineAt, undefined);
  assert.equal(isSessionExpired(session, Number.MAX_SAFE_INTEGER), false);
  assert.equal(remainingMilliseconds(session), 0);
});

test('every exam has one question from each prescribed pool, 6 unique questions and 100 points', () => {
  const pools = [
    new Set(bank.filter((q) => q.id.startsWith('1.')).map((q) => q.id)),
    new Set(bank.filter((q) => q.id.startsWith('2.1.')).map((q) => q.id)),
    new Set(bank.filter((q) => q.id.startsWith('2.2.')).map((q) => q.id)),
    new Set(bank.filter((q) => q.id.startsWith('3.1.')).map((q) => q.id)),
    new Set(bank.filter((q) => q.id.startsWith('3.2.')).map((q) => q.id)),
    new Set(bank.filter((q) => q.id.startsWith('4.')).map((q) => q.id)),
  ];
  assert.deepEqual(pools.map((pool) => pool.size), [10, 5, 5, 5, 5, 10]);
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const session = createSession('exam', bank, 'v1', 1000);
    assert.equal(session.questionIds.length, 6);
    assert.equal(new Set(session.questionIds).size, 6);
    session.questionIds.forEach((id, index) => assert.ok(pools[index].has(id)));
    assert.equal(session.questionIds.reduce((sum, id) => sum + bank.find((q) => q.id === id)!.points, 0), 100);
  }
});

test('incomplete, duplicated, misclassified and wrongly weighted banks are rejected', () => {
  assert.throws(() => createSession('exam', bank.slice(1), 'v1'));
  assert.throws(() => createSession('practice', [bank[0], ...bank.slice(0, -1)], 'v1'));
  assert.throws(() => createSession('exam', [{ ...bank[0], groupId: '2.1' }, ...bank.slice(1)], 'v1'));
  assert.throws(() => createSession('exam', [{ ...bank[0], points: 99 }, ...bank.slice(1)], 'v1'));
  assert.throws(() => createSession('exam', bank, '  '));
});

test('completion requires all required text and file answers without inferring correctness', () => {
  const question = bank[0];
  const session = createSession('practice', bank, 'v1', 1000);
  assert.equal(getQuestionStatus(question, session), 'empty');
  session.answers[question.id] = { description: { text: ' \n ', fileIds: [] } };
  assert.equal(getQuestionStatus(question, session), 'empty');
  session.answers[question.id].description.text = '任意内容，不代表正确';
  assert.equal(getQuestionStatus(question, session), 'partial');
  session.answers[question.id].result = { text: '', fileIds: ['actual-blob-id'] };
  assert.equal(getQuestionStatus(question, session), 'complete');
  session.answers[question.id].description.text = '';
  assert.equal(getQuestionStatus(question, session), 'partial');
  session.answers[question.id].result.fileIds = [];
  session.answers[question.id].unrelated = { text: 'unknown field', fileIds: [] };
  assert.equal(getQuestionStatus(question, session), 'empty');
});

test('the 120-minute deadline survives refresh and expires exactly at its boundary', () => {
  const session = createSession('exam', bank, 'v1', 1000);
  assert.equal(EXAM_DURATION_MS, 7_200_000);
  assert.equal(session.deadlineAt, 7_201_000);
  const restored = JSON.parse(JSON.stringify(session));
  assert.equal(remainingMilliseconds(restored, 7_200_999), 1);
  assert.equal(isSessionExpired(restored, 7_200_999), false);
  assert.equal(remainingMilliseconds(restored, 7_201_000), 0);
  assert.equal(isSessionExpired(restored, 7_201_000), true);
  assert.equal(remainingMilliseconds(restored, 99_999_999), 0);
});

test('manual submission preserves answers, freezes remaining time and is idempotent', () => {
  const session = createSession('exam', bank, 'v1', 1000);
  session.answers[session.questionIds[0]] = { note: { text: '答卷', fileIds: [] } };
  const submitted = submitSession(session, 'manual', 2000);
  assert.equal(session.status, 'active');
  assert.equal(submitted.status, 'submitted');
  assert.equal(submitted.submissionReason, 'manual');
  assert.equal(submitted.submittedAt, 2000);
  assert.deepEqual(submitted.answers, session.answers);
  assert.equal(remainingMilliseconds(submitted, 99_999_999), 7_199_000);
  assert.equal(isSessionExpired(submitted, 99_999_999), false);
  assert.equal(submitSession(submitted, 'timeout', 99_999_999), submitted);
});

test('an overdue exam submits at its original deadline, including a manual submit after reopening', () => {
  const session = createSession('exam', bank, 'v1', 1000);
  assert.throws(() => submitSession(session, 'timeout', 2000));
  const timedOut = submitSession(session, 'timeout', 99_999_999);
  assert.equal(timedOut.submittedAt, session.deadlineAt);
  assert.equal(timedOut.updatedAt, 99_999_999);
  assert.equal(timedOut.submissionReason, 'timeout');
  const lateManual = submitSession(session, 'manual', 99_999_999);
  assert.equal(lateManual.submissionReason, 'timeout');
  assert.equal(lateManual.submittedAt, session.deadlineAt);
  assert.throws(() => submitSession(createSession('practice', bank, 'v1', 1000), 'timeout', 99_999_999));
});
