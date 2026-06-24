<script setup lang="ts">
import { useNode, useVueFlow } from '@vue-flow/core'
import type { NodeCategory } from '@/types'
import { NODE_CATEGORY_COLORS } from '@/types'
import { ICONS } from '@/utils/icons'

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
      <span class="node-drag-handle"><component :is="ICONS['grip-vertical']" :size="13" /></span>
      <span class="node-icon"><component :is="ICONS[icon]" :size="14" /></span>
      <span class="node-title">{{ title }}</span>
      <button class="node-delete" title="Delete node" @click.stop="deleteNode"><component :is="ICONS['x']" :size="11" /></button>
    </div>
    <div class="node-body nodrag">
      <slot />
    </div>
  </div>
</template>

<style>
/* Global so child nodes can override */
.base-node {
  min-width: 180px;
  max-width: 240px;
  background: var(--surface-3);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius-lg);
  font-size: 13px;
  color: var(--text);
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
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
  border-bottom: 1px solid var(--border-strong);
}

.node-drag-handle {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--text-faint);
  cursor: grab;
}

.node-drag-handle:active {
  cursor: grabbing;
}

.node-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.node-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
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
  border-radius: var(--radius-sm);
  color: var(--text-faint);
  line-height: 1;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.node-delete:hover {
  background: var(--danger-tint);
  color: var(--danger);
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
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
}

.node-input,
.node-select {
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 4px 6px;
  width: 100%;
  outline: none;
}

.node-input:focus,
.node-select:focus {
  border-color: var(--accent);
}

.node-select option {
  background: var(--surface-3);
}

.content-hint {
  font-size: 11px;
  color: var(--text-faint);
  text-align: center;
  margin-top: 2px;
}
</style>
