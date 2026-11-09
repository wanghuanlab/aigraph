<script setup lang="ts">
import { computed, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import NoteTree, { type ExamNote } from '../components/NoteTree.vue';
import notes from '../data/examNotes.json';

const moduleNames: Record<string, string> = {
  '1.1': '业务数据流程设计', '1.2': '业务模块效果优化',
  '2.1': '数据清洗与标注', '2.2': '模型开发与测试',
  '3.1': '智能产品数据分析与优化', '3.2': '人机交互流程设计',
  '4.1': '培训大纲编写', '4.2': '数据采集、处理与标注指导',
};

function heading(title: string) {
  const [first = '', ...rest] = title.split('\n').map((line) => line.trim()).filter(Boolean);
  if (/^\d+\.\d+\.\d+$/.test(first)) return { id: first, name: rest.join(' ') };
  return { id: '', name: [first, ...rest].join(' ') };
}
const modules = (notes as ExamNote[]).map((module) => ({
  id: module.title,
  name: moduleNames[module.title] || module.title,
  questions: (module.children ?? []).map((note) => ({ ...heading(note.title), key: note.title, note })),
}));
const query = ref('');
const selectedKey = ref(modules[0]?.questions[0]?.key ?? '');
const expanded = ref(new Set([modules[0]?.id]));
const visibleModules = computed(() => {
  const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return modules;
  return modules.map((module) => ({
    ...module,
    questions: module.questions.filter((question) =>
      words.every((word) => `${question.id} ${question.name} ${module.name}`.toLowerCase().includes(word)),
    ),
  })).filter((module) => module.questions.length);
});
const current = computed(() => visibleModules.value.flatMap((module) => module.questions).find((question) => question.key === selectedKey.value)
  ?? visibleModules.value[0]?.questions[0]);
const currentKey = computed({
  get: () => current.value?.key ?? '',
  set: (key) => { selectedKey.value = key; },
});
function isOpen(id: string) { return Boolean(query.value.trim()) || expanded.value.has(id); }
function toggleModule(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}
</script>

<template>
  <main class="page">
    <header class="page-title"><h1>学习资料</h1><p>按题查找操作步骤、代码和答题模板。</p></header>
    <div class="notes">
      <nav class="sheet note-index" aria-label="学习资料目录">
        <label for="note-search" class="small">查找题目</label>
        <input id="note-search" v-model="query" type="search" placeholder="按题号或题名搜索" />
        <div v-if="visibleModules.length" class="note-modules">
          <section v-for="module in visibleModules" :key="module.id">
            <button type="button" class="note-module" :aria-expanded="isOpen(module.id)" :disabled="Boolean(query.trim())" @click="toggleModule(module.id)">
              <span>{{ module.id }} {{ module.name }}</span><span aria-hidden="true">{{ isOpen(module.id) ? '−' : '+' }}</span>
            </button>
            <div v-if="isOpen(module.id)" class="note-questions">
              <button v-for="question in module.questions" :key="question.key" type="button" :aria-current="currentKey === question.key ? 'true' : undefined" @click="currentKey = question.key">
                <strong v-if="question.id" class="nums">{{ question.id }}</strong>
                <span>{{ question.name }}</span>
              </button>
            </div>
          </section>
        </div>
        <label v-if="visibleModules.length" class="notes-picker small">选择资料
          <select v-model="currentKey">
            <optgroup v-for="module in visibleModules" :key="module.id" :label="`${module.id} ${module.name}`">
              <option v-for="question in module.questions" :key="question.key" :value="question.key">{{ question.id }} {{ question.name }}</option>
            </optgroup>
          </select>
        </label>
        <p v-else class="small muted" role="status">没有找到匹配的题目。</p>
      </nav>

      <article v-if="current" :key="current.key" class="sheet note-sheet">
        <p v-if="current.id" class="note-id nums">{{ current.id }}</p>
        <h2>{{ current.name || current.id }}</h2>
        <NoteTree v-for="(section, index) in current.note.children" :key="index" :note="section" :depth="0" :question="current.name || current.id" />
      </article>
      <EmptyState v-else title="没有匹配的资料" detail="可以试试完整题号或缩短搜索词。" />
    </div>
  </main>
</template>

<style scoped>
.notes { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: var(--sp-5); align-items: start; }
.note-index { display: grid; gap: var(--sp-2); padding: var(--sp-3); position: sticky; top: 84px; max-height: calc(100dvh - 100px); overflow: auto; }
.note-modules { display: grid; gap: var(--sp-2); }
.note-index button { width: 100%; padding: var(--sp-2); text-align: start; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; }
.note-index .note-module { display: flex; justify-content: space-between; gap: var(--sp-2); background: var(--sheet-sunk); color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; }
.note-questions { display: grid; padding: var(--sp-1) 0 0 var(--sp-2); gap: var(--sp-1); }
.note-questions button { display: grid; font-size: var(--fs-sm); }
.note-questions button:hover, .note-questions button[aria-current] { background: var(--blue-soft); color: var(--blue); border-color: var(--blue); }
.note-sheet { padding: var(--sp-6); overflow-wrap: anywhere; }
.note-id { color: var(--seal); font-weight: 700; margin-bottom: var(--sp-2); }
.note-sheet > h2 { margin-bottom: var(--sp-5); }
.notes-picker { display: none; }
@media (max-width: 980px) {
  .notes { grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
  .note-index { position: static; max-height: none; overflow: visible; }
  .note-modules { display: none; }
  .notes-picker { display: grid; gap: var(--sp-1); }
  .note-sheet { padding: var(--sp-4); }
}
</style>
