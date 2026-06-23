<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { variable: string } }>()
</script>

<template>
  <BaseNode icon="icon-information" title="Get Variable" category="logic">
    <div class="node-field">
      <span class="node-label">Variable Name</span>
      <input v-model="props.data.variable" type="text" placeholder="myVar" class="node-input" />
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>
