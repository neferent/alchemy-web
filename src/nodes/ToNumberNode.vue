<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { value: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-filter" title="To Number" category="logic">
    <div class="node-field">
      <span class="node-label">Value</span>
      <input v-model="props.data.value" type="text" placeholder="{$amountStr}" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
