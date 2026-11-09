<script setup lang="ts">
import UiButton from './UiButton.vue';
import type { SaveStatus } from '../exam/useExamSave';

defineProps<{ status: SaveStatus; savedAt?: number; error?: string; disabled?: boolean }>();
defineEmits<{ retry: [] }>();
const clock = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
</script>

<template>
  <div class="save-status nums">
    <span role="status" :class="{ success: status === 'saved', error: status === 'error', muted: status === 'idle' }">
      <template v-if="status === 'saving'">保存中…</template>
      <template v-else-if="status === 'saved' && savedAt">✓ 已保存 {{ clock.format(savedAt) }}</template>
      <template v-else-if="status === 'error'">{{ error || '保存失败' }}</template>
      <template v-else>作答自动保存</template>
    </span>
    <UiButton v-if="status === 'error'" variant="text" compact :disabled="disabled" @click="$emit('retry')">重试保存</UiButton>
  </div>
</template>
