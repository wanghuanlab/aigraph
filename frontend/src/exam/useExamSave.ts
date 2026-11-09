import { onUnmounted, ref } from 'vue';
import { api } from '../api';
import { auth } from '../auth';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const writes = new Map<string, Promise<boolean>>();
let draftSequence = 0;

export function useExamSave(getPayload: () => { id: string } | undefined) {
  const status = ref<SaveStatus>('idle');
  const savedAt = ref<number>();
  const error = ref('');
  let timer: number | undefined;
  let revision = 0;

  function draftKey(id: string) { return `aigraph-unsynced-draft:${auth.user?.username ?? ''}:${id}`; }

  function flush(payload = getPayload()) {
    window.clearTimeout(timer);
    timer = undefined;
    if (!payload) return Promise.resolve(false);

    const snapshot = JSON.parse(JSON.stringify(payload)) as { id: string };
    const key = draftKey(payload.id);
    const draft = sessionStorage.getItem(key);
    const version = ++revision;
    status.value = 'saving';
    error.value = '';
    // Serialize snapshots so a delayed autosave cannot overwrite a later submission.
    const write = (writes.get(payload.id) ?? Promise.resolve(true)).then(async () => {
      try {
        await api.saveExam(snapshot);
        if (draft !== null && sessionStorage.getItem(key) === draft) sessionStorage.removeItem(key);
        if (version === revision) {
          status.value = 'saved';
          savedAt.value = Date.now();
        }
        return true;
      } catch (reason) {
        if (version === revision) {
          status.value = 'error';
          error.value = reason instanceof Error ? reason.message : '保存失败';
        }
        return false;
      }
    });
    writes.set(payload.id, write);
    void write.then(() => {
      if (writes.get(payload.id) === write) writes.delete(payload.id);
    });
    return write;
  }

  function schedule() {
    const payload = getPayload();
    if (!payload) return;
    sessionStorage.setItem(draftKey(payload.id), `${Date.now()}:${++draftSequence}`);
    revision += 1;
    status.value = 'saving';
    error.value = '';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { void flush(); }, 400);
  }

  function resume() {
    const payload = getPayload();
    if (payload && sessionStorage.getItem(draftKey(payload.id))) schedule();
  }

  onUnmounted(() => {
    if (timer !== undefined) void flush();
  });

  return { status, savedAt, error, schedule, flush, resume };
}
