<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { auth, refreshAuth } from '../auth';
import UiButton from './UiButton.vue';

const router = useRouter();
const menu = ref<HTMLDetailsElement>();
const error = ref('');
const busy = ref(false);

function closeMenu() {
  if (menu.value) menu.value.open = false;
}
function onFocusOut(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !menu.value?.contains(event.relatedTarget)) closeMenu();
}
function onEscape() {
  closeMenu();
  menu.value?.querySelector('summary')?.focus();
}
async function logout() {
  busy.value = true;
  error.value = '';
  try {
    await api.logout();
    await refreshAuth();
    await router.push('/');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '退出失败，请重试。';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <header class="top">
    <div class="top-inner">
      <router-link class="brand" to="/">
        <span class="brand-mark" aria-hidden="true">考</span>
        <span><small>人工智能训练师</small><strong>三级考试练习</strong></span>
      </router-link>
      <nav aria-label="主导航">
        <router-link to="/" exact-active-class="nav-current">练习</router-link>
        <router-link to="/materials" exact-active-class="nav-current">学习资料</router-link>
        <router-link v-if="auth.user?.role === 'admin'" to="/admin" exact-active-class="nav-current">后台</router-link>
        <details v-if="auth.user" ref="menu" class="account-menu" @focusout="onFocusOut" @keydown.esc.stop="onEscape">
          <summary>{{ auth.user.username }}</summary>
          <div class="sheet account-menu-panel">
            <router-link to="/account" @click="closeMenu">账号与答卷</router-link>
            <UiButton variant="text" compact :disabled="busy" @click="logout">退出登录</UiButton>
            <p v-if="error" class="error small" role="alert">{{ error }}</p>
          </div>
        </details>
        <router-link v-else to="/account" exact-active-class="nav-current">登录</router-link>
      </nav>
    </div>
  </header>
</template>
