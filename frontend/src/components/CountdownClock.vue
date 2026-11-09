<script setup lang="ts">
import { computed } from 'vue';
import { clockLabel } from '../exam/presentation';

const props = defineProps<{ milliseconds: number }>();
const urgent = computed(() => props.milliseconds <= 600_000);
</script>

<template>
  <span class="exam-clock nums" role="timer" :class="{ urgent, 'final-minute': milliseconds <= 60_000 }">
    <span>{{ urgent ? '时间将到' : '剩余' }}</span>{{ clockLabel(milliseconds) }}
  </span>
</template>
