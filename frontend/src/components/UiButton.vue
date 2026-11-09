<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router';

const props = withDefaults(defineProps<{
  to?: RouteLocationRaw;
  variant?: 'primary' | 'ghost' | 'entry' | 'seal' | 'remove' | 'text';
  compact?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>(), { variant: 'primary', type: 'button' });
</script>

<template>
  <component
    :is="props.to && !props.disabled ? RouterLink : 'button'"
    v-bind="props.to && !props.disabled ? { to: props.to } : { type: props.type, disabled: props.disabled }"
    class="btn"
    :class="[props.variant, { compact: props.compact }]"
  ><slot /></component>
</template>
