<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { value: string; min: string; max: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-align-center-horizontal" title="Clamp" category="logic">
    <div class="node-field">
      <span class="node-label">Value</span>
      <input v-model="props.data.value" type="text" placeholder="{$hype}" class="node-input" />
    </div>
    <div class="row">
      <div class="node-field" style="flex: 1">
        <span class="node-label">Min</span>
        <input v-model="props.data.min" type="text" placeholder="0" class="node-input" />
      </div>
      <div class="node-field" style="flex: 1">
        <span class="node-label">Max</span>
        <input v-model="props.data.max" type="text" placeholder="100" class="node-input" />
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
