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
  <BaseNode icon="icon-group" title="Container" category="lifecycle">
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
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  font-size: 10px;
  padding: 4px 6px;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.edit-btn:hover {
  border-color: #8b5cf6;
  color: #a78bfa;
}
.edit-btn.active {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.12);
  color: #a78bfa;
}
.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8b5cf6;
  flex-shrink: 0;
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.hint {
  font-size: 9px;
  color: #4F5E65;
  text-align: center;
  margin: 0;
}
</style>
