<script setup lang="ts">
import StatusTag from './StatusTag.vue';

export interface SheetItem {
  id: string;
  label: string;
  title?: string;
  points?: number;
  state: 'empty' | 'partial' | 'complete';
  current: boolean;
  marked?: boolean;
}

defineProps<{ groups: Array<{ id: string; title?: string; open?: boolean; items: SheetItem[] }>; compact?: boolean }>();
defineEmits<{ select: [id: string]; toggle: [id: string] }>();
const stateLabel = { empty: '○ 未答', partial: '◐ 部分作答', complete: '✓ 已答' };
</script>

<template>
  <nav class="answer-sheet" aria-label="答题卡">
    <h2 class="rail-heading">答题卡</h2>
    <section v-for="group in groups" :key="group.id" class="sheet-group">
      <button v-if="group.title" type="button" class="sheet-fold" :aria-expanded="group.open" @click="$emit('toggle', group.id)">
        <span>{{ group.title }} {{ group.items.length }} 题</span><span aria-hidden="true">{{ group.open ? '−' : '+' }}</span>
      </button>
      <div v-if="!group.title || group.open" class="sheet-items" :class="{ compact }">
        <button
          v-for="item in group.items" :key="item.id" type="button"
          class="sheet-item nums" :class="[item.state, { current: item.current, marked: item.marked }]"
          :aria-current="item.current ? 'step' : undefined"
          :aria-label="[item.label, item.title, item.points !== undefined ? `${item.points} 分` : '', stateLabel[item.state].slice(2), item.marked ? '已标记' : ''].filter(Boolean).join('，')"
          :title="item.title"
          @click="$emit('select', item.id)"
        >
          <strong><span v-if="item.current && !compact" aria-hidden="true">▸ </span>{{ item.label }}</strong>
          <span v-if="item.points !== undefined">{{ item.points }} 分</span>
          <small v-if="!compact">{{ stateLabel[item.state] }}<template v-if="item.title"> · {{ item.title }}</template></small>
          <span v-else class="sheet-mark" aria-hidden="true">{{ item.current ? '▸' : item.marked ? '⚑' : item.state === 'complete' ? '✓' : '○' }}<template v-if="item.current && item.marked">⚑</template></span>
        </button>
      </div>
    </section>
    <div class="sheet-legend">
      <StatusTag tone="blue">▸ 当前题</StatusTag><StatusTag tone="ok">✓ 已答</StatusTag>
      <StatusTag v-if="compact" tone="warn">⚑ 已标记</StatusTag>
      <StatusTag v-else tone="warn">◐ 部分作答</StatusTag>
      <StatusTag>○ 未答</StatusTag>
    </div>
  </nav>
</template>

<style scoped>
.drawer .rail-heading { display: none; }
.sheet-group + .sheet-group { margin-top: var(--sp-2); }
.sheet-fold, .sheet-item { width: 100%; border-radius: var(--radius-sm); color: var(--ink); font-size: var(--fs-sm); }
.sheet-fold {
  display: flex; justify-content: space-between; gap: var(--sp-2); padding: var(--sp-2);
  margin-bottom: var(--sp-2); border: 1px solid var(--line-strong); background: var(--sheet-sunk);
}
.sheet-items { display: grid; gap: var(--sp-2); }
.sheet-items.compact { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sheet-item {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0 var(--sp-1);
  padding: var(--sp-2); min-height: 42px; text-align: start;
  background: var(--sheet); border: 1px solid var(--control-line); border-inline-start-width: 3px;
}
.sheet-item span, .sheet-item small { font-size: var(--fs-xs); }
.sheet-item small { grid-column: 1 / -1; color: var(--muted); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.sheet-item.complete { border-inline-start-color: var(--ok); }
.sheet-item.partial { border-inline-start-color: var(--warn); }
.sheet-item.current, .sheet-item:hover { color: var(--blue); border-color: var(--blue); background: var(--blue-soft); }
.sheet-items.compact .sheet-item { border-inline-start-width: 1px; }
.sheet-items.compact .complete:not(.current, :hover) { color: var(--ok); background: var(--ok-soft); }
.sheet-item.marked .sheet-mark { color: var(--warn); }
.sheet-legend { display: flex; flex-wrap: wrap; gap: var(--sp-1); margin-top: var(--sp-3); }
</style>
