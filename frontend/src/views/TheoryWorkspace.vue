<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api, type TheoryQuestion } from '../api';
import { refreshAuth } from '../auth';
import AnswerSheet from '../components/AnswerSheet.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import EmptyState from '../components/EmptyState.vue';
import ExamTopBar from '../components/ExamTopBar.vue';
import LoadingBlock from '../components/LoadingBlock.vue';
import SaveIndicator from '../components/SaveIndicator.vue';
import StatusTag from '../components/StatusTag.vue';
import UiButton from '../components/UiButton.vue';
import { canUseExamShortcut, examName, isLoginError } from '../exam/presentation';
import { choicesOf, readTheory, rememberTheory, sessionFromRecord, toExamPayload, type TheorySession } from '../exam/theory';
import { useExamSave } from '../exam/useExamSave';

const route = useRoute();
const session = ref<TheorySession | null>(null);
const questions = ref<Record<string, TheoryQuestion>>({});
const index = ref(0);
const now = ref(Date.now());
const loadError = ref('');
const error = ref('');
const notice = ref('');
const checking = ref(false);
const submitting = ref(false);
const grading = ref(false);
const confirming = ref(false);
const sheetOpen = ref(false);
const reveal = ref<Record<string, { correct: boolean; answer: string[] }>>({});
const openKinds = ref<Record<string, boolean>>({ judge: true, single: false, multi: false });
const body = ref<HTMLElement>();
const paperPane = ref<HTMLElement>();
const title = ref<HTMLElement>();
let clock: number;
let autoAttempted = false;

const { status, savedAt, error: saveError, schedule, flush, resume } = useExamSave(() => session.value ? toExamPayload(session.value) : undefined);
const kinds = { judge: '判断题', single: '单选题', multi: '多选题' };
const paper = computed(() => (session.value?.questionIds || []).map((id) => questions.value[id]).filter((item): item is TheoryQuestion => Boolean(item)));
const current = computed(() => paper.value[index.value]);
const remaining = computed(() => session.value?.deadlineAt === undefined ? undefined : Math.max(0, session.value.deadlineAt - now.value));
const locked = computed(() => session.value?.status === 'submitted');
const expired = computed(() => !locked.value && remaining.value === 0);
const readOnly = computed(() => locked.value || submitting.value || expired.value);
const markedCount = computed(() => session.value?.markedQuestionIds.length ?? 0);
const answeredCount = computed(() => paper.value.filter((item) => selected(item.id).length).length);
const groups = computed(() => (Object.keys(kinds) as TheoryQuestion['kind'][]).map((kind) => ({
  id: kind,
  title: kinds[kind],
  open: openKinds.value[kind],
  items: paper.value.filter((item) => item.kind === kind).map((item, i) => ({
    id: item.id, label: String(i + 1), current: current.value?.id === item.id,
    state: selected(item.id).length ? 'complete' as const : 'empty' as const,
    marked: session.value?.markedQuestionIds.includes(item.id),
  })),
})));
const ordinal = computed(() => groups.value.find((group) => group.id === current.value?.kind)?.items.find((item) => item.current)?.label);
const verdict = computed(() => {
  const id = current.value?.id;
  if (!id) return;
  const item = session.value?.assessment?.items.find((entry) => entry.questionId === id);
  return item?.answer ? { correct: Boolean(item.correct), answer: item.answer } : reveal.value[id];
});
const loginTarget = computed(() => ({ name: 'account', query: { next: route.fullPath } }));

async function load() {
  loadError.value = '';
  try {
    const { bank } = await api.theoryBank();
    questions.value = Object.fromEntries(bank.questions.map((item) => [item.id, item]));
    const id = String(route.params.id);
    let exam = readTheory(id);
    if (!exam) {
      const { record } = await api.learning();
      const saved = record.exams?.[id];
      exam = saved ? sessionFromRecord(saved) : null;
    }
    if (!exam) throw new Error('没有找到这份理论答卷。');
    if (!exam.questionIds.some((questionId) => questions.value[questionId])) throw new Error('找不到答卷中的题目，请返回答卷列表。');
    session.value = exam;
    const lastId = sessionStorage.getItem(`aigraph-theory-position:${id}`);
    const position = paper.value.findIndex((item) => item.id === lastId);
    index.value = Math.max(0, position);
    if (current.value) openKinds.value[current.value.kind] = true;
    rememberTheory(exam);
    tick();
    if (!locked.value && !expired.value) resume();
  } catch (reason) {
    loadError.value = reason instanceof Error ? reason.message : '理论题库没有载入。';
    if (isLoginError(loadError.value)) await refreshAuth();
  }
}

function tick() {
  now.value = Date.now();
  if (expired.value && !autoAttempted && !submitting.value) {
    autoAttempted = true;
    void submit('timeout');
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

function selected(id: string) { return session.value?.answers[id] || []; }
function choose(key: string) {
  const question = current.value;
  const exam = session.value;
  if (!question || !exam || readOnly.value) return;
  const existing = selected(question.id);
  const next = question.kind !== 'multi' ? [key] : existing.includes(key)
    ? existing.filter((item) => item !== key) : [...existing, key].sort();
  exam.answers[question.id] = next;
  delete reveal.value[question.id];
  saveDraft(exam);
}
function toggleMark() {
  const question = current.value;
  const exam = session.value;
  if (!question || !exam || readOnly.value) return;
  const marks = new Set(exam.markedQuestionIds);
  if (marks.has(question.id)) marks.delete(question.id);
  else marks.add(question.id);
  exam.markedQuestionIds = [...marks];
  saveDraft(exam);
}
function saveDraft(exam: TheorySession) {
  exam.updatedAt = Date.now();
  rememberTheory(exam);
  schedule();
}

function reviewMarks() {
  const positions = paper.value.map((item, position) => session.value?.markedQuestionIds.includes(item.id) ? position : -1).filter((position) => position >= 0);
  const next = positions.find((position) => position > index.value) ?? positions[0];
  if (next === undefined) {
    notice.value = '还没有标记题目。';
  } else if (next === index.value) {
    notice.value = '标记题目已经在当前题。';
  } else {
    notice.value = '';
    void go(next);
  }
}
async function go(position: number) {
  const item = paper.value[position];
  if (!item || !session.value) return;
  index.value = position;
  openKinds.value[item.kind] = true;
  sessionStorage.setItem(`aigraph-theory-position:${session.value.id}`, item.id);
  await nextTick();
  if (body.value) body.value.scrollTop = 0;
  if (paperPane.value) paperPane.value.scrollTop = 0;
  title.value?.focus({ preventScroll: true });
}
function selectQuestion(id: string) {
  sheetOpen.value = false;
  void go(paper.value.findIndex((item) => item.id === id));
}
function toggleGroup(id: string) { openKinds.value[id] = !openKinds.value[id]; }
function shortcuts(event: KeyboardEvent) {
  if (!current.value || confirming.value || sheetOpen.value || !canUseExamShortcut(event)) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    void go(index.value + (event.key === 'ArrowLeft' ? -1 : 1));
    return;
  }
  if (readOnly.value || event.repeat) return;
  const slot = '1234'.indexOf(event.key);
  const letter = 'abcd'.indexOf(event.key.toLowerCase());
  if (event.key.length !== 1 || (slot < 0 && letter < 0)) return;
  const choice = choicesOf(current.value)[slot >= 0 ? slot : letter];
  if (choice) {
    event.preventDefault();
    choose(choice.key);
  }
}
async function checkCurrent() {
  const question = current.value;
  if (!question || session.value?.mode !== 'theory-practice' || readOnly.value || checking.value) return;
  checking.value = true;
  error.value = '';
  const choices = [...selected(question.id)];
  try {
    const result = await api.theoryCheck(question.id, choices);
    if (choices.join(',') === selected(question.id).join(',')) reveal.value[question.id] = result;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没能核对这道题。';
    if (isLoginError(error.value)) await refreshAuth();
  } finally {
    checking.value = false;
  }
}
async function grade() {
  const exam = session.value;
  if (!exam || exam.status !== 'submitted' || grading.value) return;
  grading.value = true;
  error.value = '';
  try {
    exam.assessment = await api.theoryGrade(exam.id);
    rememberTheory(exam);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '评分未完成，请重试。';
    if (isLoginError(error.value)) await refreshAuth();
  } finally {
    grading.value = false;
  }
}
async function submit(reason: 'manual' | 'timeout') {
  const exam = session.value;
  if (!exam || locked.value || submitting.value) return;
  submitting.value = true;
  confirming.value = false;
  error.value = '';
  const submittedAt = Date.now();
  const submissionReason = exam.deadlineAt && submittedAt >= exam.deadlineAt ? 'timeout' : reason;
  const next: TheorySession = { ...exam, status: 'submitted', submittedAt, updatedAt: submittedAt, submissionReason, deadlineAt: undefined };
  const saved = await flush(toExamPayload(next));
  if (saved) {
    Object.assign(exam, next);
    rememberTheory(exam);
    notice.value = submissionReason === 'timeout' ? '时间到，试卷已交卷。' : '试卷已交卷。';
    await grade();
  } else {
    error.value = '交卷未完成，请重试。';
    if (exam.deadlineAt && Date.now() >= exam.deadlineAt) autoAttempted = true;
  }
  submitting.value = false;
}
function retrySave() {
  if (expired.value) void submit('timeout');
  else void flush();
}
</script>

<template>
  <main v-if="session && current" class="exam-page">
    <ExamTopBar :title="examName(session.mode)" :answered="answeredCount" :total="paper.length" :milliseconds="remaining" :submitted="locked" :busy="submitting" @sheet="sheetOpen = true" @submit="expired ? submit('timeout') : confirming = true" />
    <div ref="body" class="exam-body theory">
      <aside class="exam-rail">
        <AnswerSheet :groups="groups" compact @select="selectQuestion" @toggle="toggleGroup" />
        <div class="review-tools">
          <p class="muted small nums">已标记 {{ markedCount }} 题 · 未答 {{ paper.length - answeredCount }} 题</p>
          <UiButton variant="ghost" compact @click="reviewMarks">标记复审</UiButton>
        </div>
      </aside>
      <article ref="paperPane" class="exam-paper">
        <div class="exam-paper-inner theory-paper">
          <div v-if="session.assessment" class="grade">
            <span>整卷得分</span> <strong class="nums">{{ session.assessment.total }} / {{ session.assessment.maxTotal }}</strong>
          </div>
          <p v-if="notice" class="success small" role="status">{{ notice }}</p>
          <p v-if="error" class="error small" role="alert">{{ error }}</p>
          <div class="question-meta">
            <span class="muted nums small">第 {{ index + 1 }} 题 / 共 {{ paper.length }} 题</span>
            <StatusTag>{{ kinds[current.kind] }} {{ ordinal }} · {{ current.points }} 分</StatusTag>
          </div>
          <h2 ref="title" tabindex="-1" class="theory-stem">{{ current.stem }}</h2>
          <div class="theory-options" role="group" aria-label="作答选项">
            <label v-for="choice in choicesOf(current)" :key="choice.key" :class="{ picked: selected(current.id).includes(choice.key) }">
              <input :type="current.kind === 'multi' ? 'checkbox' : 'radio'" :name="current.id" :checked="selected(current.id).includes(choice.key)" :disabled="readOnly" @change="choose(choice.key)" />
              <span>{{ current.kind === 'judge' ? choice.text : `${choice.key}. ${choice.text}` }}</span>
            </label>
          </div>
          <p v-if="verdict" class="theory-result" :class="verdict.correct ? 'correct' : 'incorrect'" role="status">
            {{ verdict.correct ? '回答正确' : '回答错误' }} · 正确答案 {{ verdict.answer.join('、') }}
          </p>
          <div class="actions theory-tools">
            <label><input type="checkbox" :checked="session.markedQuestionIds.includes(current.id)" :disabled="readOnly" @change="toggleMark" /> 标记此题</label>
            <UiButton class="mobile-review" variant="text" @click="reviewMarks">标记复审</UiButton>
            <UiButton v-if="session.mode === 'theory-practice' && !locked" variant="ghost" :disabled="checking || readOnly" @click="checkCurrent">{{ checking ? '核对中…' : '核对答案' }}</UiButton>
          </div>
        </div>
      </article>
    </div>
    <footer class="exam-footer">
      <UiButton variant="ghost" :disabled="index === 0" @click="go(index - 1)">上一题</UiButton>
      <UiButton v-if="isLoginError(saveError) || isLoginError(error)" :to="loginTarget" variant="text">重新登录</UiButton>
      <SaveIndicator v-else :status="status" :saved-at="savedAt" :error="saveError" :disabled="submitting" @retry="retrySave" />
      <div class="actions">
        <UiButton v-if="locked && !session.assessment" variant="ghost" :disabled="grading" @click="grade">{{ grading ? '评分中…' : '获取评分' }}</UiButton>
        <UiButton :disabled="index >= paper.length - 1" @click="go(index + 1)">下一题</UiButton>
      </div>
    </footer>
    <ConfirmDialog :open="confirming" title="确认交卷" confirm-label="确认交卷" @close="confirming = false" @confirm="submit('manual')">
      <p>还有 <strong>{{ paper.length - answeredCount }} 道未答</strong>，已标记 {{ markedCount }} 道。交卷后将锁定答案。</p>
    </ConfirmDialog>
    <ConfirmDialog :open="sheetOpen" title="答题卡" cancel-label="关闭答题卡" drawer @close="sheetOpen = false">
      <AnswerSheet :groups="groups" compact @select="selectQuestion" @toggle="toggleGroup" />
    </ConfirmDialog>
  </main>
  <main v-else class="page">
    <EmptyState v-if="loadError" error :title="isLoginError(loadError) ? '登录状态已失效' : '理论答卷未能打开'" :detail="isLoginError(loadError) ? '登录后将返回这份答卷。' : loadError">
      <UiButton v-if="isLoginError(loadError)" :to="loginTarget">重新登录</UiButton>
      <UiButton v-else variant="ghost" @click="load">重试</UiButton>
      <router-link to="/account">返回答卷列表</router-link>
    </EmptyState>
    <LoadingBlock v-else label="正在打开理论答卷…" />
  </main>
</template>

<style scoped>
.theory-paper { max-width: min(72ic, 56rem); margin-inline-start: 0; }
.question-meta { display: flex; align-items: baseline; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-2); }
.theory-paper .theory-stem { font: 700 var(--fs-lg)/1.7 var(--font-sans); }
.theory-options { display: grid; gap: var(--sp-3); }
.theory-options label {
  display: flex; align-items: baseline; gap: var(--sp-3); min-height: 44px;
  padding: var(--sp-2) var(--sp-3); background: var(--sheet); border: 1px solid var(--control-line);
  border-radius: var(--radius); cursor: pointer; overflow-wrap: anywhere;
}
.theory-options label:hover, .theory-options label.picked { border-color: var(--blue); background: var(--blue-soft); }
.theory-options label:has(:disabled) { cursor: default; }
.theory-result { margin-top: var(--sp-4); padding: var(--sp-3); border-radius: var(--radius-sm); }
.theory-result.correct { color: var(--ok); background: var(--ok-soft); }
.theory-result.incorrect { color: var(--seal); background: var(--seal-soft); }
.theory-tools, .review-tools { margin-top: var(--sp-4); }
.review-tools .btn { margin-top: var(--sp-2); }
.mobile-review { display: none; }
@media (max-width: 980px) { .mobile-review { display: inline-flex; } }
</style>
