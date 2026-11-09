<script setup lang="ts">
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';

const route = useRoute();
</script>

<template>
  <SiteHeader v-if="route.name !== 'workspace' && route.name !== 'theory'" />
  <router-view :key="route.path" />
</template>
