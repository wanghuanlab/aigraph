import type { ExamSession, StoredAnswerFile } from './types';

export interface ExamRepository {
  listSessions(): Promise<ExamSession[]>;
  getSession(id: string): Promise<ExamSession | undefined>;
  saveSession(session: ExamSession): Promise<void>;
  getFile(id: string): Promise<StoredAnswerFile | undefined>;
  putFiles(files: StoredAnswerFile[], session: ExamSession): Promise<void>;
  removeFile(fileId: string, session: ExamSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

/** The caller must reload the stored session instead of retrying a stale snapshot. */
export class SessionConflictError extends Error {
  constructor(message = '此答卷已更新或已交卷，请重新打开后继续。') {
    super(message);
    this.name = 'SessionConflictError';
  }
}

const SESSIONS = 'sessions';
const FILES = 'answerFiles';
const SESSION_INDEX = 'sessionId';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('读取本地答卷失败。'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('本地保存已取消，答案未保存。'));
    transaction.onerror = () => {
      // The abort event is authoritative: never report success for a failed transaction.
    };
  });
}

/**
 * Real Blob data lives in IndexedDB. Mutations are ordered within this repository;
 * each write also checks the latest stored session inside its transaction.
 */
export class IndexedDBExamRepository implements ExamRepository {
  private connection?: Promise<IDBDatabase>;
  private writes: Promise<void> = Promise.resolve();

  constructor(private readonly databaseName = 'aigraph-practical-exams') {}

  /** Release this connection when a host or an isolated browser test is finished. */
  async close(): Promise<void> {
    await this.writes;
    const connection = this.connection;
    this.connection = undefined;
    if (connection) (await connection).close();
  }

  private open(): Promise<IDBDatabase> {
    if (this.connection) return this.connection;
    this.connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error('此浏览器无法使用本地答卷存储，请在普通浏览窗口中重试。'));
        return;
      }
      const request = indexedDB.open(this.databaseName, 1);
      let settled = false;
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(SESSIONS)) {
          database.createObjectStore(SESSIONS, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(FILES)) {
          const files = database.createObjectStore(FILES, { keyPath: 'id' });
          files.createIndex(SESSION_INDEX, 'sessionId', { unique: false });
        }
      };
      request.onerror = () => {
        settled = true;
        reject(request.error ?? new Error('无法打开本地答卷存储。'));
      };
      request.onblocked = () => {
        settled = true;
        reject(new Error('其他页面正在使用旧版答卷存储，请关闭后重试。'));
      };
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          this.connection = undefined;
        };
        resolve(database);
      };
    }).catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const result = this.writes.then(operation);
    // A failure is returned to its caller without preventing later independent saves.
    this.writes = result.catch(() => undefined);
    return result;
  }

  private async read<T>(storeName: string, read: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    await this.writes;
    const database = await this.open();
    const transaction = database.transaction(storeName, 'readonly');
    const completion = transactionComplete(transaction);
    // Attach both rejection handlers immediately; request failure also aborts the transaction.
    const [result] = await Promise.all([requestResult(read(transaction.objectStore(storeName))), completion]);
    return result;
  }

  private async mutate(operation: (transaction: IDBTransaction) => Promise<void>): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction([SESSIONS, FILES], 'readwrite');
    const completion = transactionComplete(transaction);
    // A request may reject before the operation's catch handles it.
    void completion.catch(() => undefined);
    try {
      await operation(transaction);
      await completion;
    } catch (error) {
      try { transaction.abort(); } catch { /* It may already have aborted. */ }
      await completion.catch(() => undefined);
      throw error;
    }
  }

  private async checkSession(transaction: IDBTransaction, next: ExamSession): Promise<boolean> {
    const stored = await requestResult<ExamSession | undefined>(transaction.objectStore(SESSIONS).get(next.id));
    if (!stored) return true;
    if (stored.status === 'submitted') {
      // Identical retries are harmless; a submitted answer cannot be changed at all.
      if (JSON.stringify(stored) === JSON.stringify(next)) return false;
      throw new SessionConflictError('此答卷已交卷，不能再修改答案。');
    }
    if (next.updatedAt < stored.updatedAt) {
      throw new SessionConflictError('此答卷已有更新的保存记录，请重新打开后继续。');
    }
    if (stored.bankVersion !== next.bankVersion || stored.mode !== next.mode
      || stored.startedAt !== next.startedAt || stored.deadlineAt !== next.deadlineAt
      || JSON.stringify(stored.questionIds) !== JSON.stringify(next.questionIds)) {
      throw new SessionConflictError('答卷的题库、试题和考试时间不能在开始后更改。');
    }
    return true;
  }

  async listSessions(): Promise<ExamSession[]> {
    const sessions = await this.read<ExamSession[]>(SESSIONS, (store) => store.getAll());
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt || b.startedAt - a.startedAt);
  }

  getSession(id: string): Promise<ExamSession | undefined> {
    return this.read(SESSIONS, (store) => store.get(id));
  }

  async saveSession(session: ExamSession): Promise<void> {
    const snapshot = structuredClone(session);
    return this.enqueue(() => this.mutate(async (transaction) => {
      if (await this.checkSession(transaction, snapshot)) {
        await requestResult(transaction.objectStore(SESSIONS).put(snapshot));
      }
    }));
  }

  getFile(id: string): Promise<StoredAnswerFile | undefined> {
    return this.read(FILES, (store) => store.get(id));
  }

  async putFiles(files: StoredAnswerFile[], session: ExamSession): Promise<void> {
    if (files.length === 0) return this.saveSession(session);
    const snapshot = structuredClone(session);
    const fileSnapshots = structuredClone(files);
    if (snapshot.status !== 'active') throw new SessionConflictError('已交卷的答卷不能添加文件。');
    const seen = new Set<string>();
    for (const file of fileSnapshots) {
      if (seen.has(file.id) || file.sessionId !== snapshot.id
        || !snapshot.questionIds.includes(file.questionId)
        || !snapshot.answers[file.questionId]?.[file.fieldId]?.fileIds.includes(file.id)
        || !(file.blob instanceof Blob) || file.blob.size !== file.size) {
        throw new Error('答题文件与答卷不匹配，文件未保存。');
      }
      seen.add(file.id);
    }
    return this.enqueue(() => this.mutate(async (transaction) => {
      await this.checkSession(transaction, snapshot);
      const store = transaction.objectStore(FILES);
      for (const file of fileSnapshots) {
        const existing = await requestResult<StoredAnswerFile | undefined>(store.get(file.id));
        if (existing && (existing.sessionId !== file.sessionId
          || existing.questionId !== file.questionId || existing.fieldId !== file.fieldId)) {
          throw new Error('答题文件标识冲突，文件未保存。');
        }
        await requestResult(store.put(file));
      }
      await requestResult(transaction.objectStore(SESSIONS).put(snapshot));
    }));
  }

  async removeFile(fileId: string, session: ExamSession): Promise<void> {
    const snapshot = structuredClone(session);
    if (Object.values(snapshot.answers).some((answers) =>
      Object.values(answers).some((answer) => answer.fileIds.includes(fileId)))) {
      throw new Error('请先从答卷中移除此文件的引用。');
    }
    return this.enqueue(() => this.mutate(async (transaction) => {
      const changed = await this.checkSession(transaction, snapshot);
      const files = transaction.objectStore(FILES);
      const stored = await requestResult<StoredAnswerFile | undefined>(files.get(fileId));
      if (stored && stored.sessionId !== snapshot.id) throw new Error('不能移除其他答卷的文件。');
      await requestResult(files.delete(fileId));
      if (changed) await requestResult(transaction.objectStore(SESSIONS).put(snapshot));
    }));
  }

  deleteSession(id: string): Promise<void> {
    return this.enqueue(() => this.mutate(async (transaction) => {
      const files = transaction.objectStore(FILES);
      const keys = await requestResult(files.index(SESSION_INDEX).getAllKeys(IDBKeyRange.only(id)));
      await Promise.all(keys.map((key) => requestResult(files.delete(key))));
      await requestResult(transaction.objectStore(SESSIONS).delete(id));
    }));
  }
}

export const examRepository: ExamRepository = new IndexedDBExamRepository();

const PERSIST_KEY = 'aigraph-exam-storage-persist';

export function readExamStoragePersistence(): 'granted' | 'denied' | 'unknown' {
  try {
    const value = localStorage.getItem(PERSIST_KEY);
    if (value === 'granted' || value === 'denied') return value;
  } catch {
    /* Private browsing can block localStorage; the cautious copy still applies. */
  }
  return 'unknown';
}

/** Ask the browser to keep answer data. Unsupported or rejected requests are not errors. */
export async function requestExamStoragePersistence(): Promise<'granted' | 'denied'> {
  let granted = false;
  try {
    if (navigator.storage?.persist) granted = await navigator.storage.persist();
  } catch {
    granted = false;
  }
  const status = granted ? 'granted' : 'denied';
  try { localStorage.setItem(PERSIST_KEY, status); } catch { /* ignore */ }
  return status;
}
