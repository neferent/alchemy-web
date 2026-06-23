<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { template: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-widgets" title="String Format" category="logic">
    <div class="node-field">
      <span class="node-label">Template</span>
      <input v-model="props.data.template" type="text" placeholder="Top tip: {$maxTip}" class="node-input" />
    </div>
    <div class="hint">Use {$varName} for variables</div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>

<style scoped>
.hint {
  font-size: 9px;
  color: #6b7280;
  padding-top: 2px;
}
</style>
