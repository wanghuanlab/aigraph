<script setup lang="ts">
defineProps<{ title: string; detail?: string; error?: boolean }>();
</script>

<template>
  <div class="sheet state" :role="error ? 'alert' : undefined">
    <strong :class="{ error }">{{ title }}</strong>
    <p v-if="detail" class="muted">{{ detail }}</p>
    <slot />
  </div>
</template>
