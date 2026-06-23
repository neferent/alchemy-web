<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { a: string; operator: string; b: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-stats" title="Math" category="logic">
    <div class="row">
      <div class="node-field" style="flex: 1">
        <span class="node-label">A</span>
        <input v-model="props.data.a" type="text" placeholder="{$hype}" class="node-input" />
      </div>
      <div class="node-field" style="flex: 0 0 56px">
        <span class="node-label">Op</span>
        <select v-model="props.data.operator" class="node-select">
          <option value="+">+</option>
          <option value="-">−</option>
          <option value="*">×</option>
          <option value="/">/</option>
          <option value="%">%</option>
          <option value="min">min</option>
          <option value="max">max</option>
        </select>
      </div>
      <div class="node-field" style="flex: 1">
        <span class="node-label">B</span>
        <input v-model="props.data.b" type="text" placeholder="1" class="node-input" />
      </div>
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>

<style scoped>
.row {
  display: flex;
  gap: 6px;
}
</style>
