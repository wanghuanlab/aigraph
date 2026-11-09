<script setup lang="ts">
export interface ExamNote {
  title: string;
  children?: ExamNote[];
  image?: string;
}

const props = defineProps<{ note: ExamNote; depth: number }>();

function isCode(title: string) {
  const text = title.trim();
  if (!text) return false;
  const hints = ['pd.', 'np.', 'plt.', 'pandas.', 'data[', 'data.', 'df[', 'df.', 'print(', 'pickle.', 'joblib.', 'X_', 'y_', 'scaler', 'smote', 'rf_', 'xgb', '=IF(', 'cleaned_', 'train_test_split', 'Pipeline(', 'LogisticRegression', 'RandomForest', 'MinMaxScaler', 'StandardScaler', 'LabelEncoder', 'y_pred', 'model.', 'report', '.fit(', '.predict(', '.to_csv', '.dropna', '.drop(', 'classification_report', 'mean_squared_error', 'r2_score'];
  if (hints.some((hint) => text.includes(hint))) return true;
  return /^[#\s]*[A-Za-z_][\w.]*\s*=/.test(text);
}
</script>

<template>
  <section class="note-node">
    <h3 v-if="props.depth === 0 && props.note.title">{{ props.note.title }}</h3>
    <h4 v-else-if="props.note.children?.length && props.note.title">{{ props.note.title }}</h4>
    <pre v-else-if="isCode(props.note.title)"><code>{{ props.note.title }}</code></pre>
    <p v-else-if="props.note.title">{{ props.note.title }}</p>
    <img v-if="props.note.image" :src="props.note.image" alt="2.2.1 的建模流程：读入数据后划分训练集和测试集，先训练并评估，再只对训练集做 SMOTE，重新训练后比较两次结果。" />
    <div v-if="props.note.children?.length" class="note-children">
      <NoteTree v-for="(child, index) in props.note.children" :key="index" :note="child" :depth="props.depth + 1" />
    </div>
  </section>
</template>
