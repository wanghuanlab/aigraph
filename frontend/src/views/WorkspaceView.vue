<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api, type AnswerField, type Question } from '../api';
import { refreshAuth } from '../auth';
import AnswerSheet from '../components/AnswerSheet.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import EmptyState from '../components/EmptyState.vue';
import ExamTopBar from '../components/ExamTopBar.vue';
import LoadingBlock from '../components/LoadingBlock.vue';
import QuestionBody from '../components/QuestionBody.vue';
import SaveIndicator from '../components/SaveIndicator.vue';
import UiButton from '../components/UiButton.vue';
import { fileToBase64, filesFor, removeAnswerFile, saveAnswerFile, type StoredFile } from '../exam/files';
import { canUseExamShortcut, examName, isLoginError, practicalFromRecord, restoreFileIds } from '../exam/presentation';
import { isSessionExpired, questionStatus, readSession, remainingMilliseconds, rememberSession, submitSession, type ExamSession } from '../exam/session';
import { useExamSave } from '../exam/useExamSave';

const route = useRoute();
const questions = ref<Record<string, Question>>({});
const session = ref<ExamSession | null>(null);
const loadError = ref('');
const error = ref('');
const notice = ref('');
const now = ref(Date.now());
const examFiles = ref<StoredFile[]>([]);
const confirming = ref(false);
const sheetOpen = ref(false);
const submitting = ref(false);
const grading = ref(false);
const fileBusy = ref(false);
const dragging = ref('');
const body = ref<HTMLElement>();
const paperPane = ref<HTMLElement>();
const answerPane = ref<HTMLElement>();
const title = ref<HTMLElement>();
let clock: number;
let autoAttempted = false;

const { status, savedAt, error: saveError, schedule, flush, resume } = useExamSave(() => session.value ?? undefined);
const current = computed(() => session.value && questions.value[session.value.currentQuestionId]);
const files = computed(() => examFiles.value.filter((file) => file.questionId === current.value?.id));
const index = computed(() => session.value?.questionIds.indexOf(session.value.currentQuestionId) ?? 0);
const locked = computed(() => session.value?.status === 'submitted');
const expired = computed(() => session.value ? isSessionExpired(session.value, now.value) : false);
const readOnly = computed(() => locked.value || submitting.value || expired.value);
const remaining = computed(() => session.value?.mode === 'exam' ? remainingMilliseconds(session.value, now.value) : undefined);
const items = computed(() => {
  const exam = session.value;
  if (!exam) return [];
  return exam.questionIds.map((id) => {
    const question = questions.value[id];
    return {
      id, label: id, title: question?.title, points: question?.points,
      state: question ? questionStatus(question, exam) : 'empty' as const,
      current: id === exam.currentQuestionId,
    };
  });
});
const groups = computed(() => [{ id: 'practical', items: items.value }]);
const answered = computed(() => items.value.filter((item) => item.state === 'complete').length);
const unfinished = computed(() => items.value.filter((item) => item.state === 'partial').length);
const unanswered = computed(() => items.value.length - answered.value - unfinished.value);
const loginTarget = computed(() => ({ name: 'account', query: { next: route.fullPath } }));

async function load() {
  loadError.value = '';
  error.value = '';
  try {
    const { bank } = await api.bank();
    questions.value = Object.fromEntries(bank.questions.map((question) => [question.id, question]));
    const id = String(route.params.id);
    let exam = readSession(id);
    if (!exam) {
      const { record } = await api.learning();
      const saved = record.exams[id];
      exam = saved ? practicalFromRecord(saved, bank.bankVersion) : null;
      if (!exam) throw new Error('没有找到这份操作技能答卷。');
    }
    if (!questions.value[exam.currentQuestionId]) throw new Error('找不到答卷中的题目，请返回答卷列表。');
    session.value = exam;
    rememberSession(exam);
    await refreshFiles();
    tick();
    if (!locked.value && !expired.value) resume();
  } catch (reason) {
    loadError.value = reason instanceof Error ? reason.message : '答卷没有打开。';
    if (isLoginError(loadError.value)) await refreshAuth();
  }
}

function tick() {
  now.value = Date.now();
  if (expired.value && !autoAttempted && !fileBusy.value && !submitting.value) {
    autoAttempted = true;
    void finish('timeout');
  }
}

onMounted(() => {
  clock = window.setInterval(tick, 1000);
  window.addEventListener('keydown', shortcuts);
  void load();
});
onUnmounted(() => {
  window.clearInterval(clock);
  window.removeEventListener('keydown', shortcuts);
});

async function refreshFiles() {
  const exam = session.value;
  if (!exam) return;
  try {
    const stored = await filesFor(exam.id);
    if (session.value !== exam) return;
    examFiles.value = stored;
    restoreFileIds(exam, stored);
    rememberSession(exam);
  } catch {
    error.value = '未能读取当前浏览器里的附件。';
  }
}

function answerText(questionId: string, fieldId: string) {
  return session.value?.answers[questionId]?.[fieldId]?.text || '';
}
function setText(questionId: string, fieldId: string, text: string) {
  const exam = session.value;
  if (!exam || readOnly.value) return;
  const bucket = exam.answers[questionId] ??= {};
  const answer = bucket[fieldId] ??= { text: '', fileIds: [] };
  answer.text = text;
  exam.updatedAt = Date.now();
  rememberSession(exam);
  schedule();
}
async function jump(id: string) {
  const exam = session.value;
  sheetOpen.value = false;
  if (!exam || !exam.questionIds.includes(id) || !questions.value[id]) return;
  if (exam.currentQuestionId !== id) {
    exam.currentQuestionId = id;
    rememberSession(exam);
  }
  await nextTick();
  for (const pane of [body.value, paperPane.value, answerPane.value]) if (pane) pane.scrollTop = 0;
  title.value?.focus({ preventScroll: true });
}
function move(step: number) {
  const next = session.value?.questionIds[index.value + step];
  if (next) void jump(next);
}
function shortcuts(event: KeyboardEvent) {
  if (!canUseExamShortcut(event) || sheetOpen.value || confirming.value || !current.value) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  }
}
async function finish(reason: 'manual' | 'timeout') {
  const exam = session.value;
  if (!exam || locked.value || submitting.value || fileBusy.value) return;
  const next = submitSession(exam, reason);
  submitting.value = true;
  confirming.value = false;
  error.value = '';
  const saved = await flush(next);
  if (saved) {
    // Keep navigation and locally restored attachment metadata from the active view.
    Object.assign(exam, {
      status: next.status, submittedAt: next.submittedAt,
      submissionReason: next.submissionReason, updatedAt: next.updatedAt,
    });
    rememberSession(exam);
    notice.value = next.submissionReason === 'timeout' ? '时间到，试卷已交卷。' : '试卷已交卷。可以开始 AI 阅卷。';
  } else {
    error.value = '交卷未完成，请重试。';
    if (isSessionExpired(exam)) autoAttempted = true;
  }
  submitting.value = false;
}
function retrySave() {
  if (expired.value) void finish('timeout');
  else void flush();
}

function matchesAccepted(file: File, accept: string) {
  return accept.split(',').map((part) => part.trim().toLowerCase()).some((part) => {
    if (!part) return true;
    if (part.startsWith('.')) return file.name.toLowerCase().endsWith(part);
    if (part.endsWith('/*')) return file.type.toLowerCase().startsWith(part.slice(0, -1));
    return file.type.toLowerCase() === part;
  });
}
async function addFiles(questionId: string, field: AnswerField, list: FileList | null, dropped = false) {
  const exam = session.value;
  dragging.value = '';
  if (!exam || !list?.length || readOnly.value || fileBusy.value) return;
  const selected = Array.from(list).slice(0, field.multiple ? list.length : 1);
  if (dropped && field.accept && selected.some((file) => !matchesAccepted(file, field.accept!))) {
    error.value = `请选择以下格式的文件：${field.accept}`;
    return;
  }
  error.value = '';
  fileBusy.value = true;
  try {
    const bucket = exam.answers[questionId] ??= {};
    const answer = bucket[field.id] ??= { text: '', fileIds: [] };
    for (const file of selected) {
      const stored = { id: crypto.randomUUID(), sessionId: exam.id, questionId, fieldId: field.id, name: file.name, size: file.size, type: file.type, blob: file };
      await saveAnswerFile(stored);
      answer.fileIds.push(stored.id);
    }
  } catch {
    error.value = '附件未能全部保存到这台浏览器，请检查后重试。';
  } finally {
    rememberSession(exam);
    await refreshFiles();
    fileBusy.value = false;
  }
}
function pickFiles(questionId: string, field: AnswerField, event: Event) {
  const input = event.target as HTMLInputElement;
  void addFiles(questionId, field, input.files);
  input.value = '';
}
async function dropFile(file: StoredFile) {
  const exam = session.value;
  if (!exam || readOnly.value || fileBusy.value) return;
  fileBusy.value = true;
  error.value = '';
  try {
    await removeAnswerFile(file.id);
    const answer = exam.answers[file.questionId]?.[file.fieldId];
    if (answer) answer.fileIds = answer.fileIds.filter((id) => id !== file.id);
    rememberSession(exam);
    await refreshFiles();
  } catch {
    error.value = '附件未能移除，请重试。';
  } finally {
    fileBusy.value = false;
  }
}

function asset(key: string) { return `/exam-assets/${key.replace(/^\/+/, '')}`; }
function size(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
async function grade() {
  const exam = session.value;
  if (!exam || !locked.value || grading.value) return;
  grading.value = true;
  error.value = '';
  notice.value = '正在阅卷…';
  try {
    const images = [];
    const stored = await filesFor(exam.id);
    for (const questionId of exam.questionIds) {
      const question = questions.value[questionId];
      if (!question) continue;
      for (const section of question.answerSections) {
        for (const field of section.fields) {
          if (field.kind !== 'file') continue;
          for (const file of stored.filter((item) => item.questionId === questionId && item.fieldId === field.id)) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || images.length >= 6 || file.size > 1_200_000) continue;
            images.push({ questionId, fieldId: field.id, name: file.name, mediaType: file.type, dataBase64: await fileToBase64(file.blob) });
          }
        }
      }
    }
    const result = await api.grade(exam.id, images);
    exam.assessment = result.assessment as ExamSession['assessment'];
    rememberSession(exam);
    notice.value = 'AI 阅卷完成。';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '阅卷未完成。';
    if (isLoginError(error.value)) await refreshAuth();
    notice.value = '';
  } finally {
    grading.value = false;
  }
}
const gradeItem = computed(() => session.value?.assessment?.items.find((item) => item.questionId === current.value?.id));
</script>

<template>
  <main v-if="session && current" class="exam-page">
    <ExamTopBar
      :title="examName(session.mode)" :answered="answered" :total="items.length"
      :milliseconds="remaining" :submitted="locked" :busy="submitting || fileBusy"
      @sheet="sheetOpen = true" @submit="expired ? finish('timeout') : confirming = true"
    />
    <div ref="body" class="exam-body">
      <aside class="exam-rail"><AnswerSheet :groups="groups" @select="jump" /></aside>
      <article ref="paperPane" class="exam-paper">
        <div class="exam-paper-inner">
          <p class="small muted nums">第 {{ index + 1 }} 题 / 共 {{ items.length }} 题　{{ current.id }}　{{ current.points }} 分　参考 {{ current.durationMinutes }} 分钟</p>
          <h2 ref="title" tabindex="-1">{{ current.title }}</h2>
          <div class="exam-attachment">
            <div><strong>{{ current.id }}.zip</strong><small class="muted">素材包 · {{ size(current.materials.zip.bytes) }}</small></div>
            <a class="btn text" :href="asset(current.materials.zip.key)" :download="`${current.id}.zip`">下载材料</a>
          </div>
          <QuestionBody :blocks="current.content" />
        </div>
      </article>
      <aside ref="answerPane" class="exam-answer" aria-label="作答区">
        <h2>作答区</h2>
        <div v-if="session.assessment" class="grade">
          <span>整卷得分</span> <strong class="nums">{{ session.assessment.total }} / {{ session.assessment.maxTotal }}</strong>
          <p v-if="gradeItem">本题 {{ gradeItem.suggestedPoints }} / {{ gradeItem.maxPoints }} 分</p>
          <p>{{ gradeItem?.reason || '这题暂无评语。' }}</p>
        </div>
        <p v-if="notice" class="small success" role="status">{{ notice }}</p>
        <p v-if="error" class="error small" role="alert">{{ error }}</p>
        <p class="muted small">附件只保存在这台浏览器。AI 阅卷最多读取 6 张符合要求的图片。</p>
        <section v-for="(section, sectionIndex) in current.answerSections" :key="section.id" class="answer-group">
          <h3>{{ sectionIndex + 1 }}. {{ section.title }}</h3>
          <p v-if="section.description" class="muted small">{{ section.description }}</p>
          <div v-for="field in section.fields" :key="field.id" class="field">
            <label :for="`answer-${field.id}`" class="small">{{ field.label }}</label>
            <p v-if="field.description" class="muted small">{{ field.description }}</p>
            <template v-if="field.kind === 'text'">
              <textarea :id="`answer-${field.id}`" class="answer-text" :value="answerText(current.id, field.id)" :placeholder="field.placeholder" :readonly="readOnly" :aria-describedby="`count-${field.id}`" @input="setText(current.id, field.id, ($event.target as HTMLTextAreaElement).value)" />
              <small :id="`count-${field.id}`" class="muted nums">{{ Array.from(answerText(current.id, field.id)).length }} 字</small>
            </template>
            <template v-else>
              <div
                v-if="!readOnly" class="drop-zone" :class="{ dragging: dragging === field.id }"
                @dragover.prevent="dragging = field.id" @dragleave="dragging = ''"
                @drop.prevent="addFiles(current.id, field, $event.dataTransfer?.files ?? null, true)"
              >
                <p class="small">选择文件或拖到这里</p>
                <input :id="`answer-${field.id}`" type="file" :accept="field.accept" :multiple="field.multiple" :disabled="fileBusy" @change="pickFiles(current.id, field, $event)" />
              </div>
              <ul v-if="files.some((file) => file.fieldId === field.id)" class="attachment-list">
                <li v-for="file in files.filter((item) => item.fieldId === field.id)" :key="file.id">
                  <span class="small">✓ {{ file.name }} <small class="muted">{{ size(file.size) }}</small></span>
                  <UiButton v-if="!readOnly" variant="text" compact :disabled="fileBusy" :aria-label="`移除 ${file.name}`" @click="dropFile(file)">移除</UiButton>
                </li>
              </ul>
              <small v-else-if="readOnly" class="muted">当前浏览器没有保存此处的附件。</small>
            </template>
          </div>
        </section>
      </aside>
    </div>
    <footer class="exam-footer">
      <UiButton variant="ghost" :disabled="index === 0" @click="move(-1)">上一题</UiButton>
      <UiButton v-if="isLoginError(saveError) || isLoginError(error)" :to="loginTarget" variant="text">重新登录</UiButton>
      <SaveIndicator v-else :status="status" :saved-at="savedAt" :error="saveError" :disabled="submitting" @retry="retrySave" />
      <div class="actions">
        <UiButton v-if="locked" variant="ghost" :disabled="grading" @click="grade">{{ grading ? '阅卷中…' : session.assessment ? '重新阅卷' : 'AI 阅卷' }}</UiButton>
        <UiButton :disabled="index >= items.length - 1" @click="move(1)">下一题</UiButton>
      </div>
    </footer>
    <ConfirmDialog :open="confirming" title="确认交卷" confirm-label="确认交卷" @close="confirming = false" @confirm="finish('manual')">
      <p>还有 <strong>{{ unanswered }} 道未答</strong>、<strong>{{ unfinished }} 道部分作答</strong>，已标记 {{ session.markedQuestionIds.length }} 道。交卷后将锁定答案。</p>
    </ConfirmDialog>
    <ConfirmDialog :open="sheetOpen" title="答题卡" cancel-label="关闭答题卡" drawer @close="sheetOpen = false">
      <AnswerSheet :groups="groups" @select="jump" />
    </ConfirmDialog>
  </main>
  <main v-else class="page">
    <EmptyState v-if="loadError" error :title="isLoginError(loadError) ? '登录状态已失效' : '答卷未能打开'" :detail="isLoginError(loadError) ? '登录后将返回这份答卷。' : loadError">
      <UiButton v-if="isLoginError(loadError)" :to="loginTarget">重新登录</UiButton>
      <UiButton v-else variant="ghost" @click="load">重试</UiButton>
      <router-link to="/account">返回答卷列表</router-link>
    </EmptyState>
    <LoadingBlock v-else label="正在打开答卷…" />
  </main>
</template>

<style scoped>
.answer-text { field-sizing: content; }
</style>
