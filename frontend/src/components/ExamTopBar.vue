<script setup lang="ts">
import CountdownClock from './CountdownClock.vue';
import StatusTag from './StatusTag.vue';
import UiButton from './UiButton.vue';

defineProps<{ title: string; answered: number; total: number; milliseconds?: number; submitted: boolean; busy?: boolean }>();
defineEmits<{ sheet: []; submit: [] }>();
</script>

<template>
  <header class="exam-top">
    <div class="exam-heading">
      <router-link to="/">返回考场</router-link>
      <h1>{{ title }}</h1>
    </div>
    <div class="actions">
      <UiButton class="drawer-trigger" variant="ghost" @click="$emit('sheet')">答题卡</UiButton>
      <span class="progress nums">已答 {{ answered }}/{{ total }}</span>
      <CountdownClock v-if="milliseconds !== undefined && !submitted" :milliseconds="milliseconds" />
      <StatusTag v-if="submitted">已交卷</StatusTag>
      <UiButton v-else variant="seal" :disabled="busy" @click="$emit('submit')">交卷</UiButton>
    </div>
  </header>
</template>
