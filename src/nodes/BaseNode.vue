<script setup lang="ts">
import { useNode, useVueFlow } from '@vue-flow/core'
import type { NodeCategory } from '@/types'
import { NODE_CATEGORY_COLORS } from '@/types'

defineProps<{
  icon: string
  title: string
  category: NodeCategory
}>()

const { id } = useNode()
const { removeNodes } = useVueFlow()

function deleteNode() {
  removeNodes([id])
}
</script>

<template>
  <div class="base-node" :style="{ '--cat': NODE_CATEGORY_COLORS[category] }">
    <div class="node-header">
      <span class="node-drag-handle"><i class="icon-move" /></span>
      <span class="node-icon"><i :class="icon" /></span>
      <span class="node-title">{{ title }}</span>
      <button class="node-delete" title="Delete node" @click.stop="deleteNode"><i class="icon-close" /></button>
    </div>
    <div class="node-body nodrag">
      <slot />
    </div>
  </div>
</template>

<style>
/* Global so child nodes can override */
.base-node {
  min-width: 160px;
  max-width: 220px;
  background: #2B383F;
  border: 1px solid #3a474f;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text);
  box-shadow: 0 2px 12px #00000050;
  position: relative;
  overflow: hidden;
}

.base-node::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--cat);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px 6px;
  border-bottom: 1px solid #3a474f;
}

.node-drag-handle {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #4F5E65;
  cursor: grab;
  font-size: 12px;
}

.node-drag-handle:active {
  cursor: grabbing;
}

.node-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 13px;
}

.node-title {
  font-size: 11px;
  font-weight: 600;
  color: #BDC2C4;
  letter-spacing: 0.1px;
  flex: 1;
}

.node-delete {
  display: flex;
  visibility: hidden;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  border-radius: 3px;
  color: #4F5E65;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.node-delete:hover {
  background: rgba(255, 111, 91, 0.15);
  color: #FF6F5B;
}

.base-node:hover .node-delete {
  visibility: visible;
}

.node-body {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #91979A;
}

.node-input,
.node-select {
  background: #17242D;
  border: 1px solid #3a474f;
  border-radius: 4px;
  color: #BDC2C4;
  font-size: 11px;
  padding: 3px 6px;
  width: 100%;
  outline: none;
}

.node-input:focus,
.node-select:focus {
  border-color: #80F5D2;
}

.node-select option {
  background: #2B383F;
}

.content-hint {
  font-size: 9px;
  color: #4F5E65;
  text-align: center;
  margin-top: 2px;
}
</style>
