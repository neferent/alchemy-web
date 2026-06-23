<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { duration: number } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-time" title="Delay" category="logic">
    <div class="node-field">
      <span class="node-label">Wait (seconds)</span>
      <input v-model.number="props.data.duration" type="number" min="0" step="0.1" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
