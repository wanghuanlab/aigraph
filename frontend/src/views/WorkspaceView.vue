<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, type Question } from '../api';
import QuestionBody from '../components/QuestionBody.vue';
import { fileToBase64, filesFor, removeAnswerFile, saveAnswerFile, type StoredFile } from '../exam/files';
import { isSessionExpired, questionStatus, readSession, remainingMilliseconds, rememberSession, submitSession, type ExamSession } from '../exam/session';

const route = useRoute();
const router = useRouter();
const questions = ref<Question[]>([]);
const session = ref<ExamSession | null>(null);
const error = ref('');
const notice = ref('');
const now = ref(Date.now());
const files = ref<StoredFile[]>([]);
let clock = 0;
let saveTimer = 0;

const current = computed(() => questions.value.find((question) => question.id === session.value?.currentQuestionId) || null);
const index = computed(() => session.value ? session.value.questionIds.indexOf(session.value.currentQuestionId) : 0);
const locked = computed(() => session.value?.status === 'submitted');
const clockText = computed(() => {
  if (!session.value || session.value.mode !== 'exam') return '';
  const ms = remainingMilliseconds(session.value, now.value);
  const total = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
});

onMounted(async () => {
  clock = window.setInterval(() => { now.value = Date.now(); }, 1000);
  try {
    const bank = await api.bank();
    questions.value = bank.bank.questions;
    const id = String(route.params.id);
    const local = readSession(id);
    if (local) session.value = local;
    else {
      const record = await api.learning();
      const exam = record.record.exams[id];
      if (!exam) throw new Error('没有找到这份答卷。');
      session.value = {
        id: exam.id,
        schemaVersion: 1,
        bankVersion: bank.bank.bankVersion,
        mode: exam.mode,
        status: exam.status,
        questionIds: exam.questionIds,
        currentQuestionId: exam.questionIds[0],
        startedAt: exam.startedAt,
        updatedAt: exam.updatedAt,
        deadlineAt: exam.mode === 'exam' && exam.status === 'active' ? exam.startedAt + 120 * 60 * 1000 : undefined,
        submittedAt: exam.submittedAt,
        submissionReason: exam.submissionReason,
        answers: Object.fromEntries(Object.entries(exam.answers || {}).map(([questionId, fields]) => [questionId, Object.fromEntries(Object.entries(fields).map(([fieldId, value]) => [fieldId, { text: value.text || '', fileIds: [] }]))])),
        markedQuestionIds: [],
        assessment: exam.assessment,
      };
      rememberSession(session.value);
    }
    await refreshFiles();
    if (session.value && isSessionExpired(session.value)) await finish('timeout');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '答卷没有打开。';
  }
});
onUnmounted(() => { window.clearInterval(clock); window.clearTimeout(saveTimer); });

watch(() => session.value?.currentQuestionId, refreshFiles);

async function refreshFiles() {
  if (!session.value || !current.value) { files.value = []; return; }
  const lists = await Promise.all(current.value.answerSections.flatMap((section) => section.fields.filter((field) => field.kind === 'file').map((field) => filesFor(session.value!.id, current.value!.id, field.id))));
  files.value = lists.flat();
  for (const fieldFiles of lists) {
    for (const file of fieldFiles) {
      const bucket = session.value.answers[file.questionId] ??= {};
      const answer = bucket[file.fieldId] ??= { text: '', fileIds: [] };
      if (!answer.fileIds.includes(file.id)) answer.fileIds.push(file.id);
    }
  }
}

function answerText(questionId: string, fieldId: string) {
  return session.value?.answers[questionId]?.[fieldId]?.text || '';
}
function setText(questionId: string, fieldId: string, text: string) {
  if (!session.value || locked.value) return;
  const bucket = session.value.answers[questionId] ??= {};
  const answer = bucket[fieldId] ??= { text: '', fileIds: [] };
  answer.text = text;
  session.value.updatedAt = Date.now();
  rememberSession(session.value);
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(sync, 500);
}
async function sync() {
  if (!session.value) return;
  try { await api.saveExam(session.value); notice.value = '已保存到账号'; }
  catch (reason) { notice.value = reason instanceof Error ? reason.message : '保存失败'; }
}
function jump(id: string) {
  if (!session.value) return;
  session.value.currentQuestionId = id;
  rememberSession(session.value);
}
function move(step: number) {
  if (!session.value) return;
  const next = session.value.questionIds[index.value + step];
  if (next) jump(next);
}
async function finish(reason: 'manual' | 'timeout') {
  if (!session.value) return;
  session.value = submitSession(session.value, reason);
  rememberSession(session.value);
  await sync();
}
async function onFiles(questionId: string, fieldId: string, list: FileList | null) {
  if (!session.value || !list || locked.value) return;
  for (const file of list) {
    const stored = { id: crypto.randomUUID(), sessionId: session.value.id, questionId, fieldId, name: file.name, size: file.size, type: file.type, blob: file };
    await saveAnswerFile(stored);
    const bucket = session.value.answers[questionId] ??= {};
    const answer = bucket[fieldId] ??= { text: '', fileIds: [] };
    answer.fileIds.push(stored.id);
  }
  rememberSession(session.value);
  await refreshFiles();
}
async function dropFile(id: string) {
  await removeAnswerFile(id);
  if (!session.value) return;
  for (const fields of Object.values(session.value.answers)) {
    for (const answer of Object.values(fields)) answer.fileIds = answer.fileIds.filter((item) => item !== id);
  }
  rememberSession(session.value);
  await refreshFiles();
}
function asset(key: string) {
  return `/exam-assets/${key.replace(/^\/+/, '')}`;
}
function size(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}
async function grade() {
  if (!session.value) return;
  error.value = '';
  notice.value = '正在阅卷';
  try {
    const images = [];
    for (const questionId of session.value.questionIds) {
      const question = questions.value.find((item) => item.id === questionId);
      if (!question) continue;
      for (const section of question.answerSections) {
        for (const field of section.fields) {
          if (field.kind !== 'file') continue;
          for (const file of await filesFor(session.value.id, questionId, field.id)) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || images.length >= 6) continue;
            if (file.size > 1_200_000) continue;
            images.push({ questionId, fieldId: field.id, name: file.name, mediaType: file.type, dataBase64: await fileToBase64(file.blob) });
          }
        }
      }
    }
    const result = await api.grade(session.value.id, images);
    session.value.assessment = result.assessment;
    rememberSession(session.value);
    notice.value = `阅卷完成 ${result.assessment?.total}/${result.assessment?.maxTotal}`;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '阅卷没有完成。';
    notice.value = '';
  }
}
function reasonFor(id: string) {
  return session.value?.assessment?.items.find((item) => item.questionId === id)?.reason || '';
}
</script>

<template>
  <div v-if="error && !session" class="page"><p class="error">{{ error }}</p><router-link to="/">返回考场</router-link></div>
  <div v-else-if="session && current" class="workspace">
    <aside class="rail">
      <router-link to="/">返回考场</router-link>
      <p><strong>{{ session.mode === 'exam' ? '模拟考试' : '全题练习' }}</strong><br /><span class="muted">{{ session.status === 'submitted' ? '已交卷' : '作答中' }}</span></p>
      <p v-if="clockText" class="timer">{{ clockText }}</p>
      <div class="qnav">
        <button v-for="id in session.questionIds" :key="id" :class="{ on: id === session.currentQuestionId }" @click="jump(id)">
          <span>{{ id }}</span>
          <i class="dot" :class="questionStatus(questions.find((item) => item.id === id)!, session)" />
        </button>
      </div>
    </aside>
    <section>
      <article class="stem">
        <p class="kicker">{{ current.id }} · {{ current.points }} 分 · 参考 {{ current.durationMinutes }} 分钟</p>
        <h2>{{ current.title }}</h2>
        <p><a :href="asset(current.materials.zip.key)" :download="`${current.id}.zip`">下载材料 {{ size(current.materials.zip.bytes) }}</a></p>
        <QuestionBody :blocks="current.content" />
      </article>
      <div class="bar">
        <button class="btn ghost" :disabled="index === 0" @click="move(-1)">上一题</button>
        <span class="muted">{{ notice }}</span>
        <button v-if="index < session.questionIds.length - 1" class="btn" @click="move(1)">下一题</button>
        <button v-else-if="!locked" class="btn seal" @click="finish('manual')">交卷</button>
        <button v-else class="btn" @click="grade">AI 阅卷</button>
      </div>
    </section>
    <aside class="answer">
      <div v-if="session.assessment" class="grade">
        <strong>{{ session.assessment.total }} / {{ session.assessment.maxTotal }}</strong>
        <p>{{ reasonFor(current.id) || '这题暂无评语。' }}</p>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <section v-for="section in current.answerSections" :key="section.id">
        <h3>{{ section.title }}</h3>
        <label v-for="field in section.fields" :key="field.id" class="field">
          <span>{{ field.label }}</span>
          <textarea v-if="field.kind === 'text'" :value="answerText(current.id, field.id)" :placeholder="field.placeholder || ''" :readonly="locked" @input="setText(current.id, field.id, ($event.target as HTMLTextAreaElement).value)" />
          <template v-else>
            <input v-if="!locked" type="file" :accept="field.accept" :multiple="field.multiple" @change="onFiles(current.id, field.id, ($event.target as HTMLInputElement).files)" />
            <small class="muted">文件只保存在这台浏览器。阅卷时最多带 6 张 JPG、PNG 或 WebP。</small>
            <span v-for="file in files.filter((item) => item.fieldId === field.id)" :key="file.id">
              {{ file.name }}
              <button v-if="!locked" class="btn ghost" type="button" @click="dropFile(file.id)">移除</button>
            </span>
          </template>
        </label>
      </section>
    </aside>
  </div>
  <main v-else class="page"><p>正在打开答卷。</p></main>
</template>
