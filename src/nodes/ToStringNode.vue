<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { value: string; decimals: number } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="case-sensitive" title="To String" category="logic">
    <div class="node-field">
      <span class="node-label">Value</span>
      <input v-model="props.data.value" type="text" placeholder="{$hype}" class="node-input" />
    </div>
    <div class="node-field">
      <span class="node-label">Decimal Places</span>
      <input v-model.number="props.data.decimals" type="number" min="0" max="10" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
