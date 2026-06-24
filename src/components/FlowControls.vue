<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Panel, useVueFlow } from '@vue-flow/core'
import dagre from '@dagrejs/dagre'
import { ICONS } from '@/utils/icons'

const { zoomIn, zoomOut, fitView, getNodes, getEdges, setNodes, nodesDraggable, nodesConnectable, elementsSelectable } = useVueFlow()

const isLocked = ref(false)

function toggleLock() {
  isLocked.value = !isLocked.value
  nodesDraggable.value = !isLocked.value
  nodesConnectable.value = !isLocked.value
  elementsSelectable.value = !isLocked.value
}

function autoLayout() {
  const nodes = getNodes.value
  const edges = getEdges.value

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40 })

  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.dimensions?.width ?? 180,
      height: node.dimensions?.height ?? 80,
    })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  setNodes(nodes.map(node => {
    const { x, y, width, height } = g.node(node.id)
    return { ...node, position: { x: x - width / 2, y: y - height / 2 } }
  }))

  nextTick(() => fitView({ padding: 0.2 }))
}
</script>

<template>
  <Panel position="top-right" class="graph-controls">
    <button class="ctrl-btn" title="Zoom in" @click="zoomIn()"><component :is="ICONS['zoom-in']" :size="16" /></button>
    <button class="ctrl-btn" title="Zoom out" @click="zoomOut()"><component :is="ICONS['zoom-out']" :size="16" /></button>
    <button class="ctrl-btn" title="Fit view" @click="fitView({ padding: 0.2 })"><component :is="ICONS['maximize']" :size="16" /></button>
    <button class="ctrl-btn" title="Auto-layout" @click="autoLayout()"><component :is="ICONS['layout-dashboard']" :size="16" /></button>
    <button class="ctrl-btn" :class="{ active: isLocked }" :title="isLocked ? 'Unlock' : 'Lock'" @click="toggleLock">
      <component :is="isLocked ? ICONS['lock'] : ICONS['unlock']" :size="16" />
    </button>
  </Panel>
</template>

<style scoped>
.graph-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: var(--surface-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.ctrl-btn:hover {
  background: var(--border-strong);
  color: var(--text);
}

.ctrl-btn.active {
  color: var(--warning);
}
</style>
