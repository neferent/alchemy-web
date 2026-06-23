<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppCanvas from './components/AppCanvas.vue'
import NodeGraphPanel from './components/NodeGraphPanel.vue'
import NodePalette from './components/NodePalette.vue'
import ElementsPanel from './components/ElementsPanel.vue'
import ExportModal from './components/ExportModal.vue'
import { useCanvasStore } from './stores/canvas'
import { useGraphStore } from './stores/graph'
import { useLayoutStore } from './stores/layout'
import { useElementsStore } from './stores/elements'
import { useUiStore } from './stores/ui'
import { useRuntimeStore } from './stores/runtime'

const canvasStore = useCanvasStore()
const graphStore = useGraphStore()
const layoutStore = useLayoutStore()
const elementsStore = useElementsStore()
const uiStore = useUiStore()
const runtimeStore = useRuntimeStore()

const selectedArea = computed(() => canvasStore.selectedArea)
const showExport = ref(false)

function newScene() {
  if (!confirm('Start a new scene? Unsaved changes will be lost.')) return
  uiStore.selectNode(null, null)
  uiStore.selectLayoutItem(null)
  canvasStore.areas = []
  canvasStore.selectedAreaId = null
  graphStore.graphs = {}
  layoutStore.layout = {}
  elementsStore.elements = {}
}

async function saveScene() {
  // Strip VueFlow-internal properties — only persist what we need to reconstruct the graph
  const slimGraphs = Object.fromEntries(
    Object.entries(graphStore.graphs).map(([areaId, g]) => [
      areaId,
      {
        nodes: g.nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
        edges: g.edges.map(({ id, source, target, sourceHandle, targetHandle }) =>
          ({ id, source, target, sourceHandle, targetHandle })),
      },
    ])
  )
  const payload = JSON.stringify({
    version: 2,
    areas: canvasStore.areas,
    graphs: slimGraphs,
    layout: layoutStore.layout,
    elements: elementsStore.elements,
  }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'scene.alchemy'
  a.click()
  URL.revokeObjectURL(a.href)
}

async function loadScene() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.alchemy,application/json'
  const file = await new Promise<File | null>(resolve => {
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
  if (!file) return
  try {
    const { areas, graphs, layout, elements } = JSON.parse(await file.text())
    // Reset transient UI state before swapping store data
    uiStore.selectNode(null, null)
    uiStore.selectLayoutItem(null)
    runtimeStore.resetSession()
    canvasStore.areas = areas
    canvasStore.selectedAreaId = null
    graphStore.graphs = graphs
    if (layout) layoutStore.layout = layout
    if (elements) elementsStore.elements = elements
  } catch {
    console.error('Failed to parse scene file')
  }
}

// ── Resizable split ───────────────────────────────────────────────────────────

const HEADER_HEIGHT = 48
const MIN_PANE_PX = 120
const STORAGE_KEY = 'alchemy:graphHeight'

const graphHeight = ref(Math.round(window.innerHeight * 0.45))
const isDragging = ref(false)
const graphCollapsed = ref(false)
let savedGraphHeight = graphHeight.value

function toggleGraphCollapse() {
  if (graphCollapsed.value) {
    graphHeight.value = savedGraphHeight
    graphCollapsed.value = false
  } else {
    savedGraphHeight = graphHeight.value
    graphHeight.value = 0
    graphCollapsed.value = true
  }
}

function onDividerMousedown(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  const startY = e.clientY
  const startH = graphHeight.value

  function onMove(ev: MouseEvent) {
    const delta = startY - ev.clientY
    const totalH = window.innerHeight - HEADER_HEIGHT
    graphHeight.value = Math.max(MIN_PANE_PX, Math.min(totalH - MIN_PANE_PX, startH + delta))
  }

  function onUp() {
    isDragging.value = false
    localStorage.setItem(STORAGE_KEY, String(graphHeight.value))
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onGlobalKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (e.key === 'Escape') {
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      (e.target as HTMLElement).blur()
      return
    }
    if (uiStore.selectedLayoutItemId) { uiStore.selectLayoutItem(null); return }
    if (uiStore.selectedNodeId) { uiStore.selectNode(null, null); return }
  }
  const mod = e.metaKey || e.ctrlKey
  if (!mod) return
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (e.key === 's') { e.preventDefault(); if (canvasStore.areas.length) saveScene() }
  else if (e.key === 'o') { e.preventDefault(); loadScene() }
  else if (e.key === 'e') { e.preventDefault(); if (canvasStore.areas.length) showExport.value = true }
}

onMounted(() => {
  const max = window.innerHeight - HEADER_HEIGHT - MIN_PANE_PX
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? '')
  if (!isNaN(saved) && saved >= MIN_PANE_PX && saved <= max) graphHeight.value = saved
  else localStorage.removeItem(STORAGE_KEY)

  window.addEventListener('keydown', onGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">Alchemy</div>
      <div class="header-center">
        <span v-if="selectedArea" class="area-pill" :style="{ borderColor: selectedArea.color }">
          {{ selectedArea.name }}
        </span>
        <span v-else class="header-hint">Click the □ draw tool, then drag on the canvas to create an area</span>
      </div>
      <div class="header-actions">
        <button class="btn-scene" @click="newScene">New</button>
        <button class="btn-scene" title="Open scene file (Ctrl+O)" @click="loadScene">Open</button>
        <button class="btn-scene" title="Save scene file (Ctrl+S)" :disabled="!canvasStore.areas.length" @click="saveScene">Save</button>
        <div class="header-divider" />
        <button class="btn-export" title="Export widget (Ctrl+E)" :disabled="!canvasStore.areas.length" @click="showExport = true">
          Export Widget
        </button>
      </div>
    </header>

    <ExportModal v-if="showExport" @close="showExport = false" />

    <main class="app-main" :style="{ userSelect: isDragging ? 'none' : 'auto' }">
      <!-- Left sidebar: elements panel (top) + node palette (bottom) -->
      <div class="left-col" :style="{ '--graph-h': graphHeight + 'px' }">
        <ElementsPanel class="elements-pane" />
        <div class="left-sep" />
        <NodePalette class="palette-pane" />
      </div>

      <!-- Right content: canvas (top) + divider + node graph (bottom) -->
      <div class="right-col">
        <AppCanvas class="canvas-pane" @open-scene="loadScene" />
        <div
          class="panel-divider"
          :class="{ dragging: isDragging, collapsed: graphCollapsed }"
          @mousedown="onDividerMousedown"
        >
          <button class="collapse-btn" @mousedown.stop @click="toggleGraphCollapse">
            {{ graphCollapsed ? '▲' : '▼' }}
          </button>
        </div>
        <NodeGraphPanel class="graph-pane" :style="{ height: graphHeight + 'px' }" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo {
  font-size: 20px;
  font-weight: 500;
  color: var(--text);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.area-pill {
  font-size: 14px;
  color: var(--text);
  border: 1px solid;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
}

.header-hint {
  font-size: 14px;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-scene {
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #ffffff22;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.btn-scene:hover:not(:disabled) { background: #ffffff0d; color: var(--text); }
.btn-scene:disabled { opacity: 0.35; cursor: default; }

.header-divider { width: 1px; height: 20px; background: var(--border); }

.btn-export {
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(128,245,210,0.3);
  background: transparent;
  color: #80F5D2;
  cursor: pointer;
}
.btn-export:hover:not(:disabled) { background: rgba(128,245,210,0.08); }
.btn-export:disabled { opacity: 0.35; cursor: default; }

.app-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* ── Left sidebar ── */

.left-col {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  overflow: hidden;
}

.elements-pane {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.left-sep {
  height: 4px;
  background: var(--border);
  flex-shrink: 0;
  box-shadow: 0 4px 16px #00000060;
}

.palette-pane {
  height: var(--graph-h, 0px);
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Right column ── */

.right-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.canvas-pane {
  flex: 1;
  min-height: 0;
}

.panel-divider {
  height: 4px;
  background: var(--border);
  flex-shrink: 0;
  cursor: row-resize;
  transition: background 0.15s;
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 16px #00000060;
}

.panel-divider::after {
  content: '';
  position: absolute;
  inset: -4px 0;
}

.panel-divider:hover,
.panel-divider.dragging {
  background: rgba(128,245,210,0.3);
}

.collapse-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 8px;
  line-height: 1;
  padding: 2px 8px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 10;
}
.panel-divider:hover .collapse-btn,
.panel-divider.collapsed .collapse-btn { opacity: 1; }

.graph-pane {
  flex-shrink: 0;
  min-height: 0;
}
</style>
