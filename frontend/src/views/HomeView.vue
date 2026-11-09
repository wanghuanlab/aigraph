<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, type ExamRecord, type Question, type TheoryQuestion } from '../api';
import { auth } from '../auth';
import { createSession, rememberSession } from '../exam/session';
import { createTheorySession, rememberTheory, sessionFromRecord, toExamPayload } from '../exam/theory';

const router = useRouter();
const questions = ref<Question[]>([]);
const theoryQuestions = ref<TheoryQuestion[]>([]);
const groups = ref<Array<{ id: string; title: string; points: number }>>([]);
const version = ref('');
const exams = ref<ExamRecord[]>([]);
const papersReady = ref(false);
const error = ref('');
const busy = ref(false);

const rules = [
  { label: '1.1 业务数据流程设计 / 1.2 业务模块效果优化', points: 25, note: '10 选 1' },
  { label: '2.1 数据清洗与标注', points: 15, note: '5 选 1' },
  { label: '2.2 模型开发与测试', points: 20, note: '5 选 1' },
  { label: '3.1 智能产品数据分析与优化', points: 15, note: '5 选 1' },
  { label: '3.2 人机交互流程设计', points: 20, note: '5 选 1' },
  { label: '4.1 培训大纲编写 / 4.2 数据采集、处理与标注指导', points: 5, note: '10 选 1' },
];

const papers = computed(() => [...exams.value].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 6));

onMounted(async () => {
  try {
    const result = await api.bank();
    questions.value = result.bank.questions;
    groups.value = result.bank.groups;
    version.value = result.bank.bankVersion;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '题库没有载入。';
  }
  try {
    const result = await api.theoryBank();
    theoryQuestions.value = result.bank.questions;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '理论题库没有载入。';
  }
});

async function loadPapers() {
  try {
    if (!auth.user) return;
    const record = await api.learning();
    exams.value = Object.values(record.record.exams || {});
  } finally {
    papersReady.value = true;
  }
}

onMounted(loadPapers);

async function start(mode: 'practice' | 'exam') {
  if (!auth.user) {
    await router.push({ path: '/account', query: { next: '/' } });
    return;
  }
  if (!questions.value.length) return;
  busy.value = true;
  error.value = '';
  try {
    const session = createSession(mode, questions.value, version.value);
    rememberSession(session);
    await api.saveExam(session);
    await router.push(`/workspace/${session.id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没能开始。';
  } finally {
    busy.value = false;
  }
}

function paperName(mode: ExamRecord['mode']) {
  if (mode === 'theory') return '理论模拟考试';
  if (mode === 'theory-practice') return '理论练习';
  if (mode === 'exam') return '操作模拟考试';
  return '操作全题练习';
}

async function startTheory(mode: 'theory' | 'theory-practice') {
  if (!auth.user) {
    await router.push({ path: '/account', query: { next: '/' } });
    return;
  }
  if (theoryQuestions.value.length < 900) return;
  busy.value = true;
  error.value = '';
  try {
    const session = createTheorySession(mode, theoryQuestions.value);
    rememberTheory(session);
    await api.saveExam(toExamPayload(session));
    await router.push(`/theory/${session.id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没能开始理论考试。';
  } finally {
    busy.value = false;
  }
}

function openPaper(exam: ExamRecord) {
  const theory = sessionFromRecord(exam);
  if (theory) {
    rememberTheory(theory);
    router.push(`/theory/${exam.id}`);
    return;
  }
  if (exam.mode !== 'practice' && exam.mode !== 'exam') return;
  rememberSession({
    id: exam.id,
    schemaVersion: 1,
    bankVersion: version.value,
    mode: exam.mode,
    status: exam.status,
    questionIds: exam.questionIds,
    currentQuestionId: exam.questionIds[0],
    startedAt: exam.startedAt,
    updatedAt: exam.updatedAt,
    deadlineAt: exam.mode === 'exam' && exam.status === 'active' ? exam.startedAt + 120 * 60 * 1000 : undefined,
    submittedAt: exam.submittedAt,
    submissionReason: exam.submissionReason,
    answers: Object.fromEntries(Object.entries(exam.answers || {}).map(([questionId, fields]) => [
      questionId,
      Object.fromEntries(Object.entries(fields).map(([fieldId, value]) => [fieldId, { text: value.text || '', fileIds: [] }])),
    ])),
    markedQuestionIds: [],
    assessment: exam.assessment,
  });
  router.push(`/workspace/${exam.id}`);
}

function when(value: number) {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <main class="page">
    <section class="hero">
      <div>
        <p class="kicker">操作技能 · 人工智能训练师三级</p>
        <h1>先把一套题做完。</h1>
        <p class="lede">40 道原题可以逐题练习。模拟考试按考核方案抽 6 题，满分 100，限时 120 分钟。交卷后，用管理员配置的模型阅卷。按题整理的笔记在学习资料里。</p>
        <div class="actions">
          <button class="btn" :disabled="busy || !questions.length" @click="start('practice')">开始全题练习</button>
          <button class="btn seal" :disabled="busy || !questions.length" @click="start('exam')">开始模拟考试</button>
          <router-link class="btn ghost" to="/materials">看学习资料</router-link>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-else-if="!questions.length" class="muted">正在从数据库读取题库。</p>
        <p v-else class="muted">题库 {{ questions.length }} 题 · {{ groups.length }} 个模块</p>
      </div>
      <aside class="slip" aria-label="模拟考试组卷">
        <h2>模拟考试</h2>
        <p>六个模块各抽一题，合卷 120 分钟。</p>
        <table>
          <tbody>
            <tr v-for="rule in rules" :key="rule.label">
              <td>{{ rule.label }}<br /><small class="muted">{{ rule.note }}</small></td>
              <td>{{ rule.points }} 分</td>
            </tr>
            <tr class="total"><td>合计</td><td>100 分</td></tr>
          </tbody>
        </table>
      </aside>
    </section>

    <section class="hero">
      <div>
        <p class="kicker">理论知识 · 闭卷机考</p>
        <h1>190 题，90 分钟。</h1>
        <p class="lede">题库有判断、单选、多选各 300 题。模拟考试按认定题量抽题，满分 100。练习可以做完全部题库，做完一题就能核对。多选要选对全部选项才得分。</p>
        <div class="actions">
          <button class="btn" :disabled="busy || theoryQuestions.length < 900" @click="startTheory('theory-practice')">开始理论练习</button>
          <button class="btn seal" :disabled="busy || theoryQuestions.length < 900" @click="startTheory('theory')">开始理论模拟考试</button>
        </div>
        <p v-if="!theoryQuestions.length" class="muted">正在从数据库读取理论题库。</p>
        <p v-else class="muted">理论题库 {{ theoryQuestions.length }} 题</p>
      </div>
      <aside class="slip" aria-label="理论考核方案">
        <h2>考核方案 · 理论</h2>
        <p>闭卷机考，时长 90 分钟。</p>
        <table>
          <tbody>
            <tr><td>判断题<br /><small class="muted">40 题，每题 0.5 分</small></td><td>20 分</td></tr>
            <tr><td>单选题<br /><small class="muted">140 题，每题 0.5 分</small></td><td>70 分</td></tr>
            <tr><td>多选题<br /><small class="muted">10 题，每题 1 分</small></td><td>10 分</td></tr>
            <tr class="total"><td>合计 190 题</td><td>100 分</td></tr>
          </tbody>
        </table>
      </aside>
    </section>

    <section class="steps" aria-label="作答流程">
      <article class="step"><span>01</span><strong>组卷</strong><p>练习用全部 40 题。考试按模块抽 6 题，分值固定。</p></article>
      <article class="step"><span>02</span><strong>作答</strong><p>文字答案记在账号里。上传的文件留在这台浏览器。</p></article>
      <article class="step"><span>03</span><strong>阅卷</strong><p>交卷后提交文字和最多 6 张图片，模型给出每题分数和理由。</p></article>
    </section>

    <div class="section-title">
      <h2>账号里的答卷</h2>
      <router-link v-if="!auth.user" to="/account">登录后查看</router-link>
    </div>
    <div v-if="auth.user && papers.length" class="papers">
      <button v-for="exam in papers" :key="exam.id" class="paper-row" @click="openPaper(exam)">
        <strong>{{ paperName(exam.mode) }}</strong>
        <span>{{ exam.status === 'submitted' ? '已交卷' : '进行中' }} · {{ exam.questionIds.length }} 题<span v-if="exam.assessment"> · {{ exam.mode === 'theory' || exam.mode === 'theory-practice' ? '得分' : 'AI' }} {{ exam.assessment.total }}/{{ exam.assessment.maxTotal }}</span></span>
        <small>{{ when(exam.updatedAt) }}</small>
      </button>
    </div>
    <p v-else-if="auth.user && papersReady" class="muted">还没有答卷。从上面开始一套。</p>
  </main>
</template>
