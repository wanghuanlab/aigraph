<script setup lang="ts">
import type { ExamRecord } from '../api';
import { examDate, examLocation, examName } from '../exam/presentation';
import StatusTag from './StatusTag.vue';
import UiButton from './UiButton.vue';

defineProps<{ records: ExamRecord[]; removable?: boolean }>();
defineEmits<{ remove: [record: ExamRecord] }>();
</script>

<template>
  <div class="sheet records">
    <div class="record-grid record-head" :class="{ removable }" aria-hidden="true">
      <span>试卷名称</span><span>状态</span><span>得分</span><span>最近活动</span><span v-if="removable">操作</span>
    </div>
    <div v-for="record in records" :key="record.id" class="record-row" :class="{ removable }">
      <router-link class="record-grid" :to="examLocation(record)">
        <strong>{{ examName(record.mode) }}</strong>
        <StatusTag :tone="record.status === 'active' ? 'blue' : record.assessment ? 'ok' : undefined">
          {{ record.status === 'active' ? '进行中' : record.assessment ? '已阅卷' : '已交卷' }}
        </StatusTag>
        <span v-if="record.assessment" class="record-score nums">
          {{ record.assessment.total }} <small class="muted">/ {{ record.assessment.maxTotal }}</small>
        </span>
        <span v-else class="muted">{{ record.status === 'submitted' ? '待阅卷' : '—' }}</span>
        <time v-if="record.updatedAt > 0" class="muted nums" :datetime="new Date(record.updatedAt).toISOString()">{{ examDate(record.updatedAt) }}</time>
        <span v-else class="muted">—</span>
      </router-link>
      <UiButton v-if="removable" variant="remove" compact :aria-label="`删除${examName(record.mode)}`" @click="$emit('remove', record)">删除</UiButton>
    </div>
  </div>
</template>

<style scoped>
.record-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) 88px 100px 126px;
  align-items: center; gap: var(--sp-2) var(--sp-3); padding: var(--sp-3) var(--sp-4);
  min-width: 0; font-size: var(--fs-sm);
}
.record-head { color: var(--ink-2); background: var(--sheet-sunk); border-radius: var(--radius) var(--radius) 0 0; font-size: var(--fs-xs); }
.record-head.removable { grid-template-columns: minmax(0, 1fr) 88px 100px 126px 52px; }
.record-row { position: relative; border-top: 1px solid var(--line); }
.record-row a { color: var(--ink); text-decoration: none; overflow-wrap: anywhere; }
.record-row a:hover { background: var(--blue-soft); }
.record-row.removable a { padding-inline-end: 80px; }
.record-row .btn { position: absolute; inset-inline-end: var(--sp-4); top: 50%; translate: 0 -50%; }
.record-score { font-size: var(--fs-lg); font-weight: 700; }
.record-score small { font-size: var(--fs-xs); font-weight: 400; }
@media (max-width: 740px) {
  .record-head { display: none; }
  .record-grid { grid-template-columns: minmax(0, 1fr) auto; }
  .record-row:first-of-type { border-top: 0; }
  .record-row time { justify-self: end; }
  .record-row.removable a { padding-inline-end: var(--sp-4); }
  .record-row.removable { padding-bottom: var(--sp-2); }
  .record-row .btn { position: static; translate: none; margin-inline-start: var(--sp-4); }
}
</style>
