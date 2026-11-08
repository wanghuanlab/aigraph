import { useCallback, useEffect, useRef, useState } from 'react';
import { examRepository } from './storage';
import { isSessionExpired, submitSession } from './session';
import type { ExamSession, StoredAnswerFile } from './types';

function storageMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return '浏览器存储空间不足，答案尚未保存。请释放此浏览器的存储空间后重试。';
  }
  return error instanceof Error
    ? `保存失败：${error.message}。请保留此页面并重试。`
    : '浏览器暂时无法保存答案，请保留此页面并重试。';
}

/** All changes pass through one ordered writer, including file transactions. */
export function useExamSession(sessionId?: string) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [files, setFiles] = useState<Record<string, StoredAnswerFile>>({});
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const current = useRef<ExamSession | null>(null);
  const pendingFiles = useRef(new Map<string, StoredAnswerFile>());
  const pendingRemovals = useRef(new Set<string>());
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  const revision = useRef(0);
  const dirty = useRef(false);
  const mounted = useRef(true);
  const finishing = useRef(false);
  const lastTimeoutAttempt = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(debounce.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    void (async () => {
      try {
        const stored = await examRepository.getSession(sessionId);
        if (!stored) throw new Error('这份答卷不在当前浏览器中，可能已被清理。请返回考试中心重新开始。');
        const ids = [...new Set(Object.values(stored.answers).flatMap(fields =>
          Object.values(fields).flatMap(value => value.fileIds)))];
        const storedFiles = await Promise.all(ids.map(id => examRepository.getFile(id)));
        if (cancelled) return;
        if (storedFiles.some(file => !file)) {
          throw new Error('这份答卷的部分附件已丢失，无法完整恢复。请保留浏览器数据并检查存储状态。');
        }
        current.current = stored;
        setSession(stored);
        setFiles(Object.fromEntries(storedFiles.filter((f): f is StoredAnswerFile => Boolean(f)).map(f => [f.id, f])));
      } catch (cause) {
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : '无法读取浏览器答卷，请刷新后重试。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const flush = useCallback((): Promise<void> => {
    clearTimeout(debounce.current);
    const snapshot = current.current;
    if (!snapshot || !dirty.current) return writeQueue.current;
    const thisRevision = revision.current;
    const additions = [...pendingFiles.current.values()];
    const removals = [...pendingRemovals.current];
    setSaveState('saving');
    const operation = writeQueue.current.catch(() => undefined).then(async () => {
      // putFiles commits new blobs and their answer references atomically.
      await examRepository.putFiles(additions, snapshot);
      for (const id of removals) await examRepository.removeFile(id, snapshot);
      for (const file of additions) {
        if (pendingFiles.current.get(file.id) === file) pendingFiles.current.delete(file.id);
      }
      for (const id of removals) pendingRemovals.current.delete(id);
      if (thisRevision === revision.current) {
        dirty.current = false;
        if (mounted.current) { setSaveState('saved'); setError(''); }
      }
    }).catch(cause => {
      if (mounted.current) { setSaveState('error'); setError(storageMessage(cause)); }
      throw cause;
    });
    writeQueue.current = operation;
    return operation;
  }, []);

  const publish = useCallback((next: ExamSession) => {
    current.current = next;
    setSession(next);
    revision.current += 1;
    dirty.current = true;
    setSaveState('saving');
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void flush().catch(() => undefined); }, 350);
  }, [flush]);

  const edit = useCallback((mutate: (value: ExamSession) => ExamSession): boolean => {
    const value = current.current;
    if (!value || value.status !== 'active' || finishing.current || isSessionExpired(value)) return false;
    const next = mutate(value);
    publish({ ...next, updatedAt: Math.max(Date.now(), value.updatedAt + 1) });
    return true;
  }, [publish]);

  const changeText = useCallback((questionId: string, fieldId: string, text: string) => {
    edit(value => ({
      ...value,
      answers: { ...value.answers, [questionId]: {
        ...value.answers[questionId],
        [fieldId]: { ...value.answers[questionId]?.[fieldId], text,
          fileIds: value.answers[questionId]?.[fieldId]?.fileIds ?? [], savedAt: Date.now() },
      } },
    }));
  }, [edit]);

  const addFiles = useCallback(async (questionId: string, fieldId: string, selected: File[]) => {
    const value = current.current;
    if (!value || value.status !== 'active' || isSessionExpired(value) || finishing.current || !selected.length) return;
    const additions: StoredAnswerFile[] = selected.map(file => ({
      id: crypto.randomUUID(), sessionId: value.id, questionId, fieldId,
      name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, blob: file,
    }));
    additions.forEach(file => pendingFiles.current.set(file.id, file));
    setFiles(old => ({ ...old, ...Object.fromEntries(additions.map(file => [file.id, file])) }));
    edit(latest => ({
      ...latest,
      answers: { ...latest.answers, [questionId]: {
        ...latest.answers[questionId],
        [fieldId]: { text: latest.answers[questionId]?.[fieldId]?.text ?? '',
          fileIds: [...(latest.answers[questionId]?.[fieldId]?.fileIds ?? []), ...additions.map(file => file.id)],
          savedAt: Date.now() },
      } },
    }));
    await flush();
  }, [edit, flush]);

  const removeFile = useCallback(async (questionId: string, fieldId: string, fileId: string) => {
    const changed = edit(value => ({
      ...value,
      answers: { ...value.answers, [questionId]: {
        ...value.answers[questionId],
        [fieldId]: { text: value.answers[questionId]?.[fieldId]?.text ?? '',
          fileIds: (value.answers[questionId]?.[fieldId]?.fileIds ?? []).filter(id => id !== fileId), savedAt: Date.now() },
      } },
    }));
    if (!changed) return;
    pendingFiles.current.delete(fileId);
    pendingRemovals.current.add(fileId);
    setFiles(old => { const next = { ...old }; delete next[fileId]; return next; });
    await flush();
  }, [edit, flush]);

  const selectQuestion = useCallback((questionId: string) => {
    const value = current.current;
    if (!value || !value.questionIds.includes(questionId)) return;
    if (value.status === 'submitted') {
      // Review navigation is ephemeral: submitted answers remain immutable.
      setSession(old => old ? { ...old, currentQuestionId: questionId } : old);
      return;
    }
    edit(latest => ({ ...latest, currentQuestionId: questionId }));
  }, [edit]);

  const toggleMark = useCallback((questionId: string) => {
    edit(value => ({ ...value, markedQuestionIds: value.markedQuestionIds.includes(questionId)
      ? value.markedQuestionIds.filter(id => id !== questionId) : [...value.markedQuestionIds, questionId] }));
  }, [edit]);

  const finish = useCallback(async (reason: 'manual' | 'timeout' = 'manual') => {
    if (!current.current || finishing.current) return;
    if (current.current.status === 'submitted') { await flush(); return; }
    finishing.current = true;
    try {
      await flush();
      const latest = current.current;
      if (!latest || latest.status === 'submitted') return;
      const next = submitSession(latest, isSessionExpired(latest) ? 'timeout' : reason);
      publish(next);
      await flush();
    } finally {
      finishing.current = false;
    }
  }, [flush, publish]);

  useEffect(() => {
    const check = () => {
      const value = current.current;
      if (value && isSessionExpired(value) && Date.now() - lastTimeoutAttempt.current > 15000) {
        lastTimeoutAttempt.current = Date.now();
        void finish('timeout').catch(() => undefined);
      }
    };
    check();
    const timer = setInterval(check, 1000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [session?.id, finish]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      void flush().catch(() => undefined);
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [flush]);

  return { session, files, loading, loadError, error, saveState,
    changeText, addFiles, removeFile, selectQuestion, toggleMark, flush, finish };
}
