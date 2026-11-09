<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, type ExamRecord } from '../api';
import { auth, refreshAuth } from '../auth';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import EmptyState from '../components/EmptyState.vue';
import ExamRecordList from '../components/ExamRecordList.vue';
import LoadingBlock from '../components/LoadingBlock.vue';
import UiButton from '../components/UiButton.vue';
import UiCard from '../components/UiCard.vue';
import { examName, isLoginError } from '../exam/presentation';

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
const busy = ref(false);
const captchaLoading = ref(false);
const captchaError = ref('');
const formError = ref('');
const passwordNotice = ref('');
const recordsError = ref('');
const recordsLoading = ref(false);
const exams = ref<ExamRecord[]>([]);
const removal = ref<ExamRecord>();

const next = computed(() => {
  const target = route.query.next;
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return '/';
  const resolved = router.resolve(target);
  return ['home', 'workspace', 'theory'].includes(String(resolved.name)) ? resolved.fullPath : '/';
});

async function loadCaptcha() {
  if (captchaLoading.value) return;
  captchaLoading.value = true;
  captchaError.value = '';
  captchaId.value = '';
  captchaSvg.value = '';
  captcha.value = '';
  try {
    const result = await api.captcha();
    captchaId.value = result.id;
    captchaSvg.value = result.svg;
  } catch (reason) {
    captchaError.value = reason instanceof Error ? reason.message : '验证码未能加载。';
  } finally {
    captchaLoading.value = false;
  }
}

async function loadExams() {
  if (!auth.user) return;
  recordsLoading.value = true;
  recordsError.value = '';
  try {
    const { record } = await api.learning();
    exams.value = Object.values(record.exams || {}).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (reason) {
    recordsError.value = reason instanceof Error ? reason.message : '答卷未能加载。';
    if (isLoginError(recordsError.value)) {
      await refreshAuth();
      if (!auth.user) void loadCaptcha();
    }
  } finally {
    recordsLoading.value = false;
  }
}

onMounted(async () => {
  if (auth.user && route.query.next) await refreshAuth();
  if (auth.user) await loadExams();
  else await loadCaptcha();
});

function switchMode(value: 'login' | 'register') {
  mode.value = value;
  formError.value = '';
}

async function submit() {
  if (busy.value || !captchaId.value) return;
  busy.value = true;
  formError.value = '';
  try {
    const body = { username: username.value, password: password.value, captchaId: captchaId.value, captcha: captcha.value };
    const result = mode.value === 'login' ? await api.login(body) : await api.register(body);
    auth.user = result.user;
    password.value = '';
    if (result.user.mustChangePassword) await loadExams();
    else await router.push(next.value);
  } catch (reason) {
    formError.value = reason instanceof Error ? reason.message : '登录未完成。';
    await loadCaptcha();
  } finally {
    busy.value = false;
  }
}

async function changePassword() {
  if (busy.value) return;
  busy.value = true;
  formError.value = '';
  passwordNotice.value = '';
  try {
    const result = await api.password({ currentPassword: currentPassword.value, nextPassword: nextPassword.value });
    auth.user = result.user;
    currentPassword.value = '';
    nextPassword.value = '';
    passwordNotice.value = '密码已更新。';
  } catch (reason) {
    formError.value = reason instanceof Error ? reason.message : '密码未能更新。';
  } finally {
    busy.value = false;
  }
}

async function removeExam() {
  const record = removal.value;
  if (!record || busy.value) return;
  removal.value = undefined;
  busy.value = true;
  recordsError.value = '';
  try {
    await api.deleteExam(record.id);
    exams.value = exams.value.filter((exam) => exam.id !== record.id);
  } catch (reason) {
    recordsError.value = reason instanceof Error ? reason.message : '答卷未能删除。';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="page">
    <UiCard v-if="!auth.user" class="sign-in">
      <h1>{{ mode === 'login' ? '登录考场' : '注册考场账号' }}</h1>
      <p class="muted small">{{ next !== '/' ? '登录后继续刚才的操作。' : '登录后保存答卷、查看成绩。' }}</p>
      <div class="account-tabs" role="group" aria-label="账号操作">
        <button type="button" :aria-pressed="mode === 'login'" @click="switchMode('login')">登录</button>
        <button type="button" :aria-pressed="mode === 'register'" @click="switchMode('register')">注册</button>
      </div>
      <form class="form" @submit.prevent="submit">
        <label>用户名<input v-model="username" type="text" autocomplete="username" required /></label>
        <label>密码<input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required /></label>
        <div>
          <label for="captcha-code">验证码</label>
          <div class="captcha">
            <input id="captcha-code" v-model="captcha" type="text" autocomplete="off" required />
            <span v-if="captchaSvg" class="captcha-art" role="img" aria-label="验证码图片"><span aria-hidden="true" v-html="captchaSvg" /></span>
          </div>
          <UiButton variant="text" compact :disabled="captchaLoading" @click="loadCaptcha">{{ captchaLoading ? '加载中…' : '换一张验证码' }}</UiButton>
          <p v-if="captchaError" class="error small" role="alert">{{ captchaError }}</p>
        </div>
        <p v-if="formError" class="error small" role="alert">{{ formError }}</p>
        <UiButton type="submit" :disabled="busy || !captchaId">{{ busy ? '处理中…' : mode === 'login' ? '登录' : '注册并登录' }}</UiButton>
      </form>
    </UiCard>

    <template v-else>
      <header class="page-title"><h1>账号与答卷</h1><p>{{ auth.user.username }} · {{ auth.user.role === 'admin' ? '管理员' : '考生' }}</p></header>
      <div v-if="auth.user.mustChangePassword" class="warning account-warning">当前使用初始密码，请更新密码。</div>
      <div v-if="next !== '/'" class="actions return-action"><UiButton :to="next">继续刚才的操作</UiButton></div>
      <div class="account-layout">
        <UiCard>
          <h2>修改密码</h2>
          <form class="form" @submit.prevent="changePassword">
            <label>当前密码<input v-model="currentPassword" type="password" autocomplete="current-password" required /></label>
            <label>新密码<input v-model="nextPassword" type="password" autocomplete="new-password" required /></label>
            <p v-if="formError" class="error small" role="alert">{{ formError }}</p>
            <p v-if="passwordNotice" class="success small" role="status">{{ passwordNotice }}</p>
            <div class="actions"><UiButton type="submit" :disabled="busy">保存密码</UiButton></div>
          </form>
        </UiCard>
        <section>
          <header class="section-title"><h2>我的答卷</h2><router-link to="/">返回考场</router-link></header>
          <p v-if="recordsError && exams.length" class="error small" role="alert">{{ recordsError }}</p>
          <LoadingBlock v-if="recordsLoading" label="正在加载答卷…" />
          <ExamRecordList v-else-if="exams.length" :records="exams" :removable="!busy" @remove="removal = $event" />
          <EmptyState v-else-if="recordsError" error title="答卷未能加载" :detail="recordsError"><UiButton variant="ghost" @click="loadExams">重试</UiButton></EmptyState>
          <EmptyState v-else title="还没有答卷" detail="开始练习或模拟考试后，答卷会出现在这里。" />
        </section>
      </div>
      <ConfirmDialog :open="Boolean(removal)" title="删除答卷" confirm-label="删除答卷" cancel-label="取消" @close="removal = undefined" @confirm="removeExam">
        <p v-if="removal">删除「{{ examName(removal.mode) }}」后，将无法在账号中打开这份答卷。</p>
      </ConfirmDialog>
    </template>
  </main>
</template>

<style scoped>
.sign-in { width: min(100%, 400px); margin: var(--sp-5) auto 0; }
.sign-in h1 { margin-bottom: var(--sp-2); font-size: var(--fs-2xl); }
.account-tabs { display: flex; gap: var(--sp-5); margin: var(--sp-5) 0 var(--sp-4); border-bottom: 1px solid var(--line); }
.account-tabs button { min-height: 40px; padding: 0 var(--sp-1); border: 0; border-bottom: 2px solid transparent; background: transparent; }
.account-tabs button[aria-pressed="true"] { color: var(--blue); border-bottom-color: var(--blue); font-weight: 700; }
.captcha { display: grid; grid-template-columns: minmax(0, 1fr) minmax(90px, 142px); gap: var(--sp-2); align-items: center; margin-top: var(--sp-2); }
.captcha-art { display: block; overflow: hidden; border: 1px solid var(--control-line); border-radius: var(--radius-sm); }
.captcha-art :deep(svg) { display: block; width: 100%; height: 40px; }
.account-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); align-items: start; gap: var(--sp-5); }
.account-warning, .return-action { margin-bottom: var(--sp-4); }
@media (max-width: 980px) { .account-layout { grid-template-columns: minmax(0, 1fr); } }
</style>
