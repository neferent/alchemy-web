<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { useElementsStore } from '@/stores/elements'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ id: string; data: Record<string, never> }>()
const elementsStore = useElementsStore()
const uiStore = useUiStore()
const count = computed(() => elementsStore.getElements(props.id).length)
const isEditing = computed(() => uiStore.selectedNodeId === props.id)
</script>

<template>
  <Handle id="out" type="source" :position="Position.Left" />
  <BaseNode icon="layers" title="Container" category="lifecycle">
    <button
      class="edit-btn"
      :class="{ active: isEditing }"
      @click="uiStore.selectNode(props.id, 'container')"
    >
      <span v-if="isEditing" class="active-dot" />
      {{ isEditing ? `${count} elements · editing` : `${count} elements · click to edit` }}
    </button>
    <p v-if="!isEditing" class="hint">Select to edit element canvas</p>
  </BaseNode>
  <Handle id="flow-out" type="source" :position="Position.Right" />
</template>

<style scoped>
.edit-btn {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 12px;
  padding: 4px 6px;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
}
.edit-btn:hover {
  border-color: var(--cat-lifecycle);
  color: var(--cat-lifecycle);
}
.edit-btn.active {
  border-color: var(--cat-lifecycle);
  background: rgba(182, 138, 229, 0.12);
  color: var(--cat-lifecycle);
}
.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cat-lifecycle);
  flex-shrink: 0;
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.hint {
  font-size: 11px;
  color: var(--text-faint);
  text-align: center;
  margin: 0;
}
</style>
