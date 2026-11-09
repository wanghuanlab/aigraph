<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import UiButton from './UiButton.vue';

const props = defineProps<{
  open: boolean;
  title: string;
  confirmLabel?: string;
  confirmVariant?: 'seal' | 'primary';
  cancelLabel?: string;
  drawer?: boolean;
}>();
const emit = defineEmits<{ close: []; confirm: [] }>();
const dialog = ref<HTMLDialogElement>();

function syncDialog() {
  if (props.open && !dialog.value?.open) dialog.value?.showModal();
  if (!props.open && dialog.value?.open) dialog.value.close();
}
onMounted(syncDialog);
watch(() => props.open, syncDialog, { flush: 'post' });
</script>

<template>
  <dialog ref="dialog" :class="{ drawer }" :aria-label="title" @close="emit('close')">
    <h2>{{ title }}</h2>
    <slot />
    <div class="dialog-actions">
      <UiButton variant="ghost" autofocus @click="dialog?.close()">{{ cancelLabel || '返回检查' }}</UiButton>
      <UiButton v-if="confirmLabel" :variant="confirmVariant || 'seal'" @click="dialog?.close(); emit('confirm')">{{ confirmLabel }}</UiButton>
    </div>
  </dialog>
</template>
