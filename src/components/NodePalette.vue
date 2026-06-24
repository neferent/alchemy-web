<script setup lang="ts">
import { ref } from 'vue'
import { NODE_TYPES, NODE_CATEGORY_COLORS, type NodeCategory } from '@/types'
import { ICONS } from '@/utils/icons'

const categories: { key: NodeCategory; label: string }[] = [
  { key: 'trigger',    label: 'Triggers' },
  { key: 'lifecycle',  label: 'Containers' },
  { key: 'transition', label: 'Transitions' },
  { key: 'logic',     label: 'Logic' },
]

const collapsed = ref<Set<NodeCategory>>(new Set())
const advancedCollapsed = ref(true)

function toggle(key: NodeCategory) {
  if (collapsed.value.has(key)) collapsed.value.delete(key)
  else collapsed.value.add(key)
}

function nodesFor(cat: NodeCategory, advanced = false) {
  return NODE_TYPES.filter((n) => n.category === cat && !!n.advanced === advanced)
}

function onDragStart(e: DragEvent, type: string) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/alchemy-node-type', type)
  e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="palette">
    <div v-for="cat in categories" :key="cat.key" class="palette-group">
      <div
        class="palette-category"
        :style="{ color: NODE_CATEGORY_COLORS[cat.key] }"
        @click="toggle(cat.key)"
      >
        <span class="palette-chevron" :class="{ collapsed: collapsed.has(cat.key) }">▾</span>
        {{ cat.label }}
      </div>
      <template v-if="!collapsed.has(cat.key)">
        <div
          v-for="node in nodesFor(cat.key)"
          :key="node.type"
          class="palette-item"
          draggable="true"
          :style="{ '--cat-color': NODE_CATEGORY_COLORS[cat.key] }"
          @dragstart="(e) => onDragStart(e, node.type)"
        >
          <span class="palette-icon"><component :is="ICONS[node.icon]" :size="15" /></span>
          <span class="palette-label">{{ node.label }}</span>
        </div>

        <template v-if="cat.key === 'logic'">
          <div class="palette-advanced-toggle" @click="advancedCollapsed = !advancedCollapsed">
            <span class="palette-chevron" :class="{ collapsed: advancedCollapsed }">▾</span>
            Advanced
          </div>
          <template v-if="!advancedCollapsed">
            <div
              v-for="node in nodesFor('logic', true)"
              :key="node.type"
              class="palette-item"
              draggable="true"
              :style="{ '--cat-color': NODE_CATEGORY_COLORS['logic'] }"
              @dragstart="(e) => onDragStart(e, node.type)"
            >
              <span class="palette-icon"><component :is="ICONS[node.icon]" :size="15" /></span>
              <span class="palette-label">{{ node.label }}</span>
            </div>
          </template>
        </template>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.palette {
  width: 100%;
  background: var(--surface-2);
  overflow-y: auto;
  padding: 8px 0;
}

.palette-group {
  margin-bottom: 4px;
}

.palette-category {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 6px 10px 3px;
  cursor: pointer;
  user-select: none;
}

.palette-category:hover {
  opacity: 0.8;
}

.palette-chevron {
  font-size: 12px;
  transition: transform 120ms ease;
  display: inline-block;
}

.palette-chevron.collapsed {
  transform: rotate(-90deg);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  cursor: grab;
  border-left: 2px solid transparent;
  transition: all 120ms ease;
  font-size: 13px;
  color: var(--text-muted);
}

.palette-item:hover {
  background: var(--surface-3);
  border-left-color: var(--cat-color);
  color: var(--text);
}

.palette-item:active {
  cursor: grabbing;
}

.palette-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
  font-size: 15px;
}

.palette-label {
  font-size: 13px;
  white-space: nowrap;
}

.palette-advanced-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 5px 10px 3px 10px;
  cursor: pointer;
  user-select: none;
  margin-top: 2px;
}

.palette-advanced-toggle:hover {
  color: var(--text-muted);
}
</style>
