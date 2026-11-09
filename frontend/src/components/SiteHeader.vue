<script setup lang="ts">
import { auth } from '../auth';
</script>

<template>
  <header class="top">
    <router-link class="brand" to="/">
      <span>人工智能训练师</span>
      <strong>三级考场</strong>
    </router-link>
    <nav>
      <router-link to="/">考场</router-link>
      <router-link to="/materials">学习资料</router-link>
      <router-link v-if="auth.user?.role === 'admin'" to="/admin">后台</router-link>
      <router-link to="/account">{{ auth.user ? auth.user.username : '登录' }}</router-link>
    </nav>
  </header>
</template>
