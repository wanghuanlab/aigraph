<script setup lang="ts">
import { computed, ref } from 'vue';
import NoteTree, { type ExamNote } from '../components/NoteTree.vue';
import notes from '../data/examNotes.json';

const modules = notes as ExamNote[];
const moduleTitle = ref(modules[0]?.title ?? '');
const questionTitle = ref(modules[0]?.children?.[0]?.title ?? '');

const currentModule = computed(() => modules.find((item) => item.title === moduleTitle.value) ?? modules[0]);
const questions = computed(() => currentModule.value?.children ?? []);
const current = computed(() => questions.value.find((item) => item.title === questionTitle.value) ?? questions.value[0]);

function heading(title: string) {
  const parts = title.split('\n').map((line) => line.trim()).filter(Boolean);
  const first = parts[0] ?? '';
  if (/^\d+\.\d+\.\d+$/.test(first)) return { id: first, name: parts.slice(1).join(' ') };
  return { id: '', name: parts.join(' ') };
}

function openModule(title: string) {
  moduleTitle.value = title;
  const next = modules.find((item) => item.title === title);
  questionTitle.value = next?.children?.[0]?.title ?? '';
}
</script>

<template>
  <main class="page">
    <p class="kicker">辅助学习</p>
    <h1>按题记下的做法。</h1>
    <p class="lede">每一题留下步骤、代码和答题模板。正式作答回到考场。</p>
    <div class="notes">
      <nav class="note-index" aria-label="题号">
        <div class="note-modules">
          <button
            v-for="item in modules"
            :key="item.title"
            :class="{ on: item.title === currentModule?.title }"
            @click="openModule(item.title)"
          >{{ item.title }}</button>
        </div>
        <div class="note-questions">
        <button
          v-for="item in questions"
          :key="item.title"
          class="question"
          :class="{ on: item.title === current?.title }"
          @click="questionTitle = item.title"
        >
          <strong v-if="heading(item.title).id">{{ heading(item.title).id }}</strong>
          <span>{{ heading(item.title).name }}</span>
        </button>
        </div>
      </nav>
      <article v-if="current" class="note-sheet">
        <p class="note-id">{{ heading(current.title).id }}</p>
        <h2>{{ heading(current.title).name || heading(current.title).id }}</h2>
        <NoteTree v-for="(section, index) in current.children" :key="index" :note="section" :depth="0" />
      </article>
    </div>
  </main>
</template>
