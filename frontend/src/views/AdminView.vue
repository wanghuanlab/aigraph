<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';
import { auth } from '../auth';

const overview = ref<{ userCount: number; quizAnswers: number; examCount: number; users: Array<Record<string, unknown>> } | null>(null);
const baseUrl = ref('');
const model = ref('');
const apiKey = ref('');
const hint = ref('');
const error = ref('');
const saved = ref('');

onMounted(async () => {
  if (auth.user?.role !== 'admin') return;
  overview.value = await api.overview();
  const settings = await api.model();
  baseUrl.value = settings.model.baseUrl;
  model.value = settings.model.model;
  hint.value = settings.model.keyHint;
});

async function save() {
  error.value = '';
  saved.value = '';
  try {
    const result = await api.saveModel({ baseUrl: baseUrl.value, model: model.value, apiKey: apiKey.value });
    hint.value = result.model.keyHint;
    apiKey.value = '';
    saved.value = '已保存。密钥只留在服务器上。';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没有保存。';
  }
}
function when(value: unknown) {
  return typeof value === 'number' && value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
}
</script>

<template>
  <main class="page">
    <p class="kicker">后台</p>
    <h1>考场运行情况</h1>
    <p v-if="auth.user?.role !== 'admin'">只有管理员可以查看。</p>
    <template v-else-if="overview">
      <div class="steps">
        <article class="step"><span>账号</span><strong>{{ overview.userCount }}</strong></article>
        <article class="step"><span>自测作答</span><strong>{{ overview.quizAnswers }}</strong></article>
        <article class="step"><span>答卷</span><strong>{{ overview.examCount }}</strong></article>
      </div>
      <div class="papers" style="margin-top: 28px">
        <article v-for="user in overview.users" :key="String(user.username)" class="paper-row">
          <strong>{{ user.username }}<br /><small>{{ user.role }}</small></strong>
          <span>自测 {{ user.quizAnswered }} · 答卷 {{ user.examCount }}</span>
          <small>最近 {{ when(user.learningUpdatedAt) }}</small>
        </article>
      </div>
      <form class="form" style="margin-top: 36px" @submit.prevent="save">
        <h2>阅卷模型</h2>
        <p class="muted">OpenAI 兼容接口。留空 API Key 会保留已保存的密钥。页面只显示末四位<span v-if="hint">，当前是 {{ hint }}</span>。</p>
        <label>接口地址<input v-model="baseUrl" type="text" placeholder="https://api.openai.com/v1" required /></label>
        <label>模型名称<input v-model="model" type="text" placeholder="gpt-4o-mini" required /></label>
        <label>API Key<input v-model="apiKey" type="password" autocomplete="off" placeholder="留空则不更换" /></label>
        <button class="btn" type="submit">保存</button>
        <p v-if="saved" class="muted">{{ saved }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </template>
  </main>
</template>
