<script setup lang="ts">
defineProps<{ tone?: 'blue' | 'ok' | 'warn' | 'seal' }>();
</script>

<template>
  <span class="tag" :class="tone"><slot /></span>
</template>
