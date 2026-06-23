<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Panel, useVueFlow } from '@vue-flow/core'
import dagre from '@dagrejs/dagre'

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
    <button class="ctrl-btn" title="Zoom in" @click="zoomIn()"><i class="icon-zoom" /></button>
    <button class="ctrl-btn" title="Zoom out" @click="zoomOut()"><i class="icon-reduce-screen" /></button>
    <button class="ctrl-btn" title="Fit view" @click="fitView({ padding: 0.2 })"><i class="icon-full-screen" /></button>
    <button class="ctrl-btn" title="Auto-layout" @click="autoLayout()"><i class="icon-dashboard" /></button>
    <button class="ctrl-btn" :class="{ active: isLocked }" :title="isLocked ? 'Unlock' : 'Lock'" @click="toggleLock">
      <i :class="isLocked ? 'icon-lock' : 'icon-unlock'" />
    </button>
  </Panel>
</template>

<style scoped>
.graph-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: #2B383F;
  border: 1px solid #3a474f;
  border-radius: 6px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #91979A;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.1s, color 0.1s;
}

.ctrl-btn:hover {
  background: #3a474f;
  color: #BDC2C4;
}

.ctrl-btn.active {
  color: #FFBE72;
}
</style>
