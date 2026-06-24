<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { useElementsStore } from '@/stores/elements'

const props = defineProps<{ id: string; data: { duration: number } }>()
const elementsStore = useElementsStore()
const count = computed(() => elementsStore.getElements(props.id).length)
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="box-select" title="Transient Container" category="lifecycle">
    <div class="node-field">
      <span class="node-label">Duration (s)</span>
      <input v-model.number="props.data.duration" type="number" min="0.1" step="0.5" class="node-input" />
    </div>
    <div class="node-hint">{{ count }} element{{ count !== 1 ? 's' : '' }} — edit in panel</div>
  </BaseNode>
  <Handle id="out" type="source" :position="Position.Right" />
</template>

<style scoped>
.node-hint {
  font-size: 12px;
  color: var(--text-faint);
  margin-top: 2px;
}
</style>
