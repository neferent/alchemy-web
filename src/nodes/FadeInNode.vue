<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { duration: number } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-transition" title="Fade In" category="transition">
    <div class="node-field">
      <span class="node-label">Duration (s)</span>
      <input v-model.number="props.data.duration" type="number" min="0.05" step="0.1" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
