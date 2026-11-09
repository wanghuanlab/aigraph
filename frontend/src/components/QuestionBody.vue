<script setup lang="ts">
import type { ContentBlock } from '../api';

const props = defineProps<{ blocks: ContentBlock[]; bare?: boolean }>();

function visible(blocks: ContentBlock[]) {
  return blocks.filter((block) => !block.hidden);
}
function marker(value: string) {
  return /^[\uF000-\uF8FF]$/.test(value) ? '•' : value;
}
</script>

<template>
  <div :class="props.bare ? 'qc-nest' : 'qc'">
    <template v-for="(block, index) in visible(props.blocks)" :key="index">
      <h3 v-if="block.type === 'heading' && block.level <= 2">{{ block.text }}</h3>
      <h4 v-else-if="block.type === 'heading'">{{ block.text }}</h4>
      <p v-else-if="block.type === 'paragraph'">{{ block.text }}</p>
      <p v-else-if="block.type === 'note'" class="qc-note">{{ block.text }}</p>
      <div v-else-if="block.type === 'options'" class="qc-options">
        <span>{{ block.stem }}</span>
        <span v-for="choice in block.choices" :key="choice" class="qc-choice">{{ choice }}</span>
      </div>
      <div v-else-if="block.type === 'table'" class="qc-table-wrap">
        <table>
          <thead><tr><th v-for="column in block.columns" :key="column">{{ column }}</th></tr></thead>
          <tbody>
            <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul v-else-if="block.type === 'list'" class="qc-list" :class="block.style">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <span class="qc-marker">{{ marker(item.marker) }}</span>
          <div>
            <QuestionBody :blocks="item.blocks.filter((child) => !child.hidden)" bare />
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
