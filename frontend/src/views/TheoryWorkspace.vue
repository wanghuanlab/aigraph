<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, type TheoryQuestion } from '../api';
import { choicesOf, readTheory, rememberTheory, sessionFromRecord, toExamPayload, type TheorySession } from '../exam/theory';

const route = useRoute();
const router = useRouter();
const session = ref<TheorySession | null>(null);
const questions = ref<Record<string, TheoryQuestion>>({});
const index = ref(0);
const now = ref(Date.now());
const error = ref('');
const notice = ref('');
const busy = ref(false);
const reveal = ref<Record<string, { correct: boolean; answer: string[] }>>({});
const openKinds = ref<Record<string, boolean>>({ judge: true, single: false, multi: false });
let clock: number | undefined;
let saveTimer: number | undefined;

const paper = computed(() => (session.value?.questionIds || []).map((id) => questions.value[id]).filter((item): item is TheoryQuestion => Boolean(item)));
const current = computed(() => paper.value[index.value] || null);
const groups = computed(() => (['judge', 'single', 'multi'] as const).map((kind) => ({
  kind,
  title: kind === 'judge' ? '判断题' : kind === 'single' ? '单选题' : '多选题',
  items: paper.value.map((item, position) => ({ item, position })).filter((entry) => entry.item.kind === kind),
})));
const ordinal = computed(() => {
  const question = current.value;
  if (!question) return 1;
  return paper.value.filter((item) => item.kind === question.kind).findIndex((item) => item.id === question.id) + 1;
});
const answeredCount = computed(() => paper.value.filter((item) => (session.value?.answers[item.id] || []).length).length);
const markedCount = computed(() => session.value?.markedQuestionIds.length || 0);
const remainingText = computed(() => formatClock(Math.max(0, (session.value?.deadlineAt || now.value) - now.value)));
const verdicts = computed(() => {
  const map: Record<string, { correct: boolean; answer: string[] }> = { ...reveal.value };
  for (const item of session.value?.assessment?.items || []) {
    if (item.answer) map[item.questionId] = { correct: Boolean(item.correct), answer: item.answer };
  }
  return map;
});

onMounted(async () => {
  clock = window.setInterval(() => {
    now.value = Date.now();
    if (session.value?.status === 'active' && session.value.deadlineAt && now.value >= session.value.deadlineAt) {
      void submit('timeout');
    }
  }, 1000);
  try {
    const bank = await api.theoryBank();
    questions.value = Object.fromEntries(bank.bank.questions.map((item) => [item.id, item]));
    const id = String(route.params.id || '');
    session.value = readTheory(id);
    if (!session.value) {
      const record = await api.learning();
      const stored = record.record.exams?.[id];
      session.value = stored ? sessionFromRecord(stored) : null;
      if (session.value) rememberTheory(session.value);
    }
    if (!session.value) {
      error.value = '没有找到这份理论答卷。';
      return;
    }
    if (session.value.status === 'active' && session.value.deadlineAt && Date.now() >= session.value.deadlineAt) {
      await submit('timeout');
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '理论题库没有载入。';
  }
});

onUnmounted(() => {
  if (clock) window.clearInterval(clock);
  if (saveTimer) window.clearTimeout(saveTimer);
});

function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function selected(id: string) {
  return session.value?.answers[id] || [];
}

function choose(key: string) {
  const question = current.value;
  const currentSession = session.value;
  if (!question || !currentSession || currentSession.status !== 'active') return;
  const next = question.kind === 'multi'
    ? selected(question.id).includes(key)
      ? selected(question.id).filter((item) => item !== key)
      : [...selected(question.id), key].sort()
    : [key];
  currentSession.answers = { ...currentSession.answers, [question.id]: next };
  currentSession.updatedAt = Date.now();
  rememberTheory(currentSession);
  queueSave();
}

function toggleMark() {
  const question = current.value;
  const currentSession = session.value;
  if (!question || !currentSession || currentSession.status !== 'active') return;
  const marks = new Set(currentSession.markedQuestionIds);
  if (marks.has(question.id)) marks.delete(question.id);
  else marks.add(question.id);
  currentSession.markedQuestionIds = [...marks];
  currentSession.updatedAt = Date.now();
  rememberTheory(currentSession);
  queueSave();
}

function reviewMarks() {
  const currentSession = session.value;
  if (!currentSession?.markedQuestionIds.length) {
    notice.value = '还没有标记题目。';
    return;
  }
  const marks = currentSession.markedQuestionIds;
  const currentId = current.value?.id;
  const positions = marks.map((id) => paper.value.findIndex((item) => item.id === id)).filter((position) => position >= 0).sort((a, b) => a - b);
  const next = positions.find((position) => position > index.value) ?? positions[0];
  if (next === undefined || paper.value[next]?.id === currentId && positions.length === 1) {
    notice.value = '标记题目已经在当前题。';
    return;
  }
  notice.value = '';
  go(next);
}

function go(position: number) {
  if (position < 0 || position >= paper.value.length) return;
  index.value = position;
  const kind = paper.value[position]?.kind;
  if (kind) openKinds.value[kind] = true;
}

function queueSave() {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { void persist(); }, 400);
}

async function persist() {
  if (!session.value) return;
  await api.saveExam(toExamPayload(session.value));
}

async function checkCurrent() {
  const question = current.value;
  if (!question || session.value?.mode !== 'theory-practice') return;
  busy.value = true;
  error.value = '';
  try {
    reveal.value = { ...reveal.value, [question.id]: await api.theoryCheck(question.id, selected(question.id)) };
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没能核对这道题。';
  } finally {
    busy.value = false;
  }
}

async function submit(reason: 'manual' | 'timeout') {
  const currentSession = session.value;
  if (!currentSession || currentSession.status !== 'active' || busy.value) return;
  const pending = paper.value.length - answeredCount.value;
  if (reason === 'manual' && pending > 0 && !window.confirm(`还有 ${pending} 题未答，确认提交吗？`)) return;
  busy.value = true;
  error.value = '';
  try {
    currentSession.status = 'submitted';
    currentSession.submittedAt = Date.now();
    currentSession.submissionReason = reason;
    currentSession.updatedAt = currentSession.submittedAt;
    currentSession.deadlineAt = undefined;
    rememberTheory(currentSession);
    await persist();
    currentSession.assessment = await api.theoryGrade(currentSession.id);
    rememberTheory(currentSession);
    notice.value = reason === 'timeout' ? '时间到，试卷已提交。' : '试卷已提交。';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没能提交试卷。';
    currentSession.status = 'active';
  } finally {
    busy.value = false;
  }
}

function kindTitle(kind: TheoryQuestion['kind']) {
  return kind === 'judge' ? '判断题' : kind === 'single' ? '单选题' : '多选题';
}

function numberClass(id: string) {
  return {
    on: current.value?.id === id,
    done: selected(id).length > 0,
    mark: session.value?.markedQuestionIds.includes(id),
  };
}
</script>

<template>
  <main class="theory" v-if="session && current">
    <header class="theory-bar">
      <strong>{{ session.mode === 'theory' ? '[模拟考试] 人工智能训练师三级 · 理论考试' : '[理论练习] 人工智能训练师三级 · 理论题库' }}</strong>
      <span v-if="session.mode === 'theory' && session.status === 'active'" class="theory-clock">{{ remainingText }}</span>
      <span v-else-if="session.assessment" class="theory-score">得分 {{ session.assessment.total }} / {{ session.assessment.maxTotal }}</span>
      <button class="theory-ghost" type="button" @click="reviewMarks">标记复审</button>
      <button class="theory-submit" type="button" :disabled="busy || session.status !== 'active'" @click="submit('manual')">
        {{ session.status === 'submitted' ? '已提交' : '提交试卷' }}
      </button>
    </header>
    <p v-if="session.mode === 'theory' && session.status === 'active'" class="theory-warn">考试安全提醒：请勿切换浏览器标签页或刷新页面，否则可能会影响您的考试成绩。</p>
    <p v-if="notice" class="theory-note">{{ notice }}</p>
    <p v-if="error" class="theory-note warn">{{ error }}</p>
    <div class="theory-body">
      <aside>
        <h2>题目导航</h2>
        <div class="theory-nav">
        <section v-for="group in groups" :key="group.kind">
          <button class="theory-fold" type="button" @click="openKinds[group.kind] = !openKinds[group.kind]">
            <span>{{ group.title }} {{ group.items.length }} 题</span>
            <small>{{ openKinds[group.kind] ? '收起' : '展开' }}</small>
          </button>
          <div v-show="openKinds[group.kind]" class="theory-nums">
            <button
              v-for="(entry, offset) in group.items"
              :key="entry.item.id"
              type="button"
              :class="numberClass(entry.item.id)"
              @click="go(entry.position)"
            >{{ offset + 1 }}</button>
          </div>
        </section>
        </div>
        <dl class="theory-legend">
          <div><i class="current" /> <dt>当前题目</dt><dd>{{ index + 1 }}</dd></div>
          <div><i class="done" /> <dt>已答</dt><dd>{{ answeredCount }}</dd></div>
          <div><i class="mark" /> <dt>标记</dt><dd>{{ markedCount }}</dd></div>
          <div><i /> <dt>未答</dt><dd>{{ paper.length - answeredCount }}</dd></div>
        </dl>
      </aside>
      <section class="theory-card">
        <header>
          <h2>{{ kindTitle(current.kind) }} 第 {{ ordinal }} 题</h2>
          <span>{{ current.points }}分</span>
        </header>
        <p class="stem">{{ current.stem }}</p>
        <div class="theory-options">
          <label v-for="choice in choicesOf(current)" :key="choice.key" :class="{ picked: selected(current.id).includes(choice.key) }">
            <input
              :type="current.kind === 'multi' ? 'checkbox' : 'radio'"
              :name="current.id"
              :checked="selected(current.id).includes(choice.key)"
              :disabled="session.status !== 'active'"
              @change="choose(choice.key)"
            />
            <span>{{ current.kind === 'judge' ? choice.text : `${choice.key}. ${choice.text}` }}</span>
          </label>
        </div>
        <p v-if="verdicts[current.id]" class="theory-result" :class="{ ok: verdicts[current.id].correct }">
          {{ verdicts[current.id].correct ? '回答正确' : '回答错误' }} · 正确答案 {{ verdicts[current.id].answer.join('、') }}
        </p>
        <footer>
          <label class="theory-mark">
            <input type="checkbox" :checked="session.markedQuestionIds.includes(current.id)" :disabled="session.status !== 'active'" @change="toggleMark" />
            标记此题
          </label>
          <div>
            <button v-if="session.mode === 'theory-practice' && session.status === 'active'" type="button" @click="checkCurrent">核对答案</button>
            <button type="button" :disabled="index === 0" @click="go(index - 1)">上一题</button>
            <button type="button" :disabled="index >= paper.length - 1" @click="go(index + 1)">下一题</button>
          </div>
        </footer>
      </section>
    </div>
  </main>
  <main v-else class="theory theory-empty">
    <p>{{ error || '正在打开理论试卷。' }}</p>
    <button type="button" @click="router.push('/')">返回考场</button>
  </main>
</template>

<style scoped>
.theory { min-height: 100vh; background: #eef3f8; color: #1d2733; }
.theory-bar {
  display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 22px;
  background: #2f6fed; color: white;
}
.theory-bar strong { margin-right: auto; font-size: 16px; }
.theory-clock, .theory-score { background: rgba(255,255,255,.18); border-radius: 999px; padding: 4px 12px; font-variant-numeric: tabular-nums; }
.theory-ghost, .theory-submit, .theory-card footer button, .theory-empty button {
  border: 1px solid rgba(255,255,255,.7); background: transparent; color: white; border-radius: 999px; padding: 7px 14px;
}
.theory-submit { background: #f5a623; border-color: #f5a623; color: #3d2a00; font-weight: 700; }
.theory-submit:disabled, .theory-card footer button:disabled { opacity: .55; }
.theory-warn { margin: 0; padding: 10px 22px; background: #fde8e8; color: #9d2c2c; }
.theory-note { margin: 0; padding: 8px 22px; background: #e7f6ee; color: #1f6b45; }
.theory-note.warn { background: #fff4e8; color: #8a4b08; }
.theory-body { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 16px; padding: 16px; align-items: start; }
.theory-body aside, .theory-card { background: white; border: 1px solid #d7e1ea; border-radius: 12px; }
.theory-body aside { padding: 14px; position: sticky; top: 12px; max-height: calc(100vh - 24px); display: flex; flex-direction: column; }
.theory-nav { overflow: auto; min-height: 0; }
.theory-body h2 { margin: 0 0 10px; font-size: 16px; }
.theory-fold { display: flex; justify-content: space-between; width: 100%; border: 0; background: #f4f7fb; border-radius: 8px; padding: 8px 10px; margin-top: 8px; }
.theory-nums { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 10px 0; }
.theory-nums button { height: 36px; border: 1px solid #d5dee7; background: white; border-radius: 8px; }
.theory-nums button.done { background: #e7f0ff; border-color: #9dbcf2; color: #1d4e89; }
.theory-nums button.mark { box-shadow: inset 0 -3px 0 #f5a623; }
.theory-nums button.on { background: #2f6fed; border-color: #2f6fed; color: white; }
.theory-legend { margin: 12px 0 0; }
.theory-legend div { display: grid; grid-template-columns: 16px 1fr auto; gap: 8px; align-items: center; margin-top: 6px; }
.theory-legend dt, .theory-legend dd { margin: 0; }
.theory-legend i { width: 12px; height: 12px; border-radius: 99px; background: #d5dee7; display: block; }
.theory-legend i.current { background: #2f6fed; }
.theory-legend i.done { background: #7aa2e3; }
.theory-legend i.mark { background: #f5a623; }
.theory-card { padding: 22px 26px 18px; }
.theory-card header { display: flex; justify-content: space-between; align-items: center; }
.theory-card header span { background: #2f6fed; color: white; border-radius: 999px; padding: 2px 10px; font-size: 13px; }
.stem { font-size: 18px; line-height: 1.7; }
.theory-options { display: grid; gap: 10px; }
.theory-options label { display: flex; gap: 10px; align-items: flex-start; border: 1px solid #d7e1ea; border-radius: 10px; padding: 12px 14px; }
.theory-options label.picked { border-color: #2f6fed; background: #f3f7ff; }
.theory-result { padding: 10px 12px; border-radius: 8px; background: #fff1f0; color: #9d2c2c; }
.theory-result.ok { background: #e7f6ee; color: #1f6b45; }
.theory-card footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 18px; }
.theory-card footer button, .theory-mark { color: #1d2733; border-color: #d7e1ea; background: white; }
.theory-mark { display: flex; gap: 8px; align-items: center; }
.theory-empty { display: grid; place-items: center; align-content: center; gap: 12px; }
.theory-empty button { background: #2f6fed; border: 0; }
@media (max-width: 800px) {
  .theory-bar { flex-wrap: wrap; }
  .theory-bar strong { width: 100%; }
  .theory-body { grid-template-columns: 1fr; }
  .theory-body aside { position: static; max-height: 360px; }
}
</style>
