export interface StoredFile {
  id: string;
  sessionId: string;
  questionId: string;
  fieldId: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
}

const DB_NAME = 'aigraph-practical-exams';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('answerFiles')) db.createObjectStore('answerFiles', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAnswerFile(file: StoredFile) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('answerFiles', 'readwrite');
    tx.objectStore('answerFiles').put(file);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function filesFor(sessionId: string, questionId?: string, fieldId?: string): Promise<StoredFile[]> {
  const db = await openDb();
  const all = await new Promise<StoredFile[]>((resolve, reject) => {
    const tx = db.transaction('answerFiles', 'readonly');
    const request = tx.objectStore('answerFiles').getAll();
    request.onsuccess = () => resolve(request.result as StoredFile[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return all.filter((file) => file.sessionId === sessionId
    && (questionId === undefined || file.questionId === questionId)
    && (fieldId === undefined || file.fieldId === fieldId));
}

export async function removeAnswerFile(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('answerFiles', 'readwrite');
    tx.objectStore('answerFiles').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
