<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, type ExamRecord } from '../api';
import { auth, refreshAuth } from '../auth';

const route = useRoute();
const router = useRouter();
const mode = ref<'login' | 'register'>('login');
const username = ref('');
const password = ref('');
const captcha = ref('');
const captchaId = ref('');
const captchaSvg = ref('');
const currentPassword = ref('');
const nextPassword = ref('');
const error = ref('');
const exams = ref<ExamRecord[]>([]);

async function loadCaptcha() {
  const result = await api.captcha();
  captchaId.value = result.id;
  captchaSvg.value = result.svg;
  captcha.value = '';
}
async function loadExams() {
  if (!auth.user) return;
  const record = await api.learning();
  exams.value = Object.values(record.record.exams || {}).sort((a, b) => b.updatedAt - a.updatedAt);
}
onMounted(async () => { await loadCaptcha(); await loadExams(); });

async function submit() {
  error.value = '';
  try {
    const body = { username: username.value, password: password.value, captchaId: captchaId.value, captcha: captcha.value };
    if (mode.value === 'login') await api.login(body);
    else await api.register(body);
    await refreshAuth();
    await loadExams();
    const next = typeof route.query.next === 'string' ? route.query.next : '/';
    if (!auth.user?.mustChangePassword) await router.push(next);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没有完成。';
    await loadCaptcha();
  }
}
async function changePassword() {
  error.value = '';
  try {
    await api.password({ currentPassword: currentPassword.value, nextPassword: nextPassword.value });
    await refreshAuth();
    currentPassword.value = '';
    nextPassword.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '没有改成。';
  }
}
async function logout() {
  await api.logout();
  await refreshAuth();
  exams.value = [];
}
async function removeExam(id: string) {
  await api.deleteExam(id);
  await loadExams();
}
function when(value: number) {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <main class="page">
    <p class="kicker">账号</p>
    <h1>{{ auth.user ? auth.user.username : '登录后开始作答' }}</h1>
    <p v-if="auth.user?.mustChangePassword" class="error">当前还是初始密码，请先改掉。</p>
    <form v-if="!auth.user" class="form" @submit.prevent="submit">
      <div class="filter">
        <button type="button" :class="{ on: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button type="button" :class="{ on: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>
      <label>用户名<input v-model="username" type="text" autocomplete="username" required /></label>
      <label>密码<input v-model="password" type="password" autocomplete="current-password" required /></label>
      <label>验证码
        <span class="captcha">
          <input v-model="captcha" type="text" autocomplete="off" required />
          <button type="button" v-html="captchaSvg" @click="loadCaptcha" />
        </span>
      </label>
      <button class="btn" type="submit">{{ mode === 'login' ? '登录' : '注册并登录' }}</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <template v-else>
      <div class="actions">
        <router-link class="btn" to="/">去考场</router-link>
        <button class="btn ghost" @click="logout">退出</button>
      </div>
      <form class="form" @submit.prevent="changePassword">
        <h2>修改密码</h2>
        <label>当前密码<input v-model="currentPassword" type="password" required /></label>
        <label>新密码<input v-model="nextPassword" type="password" required /></label>
        <button class="btn" type="submit">保存</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <div class="section-title"><h2>答卷</h2></div>
      <div class="papers">
        <article v-for="exam in exams" :key="exam.id" class="paper-row">
          <strong>{{ exam.mode === 'exam' ? '模拟考试' : '全题练习' }}</strong>
          <span>{{ exam.status === 'submitted' ? '已交卷' : '进行中' }} · {{ exam.questionIds.length }} 题<span v-if="exam.assessment"> · AI {{ exam.assessment.total }}/{{ exam.assessment.maxTotal }}</span><br /><small>{{ when(exam.updatedAt) }}</small></span>
          <span class="actions">
            <router-link class="btn ghost" :to="`/workspace/${exam.id}`">打开</router-link>
            <button class="btn ghost" @click="removeExam(exam.id)">删除</button>
          </span>
        </article>
      </div>
    </template>
  </main>
</template>
