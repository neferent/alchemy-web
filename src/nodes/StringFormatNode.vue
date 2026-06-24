<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { template: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="layout-grid" title="String Format" category="logic">
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
  font-size: 11px;
  color: var(--text-faint);
  padding-top: 2px;
}
</style>
