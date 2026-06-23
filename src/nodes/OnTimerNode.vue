<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { interval: number } }>()
</script>

<template>
  <BaseNode icon="icon-time" title="On Timer" category="trigger">
    <div class="node-field">
      <span class="node-label">Every (seconds)</span>
      <input v-model.number="props.data.interval" type="number" min="1" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
