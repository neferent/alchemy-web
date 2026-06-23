<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

defineProps<{ data: Record<string, never> }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-stop-recording" title="End Signal" category="trigger" />
</template>
