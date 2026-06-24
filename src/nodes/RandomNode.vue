<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { min: number; max: number; integer: boolean } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="shuffle" title="Random" category="logic">
    <div class="row">
      <div class="node-field" style="flex: 1">
        <span class="node-label">Min</span>
        <input v-model.number="props.data.min" type="number" class="node-input" />
      </div>
      <div class="node-field" style="flex: 1">
        <span class="node-label">Max</span>
        <input v-model.number="props.data.max" type="number" class="node-input" />
      </div>
    </div>
    <div class="node-field">
      <label class="node-checkbox">
        <input v-model="props.data.integer" type="checkbox" />
        Integer only
      </label>
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>

<style scoped>
.row {
  display: flex;
  gap: 6px;
}
.node-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
}
.node-checkbox input {
  cursor: pointer;
}
</style>
