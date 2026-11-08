/**
 * Run against real IndexedDB in a Vite browser page:
 * await (await import('/tests/exam-storage.browser.ts')).runStorageTests()
 * It uses and removes its own uniquely named database; user answer data is untouched.
 */
import { IndexedDBExamRepository, SessionConflictError } from '../src/exam/storage';
import type { ExamSession, StoredAnswerFile } from '../src/exam/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectRejection(operation: Promise<unknown>, conflict = false): Promise<void> {
  let rejected = false;
  try { await operation; } catch (error) {
    rejected = true;
    if (conflict) assert(error instanceof SessionConflictError, 'Expected SessionConflictError');
  }
  assert(rejected, 'Operation unexpectedly succeeded');
}

function sessionFixture(id: string, updatedAt = 1000): ExamSession {
  return {
    id, schemaVersion: 1, bankVersion: 'storage-tests', mode: 'exam', status: 'active',
    questionIds: ['1.1.1'], currentQuestionId: '1.1.1', startedAt: 1000,
    updatedAt, deadlineAt: 7_201_000, answers: {}, markedQuestionIds: [],
  };
}

function fileFixture(id: string, sessionId: string, body = '本地答卷文件内容'): StoredAnswerFile {
  const blob = new Blob([body], { type: 'text/plain' });
  return {
    id, sessionId, questionId: '1.1.1', fieldId: 'result', name: '1.1.1.txt',
    size: blob.size, type: blob.type, lastModified: 1000, blob,
  };
}

function withFiles(session: ExamSession, fileIds: string[], updatedAt: number): ExamSession {
  return {
    ...session, updatedAt,
    answers: { '1.1.1': { result: { text: '', fileIds, savedAt: updatedAt } } },
  };
}

export async function runStorageTests(): Promise<{ passed: string[] }> {
  const databaseName = `aigraph-exam-storage-test-${crypto.randomUUID()}`;
  const repository = new IndexedDBExamRepository(databaseName);
  const reopened = new IndexedDBExamRepository(databaseName);
  const passed: string[] = [];
  try {
    const base = sessionFixture('main');
    await repository.saveSession(base);
    const stored = await repository.getSession(base.id);
    assert(JSON.stringify(stored) === JSON.stringify(base), 'Initial session failed to round-trip');
    passed.push('session round-trip');

    const file = fileFixture('blob-1', base.id);
    const firstAnswer = withFiles(base, [file.id], 2000);
    await repository.putFiles([file], firstAnswer);
    const restoredFile = await reopened.getFile(file.id);
    assert(restoredFile?.blob instanceof Blob, 'File content was not stored as an actual Blob');
    assert(await restoredFile.blob.text() === '本地答卷文件内容', 'Stored Blob content changed');
    assert((await reopened.getSession(base.id))?.answers['1.1.1'].result.fileIds[0] === file.id,
      'Saved file reference was lost');
    passed.push('Blob and reference survive a new repository connection');

    const mutable = structuredClone(firstAnswer);
    mutable.updatedAt = 3000;
    mutable.answers['1.1.1'].result.text = 'snapshot before save';
    const saving = repository.saveSession(mutable);
    mutable.answers['1.1.1'].result.text = 'later in-memory change';
    await saving;
    assert((await repository.getSession(base.id))?.answers['1.1.1'].result.text === 'snapshot before save',
      'In-flight save retained a mutable caller reference');
    passed.push('save captures an immutable snapshot');

    await expectRejection(repository.saveSession(firstAnswer), true);
    assert((await repository.getSession(base.id))?.updatedAt === 3000, 'Stale save replaced newer answer');
    passed.push('older answer snapshots are rejected');

    const other = sessionFixture('other', 3000);
    const otherFile = fileFixture('foreign-file', other.id, 'other answer');
    await repository.putFiles([otherFile], withFiles(other, [otherFile.id], 3000));
    const current = (await repository.getSession(base.id))!;
    const newFile = fileFixture('must-roll-back', base.id);
    const collidingFile = fileFixture(otherFile.id, base.id, 'must not replace another answer');
    const rejectedAnswer = withFiles(current, [file.id, newFile.id, collidingFile.id], 4000);
    await expectRejection(repository.putFiles([newFile, collidingFile], rejectedAnswer));
    assert(await repository.getFile(newFile.id) === undefined, 'Partial Blob write was not rolled back');
    assert(JSON.stringify(await repository.getSession(base.id)) === JSON.stringify(current),
      'Failed file transaction changed the session');
    assert(await (await repository.getFile(otherFile.id))!.blob.text() === 'other answer',
      'Failed file transaction changed another answer');
    passed.push('file transaction rollback preserves all existing data');

    const firstQueued = { ...current, updatedAt: 5000, markedQuestionIds: ['1.1.1'] };
    const lastQueued = { ...current, updatedAt: 6000, markedQuestionIds: [] };
    await Promise.all([repository.saveSession(firstQueued), repository.saveSession(lastQueued)]);
    assert((await repository.getSession(base.id))?.updatedAt === 6000, 'Queued save order was reversed');
    passed.push('writes preserve invocation order after a failed transaction');

    await expectRejection(repository.removeFile(file.id, lastQueued));
    assert(await repository.getFile(file.id), 'Referenced Blob was deleted');
    const noFiles = withFiles(lastQueued, [], 7000);
    await repository.removeFile(file.id, noFiles);
    assert(await repository.getFile(file.id) === undefined, 'Removed file Blob remains in storage');
    assert((await repository.getSession(base.id))?.answers['1.1.1'].result.fileIds.length === 0,
      'File reference was not removed atomically');
    passed.push('file removal updates the answer and Blob together');

    const submitted: ExamSession = {
      ...noFiles, updatedAt: 8000, status: 'submitted', submittedAt: 8000, submissionReason: 'manual',
    };
    await repository.putFiles([], submitted);
    await repository.putFiles([], structuredClone(submitted));
    await repository.removeFile(file.id, structuredClone(submitted));
    await expectRejection(reopened.saveSession({ ...noFiles, updatedAt: 9000 }), true);
    await expectRejection(repository.saveSession({ ...submitted, updatedAt: 9000 }), true);
    assert(JSON.stringify(await repository.getSession(base.id)) === JSON.stringify(submitted),
      'Submitted session was overwritten');
    passed.push('submitted snapshots are immutable across connections and identical retries are harmless');

    const history = await repository.listSessions();
    assert(history[0].id === base.id, 'History is not ordered by latest update');
    await repository.deleteSession(other.id);
    assert(await repository.getSession(other.id) === undefined, 'Deleted session remains');
    assert(await repository.getFile(otherFile.id) === undefined, 'Deleted session left an orphan Blob');
    assert(await repository.getSession(base.id), 'Deleting one session removed another');
    passed.push('history ordering and cascading session deletion');
    return { passed };
  } finally {
    await Promise.all([repository.close(), reopened.close()]);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage test database cleanup was blocked'));
    });
  }
}
