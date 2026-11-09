<script setup lang="ts">
import { computed, ref } from 'vue';
import UiButton from './UiButton.vue';

export interface ExamNote {
  title: string;
  children?: ExamNote[];
  image?: string;
}

const props = defineProps<{ note: ExamNote; depth: number; question: string }>();
const feedback = ref<{ index: number; message: string }>();

function isCode(title: string) {
  const text = title.trim();
  if (!text) return false;
  const hints = ['pd.', 'np.', 'plt.', 'pandas.', 'data[', 'data.', 'df[', 'df.', 'print(', 'pickle.', 'joblib.', 'X_', 'y_', 'scaler', 'smote', 'rf_', 'xgb', '=IF(', 'cleaned_', 'train_test_split', 'Pipeline(', 'LogisticRegression', 'RandomForest', 'MinMaxScaler', 'StandardScaler', 'LabelEncoder', 'y_pred', 'model.', 'report', '.fit(', '.predict(', '.to_csv', '.dropna', '.drop(', 'classification_report', 'mean_squared_error', 'r2_score'];
  if (hints.some((hint) => text.includes(hint))) return true;
  return /^(?:[#\s]*[A-Za-z_][\w.]*\s*=|from\s+\S+\s+import\b|import\s+\S+)/.test(text);
}

const children = computed(() => {
  const result: Array<{ kind: 'code'; text: string } | { kind: 'note'; note: ExamNote }> = [];
  for (const child of props.note.children ?? []) {
    if (!child.image && !child.children?.length && isCode(child.title)) {
      const previous = result.at(-1);
      if (previous?.kind === 'code') previous.text += '\n' + child.title;
      else result.push({ kind: 'code', text: child.title });
    } else {
      result.push({ kind: 'note', note: child });
    }
  }
  return result;
});
const imageDescription = computed(() => props.note.image === '/notes/2.2.1-flow.png'
  ? '建模流程图。划分训练集和测试集后先训练并评估，再对训练集做 SMOTE，重新训练并比较结果。'
  : [props.question, props.note.title].filter(Boolean).join('，'));

async function copy(text: string, index: number) {
  try {
    await navigator.clipboard.writeText(text);
    feedback.value = { index, message: '已复制' };
  } catch {
    feedback.value = { index, message: '复制未完成，可选中文本手动复制。' };
  }
}
</script>

<template>
  <section class="note-node">
    <h3 v-if="depth === 0 && note.title">{{ note.title }}</h3>
    <h4 v-else-if="note.children?.length && note.title">{{ note.title }}</h4>
    <p v-else-if="note.title">{{ note.title }}</p>
    <img v-if="note.image" :src="note.image" :alt="imageDescription" loading="lazy" />
    <div v-if="children.length" class="note-children">
      <template v-for="(entry, index) in children" :key="index">
        <NoteTree v-if="entry.kind === 'note'" :note="entry.note" :depth="depth + 1" :question="question" />
        <div v-else class="code-block">
          <header><span class="muted small" role="status">{{ feedback?.index === index ? feedback.message : '代码' }}</span><UiButton variant="text" compact @click="copy(entry.text, index)">复制代码</UiButton></header>
          <pre><code>{{ entry.text }}</code></pre>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.note-node { margin-bottom: var(--sp-3); }
.note-node > h3 { margin-bottom: var(--sp-3); }
.note-node > h4 { margin-bottom: var(--sp-2); }
.note-children { padding-inline-start: var(--sp-3); border-inline-start: 2px solid var(--line); }
.note-node img { display: block; width: min(100%, 540px); height: auto; margin-top: var(--sp-3); }
.code-block { min-width: 0; margin-block: var(--sp-3); border: 1px solid var(--line-strong); border-radius: var(--radius-sm); background: var(--sheet-sunk); }
.code-block header { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); padding-inline: var(--sp-3); border-bottom: 1px solid var(--line-strong); }
</style>
