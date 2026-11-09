<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <div class="sheet state" role="status">
    <p class="muted">{{ label }}</p>
    <div class="loading-bars" aria-hidden="true"><span /><span /></div>
  </div>
</template>
