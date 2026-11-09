<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, type ExamRecord, type Question, type TheoryQuestion } from '../api';
import { auth, refreshAuth } from '../auth';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ExamRecordList from '../components/ExamRecordList.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadingBlock from '../components/LoadingBlock.vue';
import StatusTag from '../components/StatusTag.vue';
import UiButton from '../components/UiButton.vue';
import UiCard from '../components/UiCard.vue';
import { filesFor, type StoredFile } from '../exam/files';
import { examDeadline, examLocation, examName, clockLabel, isLoginError, practicalFromRecord, restoreFileIds } from '../exam/presentation';
import { createSession, questionStatus, readSession, rememberSession } from '../exam/session';
import { createTheorySession, readTheory, rememberTheory, toExamPayload } from '../exam/theory';

const route = useRoute();
const router = useRouter();
const questions = ref<Question[]>([]);
const theoryQuestions = ref<TheoryQuestion[]>([]);
const version = ref('');
const records = ref<ExamRecord[]>([]);
const papersReady = ref(false);
const paperError = ref('');
const errors = ref({ practical: '', theory: '' });
const startError = ref('');
const busy = ref(false);
const now = ref(Date.now());
const pending = ref<ExamRecord['mode']>();
const resumeFiles = ref<StoredFile[]>();
let clock: number;

const practicalRules = [
  { label: '1.1 业务数据流程设计 / 1.2 业务模块效果优化', points: 25, note: '10 选 1' },
  { label: '2.1 数据清洗与标注', points: 15, note: '5 选 1' },
  { label: '2.2 模型开发与测试', points: 20, note: '5 选 1' },
  { label: '3.1 智能产品数据分析与优化', points: 15, note: '5 选 1' },
  { label: '3.2 人机交互流程设计', points: 20, note: '5 选 1' },
  { label: '4.1 培训大纲编写 / 4.2 数据采集、处理与标注指导', points: 5, note: '10 选 1' },
];
const theoryRules = [
  { label: '判断题', points: 20, note: '40 题，每题 0.5 分' },
  { label: '单选题', points: 70, note: '140 题，每题 0.5 分' },
  { label: '多选题', points: 10, note: '10 题，每题 1 分' },
];
const subjects = computed(() => [
  { key: 'theory' as const, label: '理论知识', bank: 900, count: 190, minutes: 90, ready: theoryQuestions.value.length >= 900, exam: 'theory' as const, practice: 'theory-practice' as const, rules: theoryRules },
  { key: 'practical' as const, label: '操作技能', bank: 40, count: 6, minutes: 120, ready: questions.value.length === 40, exam: 'exam' as const, practice: 'practice' as const, rules: practicalRules },
]);
const recent = computed(() => records.value.filter((exam) => exam.status === 'submitted').slice(0, 6));
const resume = computed(() => records.value.find((exam) => exam.status === 'active' && (examDeadline(exam) ?? Infinity) > now.value));
const remaining = computed(() => {
  const deadline = resume.value && examDeadline(resume.value);
  return deadline === undefined ? undefined : clockLabel(deadline - now.value);
});
watch(() => resume.value?.id, async (id, _oldId, onCleanup) => {
  resumeFiles.value = undefined;
  if (!id || (resume.value?.mode !== 'exam' && resume.value?.mode !== 'practice')) return;
  let current = true;
  onCleanup(() => { current = false; });
  try {
    const stored = await filesFor(id);
    if (current) resumeFiles.value = stored;
  } catch {
    // The server record still provides the saved text if IndexedDB is unavailable.
  }
});
const answered = computed(() => {
  const exam = resume.value;
  if (!exam) return 0;
  if (exam.mode === 'exam' || exam.mode === 'practice') {
    const local = readSession(exam.id) ?? practicalFromRecord(exam, version.value);
    if (local && questions.value.length) {
      if (resumeFiles.value) restoreFileIds(local, resumeFiles.value);
      return questions.value.filter((question) => exam.questionIds.includes(question.id) && questionStatus(question, local) === 'complete').length;
    }
  } else {
    const local = readTheory(exam.id);
    if (local) return exam.questionIds.filter((id) => local.answers[id]?.length).length;
  }
  return exam.questionIds.filter((id) => Object.values(exam.answers?.[id] ?? {}).some((field) => field.text?.trim())).length;
});

async function loadBank(key: 'practical' | 'theory') {
  errors.value[key] = '';
  try {
    if (key === 'theory') {
      theoryQuestions.value = (await api.theoryBank()).bank.questions;
      if (theoryQuestions.value.length < 900) throw new Error('理论题库尚不完整，请稍后重试。');
    } else {
      const { bank } = await api.bank();
      questions.value = bank.questions;
      version.value = bank.bankVersion;
      if (questions.value.length !== 40) throw new Error('操作技能题库尚不完整，请稍后重试。');
    }
  } catch (reason) {
    errors.value[key] = reason instanceof Error ? reason.message : '题库未能加载。';
  }
}

async function loadPapers() {
  if (!auth.user) return;
  paperError.value = '';
  papersReady.value = false;
  try {
    const { record } = await api.learning();
    records.value = Object.values(record.exams || {}).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (reason) {
    paperError.value = reason instanceof Error ? reason.message : '答卷未能加载。';
    if (isLoginError(paperError.value)) await refreshAuth();
  } finally {
    papersReady.value = true;
  }
}

onMounted(() => {
  void loadBank('practical');
  void loadBank('theory');
  void loadPapers();
  clock = window.setInterval(() => { now.value = Date.now(); }, 1000);
  const mode = route.query.start;
  if (auth.user && (mode === 'practice' || mode === 'exam' || mode === 'theory' || mode === 'theory-practice')) {
    pending.value = mode;
    void router.replace({ path: '/' });
  }
});
onUnmounted(() => window.clearInterval(clock));

function chooseMode(mode: ExamRecord['mode']) {
  if (auth.user) pending.value = mode;
  else void router.push({ name: 'account', query: { next: router.resolve({ name: 'home', query: { start: mode } }).fullPath } });
}

async function start() {
  const mode = pending.value;
  if (!mode || busy.value) return;
  const subject = subjects.value.find((item) => item.exam === mode || item.practice === mode);
  if (!subject?.ready) return;
  pending.value = undefined;
  busy.value = true;
  startError.value = '';
  try {
    if (mode === 'practice' || mode === 'exam') {
      const session = createSession(mode, questions.value, version.value);
      await api.saveExam(session);
      rememberSession(session);
      await router.push(examLocation(session));
    } else {
      const session = createTheorySession(mode, theoryQuestions.value);
      await api.saveExam(toExamPayload(session));
      rememberTheory(session);
      await router.push(examLocation(session));
    }
  } catch (reason) {
    startError.value = reason instanceof Error ? reason.message : '没能开始作答。';
    if (isLoginError(startError.value)) {
      await refreshAuth();
      chooseMode(mode);
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="page">
    <header class="page-title">
      <h1>考场工作台</h1>
      <p>人工智能训练师三级 · 理论知识与操作技能</p>
    </header>

    <UiCard v-if="resume" class="resume" aria-labelledby="resume-title">
      <div>
        <StatusTag tone="blue">进行中</StatusTag>
        <h2 id="resume-title">{{ examName(resume.mode) }}</h2>
        <p class="small muted">继续上次的答卷</p>
      </div>
      <dl class="resume-meta nums">
        <div><dt>已答</dt><dd>{{ answered }} / {{ resume.questionIds.length }}</dd></div>
        <div v-if="remaining !== undefined"><dt>剩余时间</dt><dd>{{ remaining }}</dd></div>
      </dl>
      <UiButton :to="examLocation(resume)">继续作答</UiButton>
    </UiCard>
    <LoadingBlock v-else-if="auth.user && !papersReady" label="正在查找进行中的答卷…" />

    <p v-if="startError" class="error start-error" role="alert">{{ startError }}</p>
    <div class="subjects" aria-label="考试入口">
      <UiCard v-for="subject in subjects" :key="subject.key" class="subject">
        <header class="subject-head">
          <h2>{{ subject.label }}</h2><p class="muted small nums">练习题库 {{ subject.bank }} 题</p>
        </header>
        <dl class="facts nums">
          <div><dt>模拟题量</dt><dd>{{ subject.count }} <span>题</span></dd></div>
          <div><dt>限时</dt><dd>{{ subject.minutes }} <span>分钟</span></dd></div>
          <div><dt>满分</dt><dd>100 <span>分</span></dd></div>
        </dl>
        <div class="actions">
          <UiButton :variant="resume ? 'entry' : 'primary'" :disabled="busy || (Boolean(auth.user) && !subject.ready)" @click="chooseMode(subject.exam)">开始模拟考试</UiButton>
          <UiButton variant="ghost" :disabled="busy || (Boolean(auth.user) && !subject.ready)" @click="chooseMode(subject.practice)">开始练习</UiButton>
        </div>
        <div v-if="errors[subject.key]" class="small error" role="alert">{{ errors[subject.key] }} <UiButton variant="text" compact @click="loadBank(subject.key)">重试加载</UiButton></div>
        <p v-else-if="!subject.ready" class="small muted" role="status">正在加载题库…</p>
        <details class="rules">
          <summary>查看考核方案</summary>
          <div class="rule-table">
            <table><tbody>
              <tr v-for="rule in subject.rules" :key="rule.label">
                <td>{{ rule.label }}<br /><small class="muted">{{ rule.note }}</small></td>
                <td class="nums">{{ rule.points }} 分</td>
              </tr>
            </tbody></table>
          </div>
        </details>
      </UiCard>
    </div>

    <section class="recent">
      <header class="section-title"><h2>最近成绩</h2><router-link v-if="auth.user" to="/account">查看全部答卷</router-link></header>
      <EmptyState v-if="!auth.user" title="登录后查看答卷和成绩"><UiButton to="/account" variant="ghost">登录</UiButton></EmptyState>
      <LoadingBlock v-else-if="!papersReady" label="正在加载答卷…" />
      <EmptyState v-else-if="paperError" error title="答卷未能加载" :detail="paperError"><UiButton variant="ghost" @click="loadPapers">重试</UiButton></EmptyState>
      <ExamRecordList v-else-if="recent.length" :records="recent" />
      <EmptyState v-else title="暂无已交卷的成绩" detail="交卷后可在这里查看记录。" />
    </section>

    <ConfirmDialog
      :open="Boolean(pending)" :title="pending ? examName(pending) : '开始作答'" cancel-label="取消" confirm-variant="primary"
      :confirm-label="pending && subjects.some((item) => item.ready && (item.exam === pending || item.practice === pending)) ? '开始作答' : undefined"
      @close="pending = undefined" @confirm="start"
    >
      <p v-if="pending === 'exam'">共 6 题，满分 100 分。点击开始作答后计时 120 分钟。</p>
      <p v-else-if="pending === 'theory'">共 190 题，满分 100 分。点击开始作答后计时 90 分钟。</p>
      <p v-else-if="pending">练习 {{ pending === 'practice' ? 40 : 900 }} 题，作答不限时。</p>
      <p v-if="pending && !subjects.some((item) => item.ready && (item.exam === pending || item.practice === pending))" class="muted">题库尚未就绪，请稍候。</p>
    </ConfirmDialog>
  </main>
</template>

<style scoped>
.resume { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--sp-6); border-inline-start: 4px solid var(--blue); }
.resume h2 { font-size: var(--fs-xl); margin: var(--sp-1) 0 var(--sp-2); }
.resume-meta { display: flex; gap: var(--sp-5); }
.resume-meta dt, .facts dt { color: var(--muted); font-size: var(--fs-xs); }
.resume-meta dd, .facts dd { font-size: var(--fs-xl); font-weight: 700; }
.subjects { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); margin-top: var(--sp-4); }
.subject-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: var(--sp-2); }
.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-block: var(--sp-4); padding-block: var(--sp-3); border-block: 1px solid var(--line); }
.facts div + div { border-inline-start: 1px solid var(--line); padding-inline-start: var(--sp-4); }
.facts dd { white-space: nowrap; }
.facts dd span { font-size: var(--fs-sm); font-weight: 400; }
.rules { margin-top: var(--sp-3); }
.rules summary { width: fit-content; padding-block: var(--sp-1); color: var(--blue); font-size: var(--fs-sm); }
.rules td:last-child { text-align: right; white-space: nowrap; }
.recent { margin-top: var(--sp-6); }
.start-error { margin-block: var(--sp-3); }
@media (max-width: 980px) { .subjects { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 560px) {
  .resume { grid-template-columns: minmax(0, 1fr) auto; gap: var(--sp-2); padding-block: var(--sp-3); }
  .resume > div:first-child { grid-column: 1 / -1; }
  .resume-meta { gap: var(--sp-3); }
  .subject { padding-block: var(--sp-3); }
  .facts { margin-block: var(--sp-3); padding-block: var(--sp-2); }
  .facts div + div { padding-inline-start: var(--sp-2); }
  .rules { margin-top: var(--sp-2); }
}
</style>
