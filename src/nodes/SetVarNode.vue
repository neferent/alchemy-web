<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { variable: string; value: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-edit" title="Set Variable" category="logic">
    <div class="node-field">
      <span class="node-label">Variable Name</span>
      <input v-model="props.data.variable" type="text" placeholder="topTip" class="node-input" />
    </div>
    <div class="node-field">
      <span class="node-label">Value (or {$eventAmount})</span>
      <input v-model="props.data.value" type="text" placeholder="{$amount}" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
