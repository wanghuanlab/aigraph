<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import { auth } from '../auth';
import EmptyState from '../components/EmptyState.vue';
import LoadingBlock from '../components/LoadingBlock.vue';
import UiButton from '../components/UiButton.vue';
import UiCard from '../components/UiCard.vue';
import { examDate } from '../exam/presentation';

const overview = ref<Awaited<ReturnType<typeof api.overview>>>();
const baseUrl = ref('');
const model = ref('');
const apiKey = ref('');
const hint = ref('');
const overviewError = ref('');
const modelError = ref('');
const modelReady = ref(false);
const saving = ref(false);
const saved = ref('');

const stats = computed(() => [
  { label: '账号数', value: overview.value?.userCount },
  { label: '自测作答', value: overview.value?.quizAnswers },
  { label: '答卷数', value: overview.value?.examCount },
]);

async function loadOverview() {
  overviewError.value = '';
  try {
    overview.value = await api.overview();
  } catch (reason) {
    overviewError.value = reason instanceof Error ? reason.message : '统计未能加载。';
  }
}
async function loadModel() {
  modelError.value = '';
  try {
    const settings = await api.model();
    baseUrl.value = settings.model.baseUrl;
    model.value = settings.model.model;
    hint.value = settings.model.keyHint;
    modelReady.value = true;
  } catch (reason) {
    modelError.value = reason instanceof Error ? reason.message : '模型配置未能加载。';
  }
}
onMounted(() => {
  if (auth.user?.role !== 'admin') return;
  void loadOverview();
  void loadModel();
});

async function save() {
  if (saving.value) return;
  saving.value = true;
  modelError.value = '';
  saved.value = '';
  try {
    const result = await api.saveModel({ baseUrl: baseUrl.value, model: model.value, apiKey: apiKey.value });
    hint.value = result.model.keyHint;
    apiKey.value = '';
    saved.value = '模型设置已保存。';
  } catch (reason) {
    modelError.value = reason instanceof Error ? reason.message : '模型设置未能保存。';
  } finally {
    saving.value = false;
  }
}
function when(value: unknown) {
  return typeof value === 'number' && value > 0 ? examDate(value) : '—';
}
</script>

<template>
  <main class="page">
    <header class="page-title"><h1>考场运行情况</h1><p>查看账号和答卷统计，管理 AI 阅卷设置。</p></header>
    <EmptyState v-if="auth.user?.role !== 'admin'" title="此页仅对管理员开放"><UiButton variant="ghost" to="/">返回考场</UiButton></EmptyState>
    <template v-else>
      <EmptyState v-if="overviewError" error title="统计未能加载" :detail="overviewError"><UiButton variant="ghost" @click="loadOverview">重试</UiButton></EmptyState>
      <LoadingBlock v-else-if="!overview" label="正在加载考场统计…" />
      <template v-else>
        <div class="stat-grid">
          <UiCard v-for="stat in stats" :key="stat.label"><p class="muted">{{ stat.label }}</p><strong class="stat-value nums">{{ stat.value }}</strong></UiCard>
        </div>
        <section class="admin-section">
          <header class="section-title"><h2>账号列表</h2></header>
          <div v-if="overview.users.length" class="sheet table-scroll">
            <table class="admin-table">
              <thead><tr><th scope="col">用户名</th><th scope="col">角色</th><th scope="col">自测数</th><th scope="col">答卷数</th><th scope="col">最近活动</th></tr></thead>
              <tbody>
                <tr v-for="user in overview.users" :key="String(user.username)">
                  <td>{{ user.username }}</td><td>{{ user.role === 'admin' ? '管理员' : '考生' }}</td>
                  <td class="nums">{{ user.quizAnswered }}</td><td class="nums">{{ user.examCount }}</td>
                  <td class="nums muted">{{ when(user.learningUpdatedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <EmptyState v-else title="暂无账号记录" />
        </section>
      </template>

      <UiCard class="admin-section">
        <h2>阅卷模型设置</h2>
        <form v-if="modelReady" class="form model-form" @submit.prevent="save">
          <p class="small muted">使用兼容 OpenAI 的接口。API Key 留空会沿用已保存的密钥。<template v-if="hint">当前密钥末四位 {{ hint.slice(-4) }}。</template></p>
          <label>接口地址<input v-model="baseUrl" type="text" placeholder="https://api.openai.com/v1" required /></label>
          <label>模型名称<input v-model="model" type="text" placeholder="gpt-4o-mini" required /></label>
          <label>API Key<input v-model="apiKey" type="password" autocomplete="off" placeholder="留空则不更换" /></label>
          <p v-if="saved" class="success small" role="status">{{ saved }}</p>
          <p v-if="modelError" class="error small" role="alert">{{ modelError }}</p>
          <div class="actions"><UiButton type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存设置' }}</UiButton></div>
        </form>
        <EmptyState v-else-if="modelError" error title="模型配置未能加载" :detail="modelError"><UiButton variant="ghost" @click="loadModel">重试</UiButton></EmptyState>
        <LoadingBlock v-else label="正在加载模型配置…" />
      </UiCard>
    </template>
  </main>
</template>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-4); }
.stat-value { font-size: var(--fs-3xl); line-height: 1.25; }
.admin-section { margin-top: var(--sp-6); }
.admin-table { font-size: var(--fs-sm); }
.admin-table td { overflow-wrap: anywhere; }
.admin-table tr:last-child td { border-bottom: 0; }
.model-form { max-width: 560px; }
@media (max-width: 980px) { .stat-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
