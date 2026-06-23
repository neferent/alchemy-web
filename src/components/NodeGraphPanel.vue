<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@vue-flow/core'
import FlowControls from './FlowControls.vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGraphStore } from '@/stores/graph'
import { useUiStore } from '@/stores/ui'
import { useRuntimeStore } from '@/stores/runtime'
import { useElementsStore } from '@/stores/elements'
import GraphTimeline from './GraphTimeline.vue'
import NodeContextMenu from './NodeContextMenu.vue'

import OnEventNode from '@/nodes/OnEventNode.vue'
import OnTimerNode from '@/nodes/OnTimerNode.vue'
import TransientNode from '@/nodes/TransientNode.vue'
import PersistentNode from '@/nodes/PersistentNode.vue'
import ContainerNode from '@/nodes/ContainerNode.vue'
import FadeInNode from '@/nodes/FadeInNode.vue'
import FadeOutNode from '@/nodes/FadeOutNode.vue'
import SlideInNode from '@/nodes/SlideInNode.vue'
import AudioNode from '@/nodes/AudioNode.vue'
import ConditionNode from '@/nodes/ConditionNode.vue'
import DelayNode from '@/nodes/DelayNode.vue'
import SetVarNode from '@/nodes/SetVarNode.vue'
import GetVarNode from '@/nodes/GetVarNode.vue'
import ResetVarNode from '@/nodes/ResetVarNode.vue'
import MathNode from '@/nodes/MathNode.vue'
import CompareNode from '@/nodes/CompareNode.vue'
import ClampNode from '@/nodes/ClampNode.vue'
import RandomNode from '@/nodes/RandomNode.vue'
import StringFormatNode from '@/nodes/StringFormatNode.vue'
import ToNumberNode from '@/nodes/ToNumberNode.vue'
import ToStringNode from '@/nodes/ToStringNode.vue'
import EndSignalNode from '@/nodes/EndSignalNode.vue'

const nodeTypes = {
  'on-event':   OnEventNode,
  'on-timer':   OnTimerNode,
  'transient':  TransientNode,
  'persistent': PersistentNode,
  'container':  ContainerNode,
  'fade-in':    FadeInNode,
  'fade-out':   FadeOutNode,
  'slide-in':   SlideInNode,
  'audio':      AudioNode,
  'condition':  ConditionNode,
  'delay':      DelayNode,
  'set-var':    SetVarNode,
  'get-var':    GetVarNode,
  'reset-var':  ResetVarNode,
  'math':       MathNode,
  'compare':    CompareNode,
  'clamp':      ClampNode,
  'random':     RandomNode,
  'str-format': StringFormatNode,
  'to-number':  ToNumberNode,
  'to-string':  ToStringNode,
  'end-signal': EndSignalNode,
}

defineOptions({ inheritAttrs: false })

const { project } = useVueFlow()

const ctxMenu = ref<{ visible: boolean; x: number; y: number; flowPos: { x: number; y: number } }>({
  visible: false, x: 0, y: 0, flowPos: { x: 0, y: 0 }
})

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  if (!flowRef.value || !selectedArea.value) return
  const rect = flowRef.value.getBoundingClientRect()
  ctxMenu.value = {
    visible: true, x: e.clientX, y: e.clientY,
    flowPos: project({ x: e.clientX - rect.left, y: e.clientY - rect.top }),
  }
}

function onContextMenuSelect(type: string) {
  if (!selectedArea.value) return
  const newNode = { id: `${type}-${Date.now()}`, type, position: ctxMenu.value.flowPos, data: defaultDataForType(type) }
  nodes.value = [...nodes.value, newNode]
  persist()
}

const canvasStore = useCanvasStore()
const graphStore = useGraphStore()
const uiStore = useUiStore()
const runtimeStore = useRuntimeStore()
const elementsStore = useElementsStore()

// Always disable VueFlow's built-in delete — we handle it manually so we can
// clean up elements and show a confirmation for containers with children.
const deleteKeyCode = computed(() => [] as string[])

const selectedArea = computed(() => canvasStore.selectedArea)

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const flowRef = ref<HTMLDivElement | null>(null)

watch(
  () => selectedArea.value?.id,
  (id) => {
    if (!id) { nodes.value = []; edges.value = []; return }
    const g = graphStore.getGraph(id)
    nodes.value = g.nodes.map((n) => ({ ...n }))
    edges.value = g.edges.map((e) => ({ ...e }))
  },
  { immediate: true }
)

function persist() {
  if (selectedArea.value) {
    graphStore.saveGraph(selectedArea.value.id, nodes.value, edges.value)
    runtimeStore.refreshTimers()
  }
}

function isValidConnection(conn: Connection): boolean {
  if (conn.source === conn.target) return false
  // Container nodes can still be wired into lifecycle via content handle (advanced use)
  if (conn.targetHandle === 'content') {
    const src = nodes.value.find(n => n.id === conn.source)
    return src?.type === 'container'
  }
  return true
}

function onConnect(params: Connection) {
  edges.value = [...edges.value, { ...params, id: `e-${Date.now()}`, animated: false }]
  persist()
}

function onNodeDragStop() { persist() }

function onNodeClick({ node }: { node: Node }) {
  uiStore.selectNode(node.id, node.type ?? null)
}

function onPaneClick() { uiStore.selectNode(null, null) }

function onNodesChange(changes: NodeChange[]) {
  if (changes.some(c => c.type === 'remove')) persist()
}

const CONTAINER_TYPES = new Set(['container', 'transient', 'persistent'])

function deleteSelectedNode() {
  if (!uiStore.selectedNodeId || uiStore.selectedLayoutItemId) return
  const node = nodes.value.find(n => n.id === uiStore.selectedNodeId)
  if (!node) return

  if (CONTAINER_TYPES.has(node.type ?? '')) {
    const children = elementsStore.getElements(node.id)
    if (children.length > 0) {
      const ok = window.confirm(`This container has ${children.length} element${children.length > 1 ? 's' : ''}. Delete it and all its elements?`)
      if (!ok) return
    }
    elementsStore.removeNodeElements(node.id)
  }

  nodes.value = nodes.value.filter(n => n.id !== node.id)
  edges.value = edges.value.filter(e => e.source !== node.id && e.target !== node.id)
  uiStore.selectNode(null, null)
  persist()
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    e.preventDefault()
    const selectedEdges = edges.value.filter(ed => ed.selected)
    if (selectedEdges.length) {
      edges.value = edges.value.filter(ed => !ed.selected)
      persist()
    }
    deleteSelectedNode()
  }
}

function onEdgesChange(changes: EdgeChange[]) {
  if (changes.some(c => c.type === 'remove')) persist()
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer || !flowRef.value || !selectedArea.value) return
  const type = e.dataTransfer.getData('application/alchemy-node-type')
  if (!type) return
  const rect = flowRef.value.getBoundingClientRect()
  const position = project({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  nodes.value = [...nodes.value, { id: `${type}-${Date.now()}`, type, position, data: defaultDataForType(type) }]
  persist()
}

function defaultDataForType(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    'on-event':   { event: 'donation' },
    'on-timer':   { interval: 60 },
    'transient':  { duration: 10 },
    'persistent': {},
    'container':  {},
    'fade-in':    { duration: 0.5 },
    'fade-out':   { duration: 0.5 },
    'slide-in':   { duration: 0.5, direction: 'left' },
    'audio':      { src: '', volume: 1 },
    'condition':  { operator: '>', value: 0 },
    'delay':      { duration: 1 },
    'set-var':    { variable: 'myVar', value: '' },
    'get-var':    { variable: 'myVar' },
    'reset-var':  { variable: 'myVar' },
    'math':       { a: '', operator: '+', b: '1' },
    'compare':    { a: '', operator: '>', b: '0' },
    'clamp':      { value: '', min: '0', max: '100' },
    'random':     { min: 0, max: 100, integer: true },
    'str-format': { template: '' },
    'to-number':  { value: '' },
    'to-string':  { value: '', decimals: 0 },
    'end-signal': {},
  }
  return defaults[type] ?? {}
}
</script>

<template>
  <div class="graph-panel" v-bind="$attrs">
    <div v-if="!selectedArea" class="empty-state">
      <div class="empty-icon">⬡</div>
      <p class="empty-title">Node Graph</p>
      <p>Draw an area on the canvas above, then select it to start building its node graph</p>
    </div>

    <template v-else>
      <div
        ref="flowRef"
        class="flow-wrap"
        tabindex="0"
        @dragover="onDragOver"
        @drop="onDrop"
        @contextmenu="onContextMenu"
        @keydown="onKeyDown"
      >
        <VueFlow
          :key="selectedArea.id"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="{ type: 'smoothstep' }"
          :delete-key-code="deleteKeyCode"
          fit-view-on-init
          :is-valid-connection="isValidConnection"
          @connect="onConnect"
          @node-drag-stop="onNodeDragStop"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
          @nodes-change="onNodesChange"
          @edges-change="onEdgesChange"
        >
          <Background pattern-color="#2B383F" :gap="20" :size="1" />
          <FlowControls />
        </VueFlow>
        <div v-if="!nodes.length" class="graph-empty-hint">
          <p>Drag a node from the palette on the left, or <strong>right-click</strong> to add one</p>
          <p class="hint-suggestion">Start with a <strong>trigger</strong> like "On Event" to kick things off</p>
        </div>
      </div>

      <GraphTimeline :nodes="nodes" :edges="edges" />
    </template>
  </div>

  <NodeContextMenu
    :visible="ctxMenu.visible"
    :x="ctxMenu.x"
    :y="ctxMenu.y"
    @close="ctxMenu.visible = false"
    @select="onContextMenuSelect"
  />
</template>

<style scoped>
.graph-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #17242D;
  overflow: hidden;
  border-top: 2px solid rgba(128, 245, 210, 0.15);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  font-size: 28px;
  color: #2B383F;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #5a6a72;
  margin-bottom: 2px;
}

.flow-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.graph-empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  text-align: center;
  padding: 20px;
}

.graph-empty-hint p {
  font-size: 12px;
  color: #4F5E65;
  line-height: 1.4;
}

.graph-empty-hint strong {
  color: #80F5D2;
  font-weight: 600;
}

.hint-suggestion {
  font-size: 11px !important;
  color: #3a474f !important;
}
</style>
