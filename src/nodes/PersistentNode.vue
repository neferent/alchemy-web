<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { useElementsStore } from '@/stores/elements'

const props = defineProps<{ id: string; data: Record<string, never> }>()
const elementsStore = useElementsStore()
const count = computed(() => elementsStore.getElements(props.id).length)
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-lock-2" title="Persistent Container" category="lifecycle">
    <div class="node-hint">{{ count }} element{{ count !== 1 ? 's' : '' }} — edit in panel</div>
  </BaseNode>
  <Handle id="out" type="source" :position="Position.Right" />
</template>

<style scoped>
.node-hint {
  font-size: 10px;
  color: #4F5E65;
}
</style>
