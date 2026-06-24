<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGraphStore } from '@/stores/graph'
import { useElementsStore } from '@/stores/elements'
import { useLayoutStore } from '@/stores/layout'
import { useRuntimeStore } from '@/stores/runtime'
import { useUiStore } from '@/stores/ui'
import type { ItemLayout } from '@/stores/layout'
import type { ElementData, ElementType } from '@/types'
import type { ContentItem, ContainerItem, RenderItem } from '@/engine/executor'
import AreaItem from './AreaItem.vue'
import { ICONS } from '@/utils/icons'

const canvasStore = useCanvasStore()
const graphStore = useGraphStore()
const elementsStore = useElementsStore()
const layoutStore = useLayoutStore()
const runtimeStore = useRuntimeStore()
const uiStore = useUiStore()

defineEmits<{ 'open-scene': [] }>()

// ── Canvas sizing ──────────────────────────────────────────────────────────────

const BASE_W = 1920
const BASE_H = 1080

const outerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)

const outerSize = reactive({ w: 0, h: 0 })
const fitScale = ref(1)
const userZoom = ref(1)
const panX = ref(0)
const panY = ref(0)

const totalScale = computed(() => fitScale.value * userZoom.value)
const baseTx = computed(() => (outerSize.w - BASE_W * totalScale.value) / 2)
const baseTy = computed(() => (outerSize.h - BASE_H * totalScale.value) / 2)
const tx = computed(() => baseTx.value + panX.value)
const ty = computed(() => baseTy.value + panY.value)

let ro: ResizeObserver | null = null

onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    outerSize.w = width
    outerSize.h = height
    const pad = 24
    fitScale.value = Math.min((width - pad * 2) / BASE_W, (height - pad * 2) / BASE_H)
  })
  if (outerRef.value) ro.observe(outerRef.value)
})

onUnmounted(() => {
  ro?.disconnect()
  stopDrag()
  window.removeEventListener('mousemove', onLayoutMouseMove)
  window.removeEventListener('mouseup', onLayoutMouseUp)
  window.removeEventListener('mousemove', onMidDragMove)
  window.removeEventListener('mouseup', onMidDragUp)
})

// Fixed 32-column grid in canvas units (60px at 1920 wide)
const gridCell = computed(() => (BASE_W / 32).toFixed(3))

// ── Zoom & Pan ────────────────────────────────────────────────────────────────

const zoomLabel = computed(() => {
  if (Math.abs(userZoom.value - 1) < 0.001) return 'Fit'
  return Math.round(userZoom.value * 100) + '%'
})

function onWheel(e: WheelEvent) {
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
  const newZoom = Math.max(0.1, Math.min(10, userZoom.value * factor))

  const outerRect = outerRef.value!.getBoundingClientRect()
  const cx = e.clientX - outerRect.left
  const cy = e.clientY - outerRect.top

  // canvas-space point under cursor
  const px = (cx - tx.value) / totalScale.value
  const py = (cy - ty.value) / totalScale.value

  const newTotal = fitScale.value * newZoom
  const newBaseTx = (outerSize.w - BASE_W * newTotal) / 2
  const newBaseTy = (outerSize.h - BASE_H * newTotal) / 2

  panX.value = cx - px * newTotal - newBaseTx
  panY.value = cy - py * newTotal - newBaseTy
  userZoom.value = newZoom
}

function resetView() {
  userZoom.value = 1
  panX.value = 0
  panY.value = 0
}

interface MidDrag { startX: number; startY: number; startPanX: number; startPanY: number }
let midDrag: MidDrag | null = null

function onOuterMouseDown(e: MouseEvent) {
  if (e.button !== 1) return
  e.preventDefault()
  midDrag = { startX: e.clientX, startY: e.clientY, startPanX: panX.value, startPanY: panY.value }
  window.addEventListener('mousemove', onMidDragMove)
  window.addEventListener('mouseup', onMidDragUp)
}

function onMidDragMove(e: MouseEvent) {
  if (!midDrag) return
  panX.value = midDrag.startPanX + (e.clientX - midDrag.startX)
  panY.value = midDrag.startPanY + (e.clientY - midDrag.startY)
}

function onMidDragUp(e: MouseEvent) {
  if (e.button !== 1) return
  midDrag = null
  window.removeEventListener('mousemove', onMidDragMove)
  window.removeEventListener('mouseup', onMidDragUp)
}

// ── Draw mode ─────────────────────────────────────────────────────────────────

const drawMode = ref(false)
const isDrawing = ref(false)
const draft = reactive({ x: 0, y: 0, width: 0, height: 0, visible: false })

type DragState = {
  type: 'move' | 'resize'
  areaId: string
  handle?: string
  startClientX: number
  startClientY: number
  startArea: { x: number; y: number; width: number; height: number }
}

const dragState = ref<DragState | null>(null)

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

function toPercent(e: MouseEvent): { x: number; y: number } {
  const rect = canvasRef.value!.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * 100,
    y: ((e.clientY - rect.top) / rect.height) * 100,
  }
}

function toDeltaPercent(dx: number, dy: number): { dx: number; dy: number } {
  const rect = canvasRef.value!.getBoundingClientRect()
  return { dx: (dx / rect.width) * 100, dy: (dy / rect.height) * 100 }
}

function onAreaDragStart(areaId: string, e: MouseEvent) {
  if (drawMode.value) return
  const area = canvasStore.areas.find(a => a.id === areaId)
  if (!area) return
  dragState.value = { type: 'move', areaId, startClientX: e.clientX, startClientY: e.clientY, startArea: { x: area.x, y: area.y, width: area.width, height: area.height } }
  startDrag()
}

function onAreaResizeStart(areaId: string, handle: string, e: MouseEvent) {
  const area = canvasStore.areas.find(a => a.id === areaId)
  if (!area) return
  dragState.value = { type: 'resize', areaId, handle, startClientX: e.clientX, startClientY: e.clientY, startArea: { x: area.x, y: area.y, width: area.width, height: area.height } }
  startDrag()
}

function startDrag() {
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function stopDrag() {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
}

function onWindowMouseMove(e: MouseEvent) {
  if (!dragState.value) return
  const { dx, dy } = toDeltaPercent(e.clientX - dragState.value.startClientX, e.clientY - dragState.value.startClientY)
  const { areaId, startArea: sa } = dragState.value

  if (dragState.value.type === 'move') {
    canvasStore.updateArea(areaId, { x: clamp(sa.x + dx, 0, 100 - sa.width), y: clamp(sa.y + dy, 0, 100 - sa.height) })
    return
  }

  const h = dragState.value.handle!
  const MIN = 2
  let { x, y, width, height } = sa

  if (h.includes('e')) width = Math.max(MIN, sa.width + dx)
  if (h.includes('s')) height = Math.max(MIN, sa.height + dy)
  if (h.includes('w')) { const nw = Math.max(MIN, sa.width - dx); x = sa.x + sa.width - nw; width = nw }
  if (h.includes('n')) { const nh = Math.max(MIN, sa.height - dy); y = sa.y + sa.height - nh; height = nh }

  x = clamp(x, 0, 100); y = clamp(y, 0, 100)
  width = Math.min(width, 100 - x); height = Math.min(height, 100 - y)
  canvasStore.updateArea(areaId, { x, y, width, height })
}

function onWindowMouseUp() {
  dragState.value = null
  stopDrag()
  finishDraw()
}

function onMouseDown(e: MouseEvent) {
  if (!drawMode.value || e.target !== canvasRef.value) return
  const { x, y } = toPercent(e)
  Object.assign(draft, { x, y, width: 0, height: 0, visible: true })
  isDrawing.value = true
}

function onMouseMove(e: MouseEvent) {
  if (!isDrawing.value) return
  const { x, y } = toPercent(e)
  draft.width = x - draft.x; draft.height = y - draft.y
}

function onMouseUp() { finishDraw() }

function finishDraw() {
  if (!isDrawing.value) return
  isDrawing.value = false
  draft.visible = false
  if (Math.abs(draft.width) < 2 || Math.abs(draft.height) < 2) return

  const x = draft.width < 0 ? draft.x + draft.width : draft.x
  const y = draft.height < 0 ? draft.y + draft.height : draft.y
  const area = canvasStore.addArea({ name: `Area ${canvasStore.areas.length + 1}`, x, y, width: Math.abs(draft.width), height: Math.abs(draft.height) })
  graphStore.initGraph(area.id)
  canvasStore.selectArea(area.id)
  drawMode.value = false
}

function deselectAll(e: MouseEvent) {
  if (e.target === canvasRef.value) canvasStore.selectArea(null)
}

// ── Layout editor ─────────────────────────────────────────────────────────────

const CONTAINER_NODE_TYPES = new Set(['transient', 'persistent', 'container'])
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
const MIN_LAYOUT_SIZE = 5

const ITEM_LABELS: Record<string, string> = { image: 'Image', text: 'Text', video: 'Video', color: 'Color', gif: 'GIF', container: 'Container' }

// Which area contains the currently selected node?
const layoutAreaId = computed<string | null>(() => {
  const nodeId = uiStore.selectedNodeId
  if (!nodeId) return null
  for (const area of canvasStore.areas) {
    const graph = graphStore.getGraph(area.id)
    if (graph.nodes.some(n => n.id === nodeId)) return area.id
  }
  return null
})

const isLayoutMode = computed(() =>
  !!layoutAreaId.value && CONTAINER_NODE_TYPES.has(uiStore.selectedNodeType ?? '')
)

const containerLayoutMode = computed(() =>
  !!layoutAreaId.value && uiStore.selectedNodeType === 'container'
)

// For container: parent is the container node itself; for lifecycle: parent is the area
const layoutParentId = computed<string | null>(() => {
  if (!isLayoutMode.value) return null
  return containerLayoutMode.value ? uiStore.selectedNodeId : layoutAreaId.value
})

// Read elements from elementsStore keyed by the selected nodeId.
// Array index is the z-order: index 0 = bottom, last = top.
const layoutItems = computed(() => {
  if (!isLayoutMode.value || !uiStore.selectedNodeId || !layoutParentId.value) return []
  const elements = elementsStore.getElements(uiStore.selectedNodeId)
  const parentId = layoutParentId.value
  return elements.map((el, i) => {
    const pos = layoutStore.getLayout(parentId, el.id, el.type)
    return { id: el.id, type: el.type as string, data: el, x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i }
  })
})

// Container node's own position within its area (for sub-container editing)
const containerBounds = computed<ItemLayout | null>(() => {
  if (!containerLayoutMode.value || !layoutAreaId.value || !uiStore.selectedNodeId) return null
  return layoutStore.getLayout(layoutAreaId.value, uiStore.selectedNodeId, 'container')
})

const selectedLayoutItemId = computed({
  get: () => uiStore.selectedLayoutItemId,
  set: (v) => uiStore.selectLayoutItem(v),
})

function setItemZ(itemId: string, z: number) {
  if (!layoutParentId.value) return
  const current = layoutStore.getLayout(layoutParentId.value, itemId)
  layoutStore.setLayout(layoutParentId.value, itemId, { ...current, z })
}

function deselectLayoutItem() {
  uiStore.selectLayoutItem(null)
  if (layoutAreaId.value) canvasStore.selectArea(layoutAreaId.value)
}


interface LayoutDragState {
  elementId: string
  parentId: string
  parentRect: DOMRect
  mode: 'move' | 'resize'
  handle: string
  startX: number
  startY: number
  startLayout: ItemLayout
}

let layoutDrag: LayoutDragState | null = null

function getLayoutParentRect(): DOMRect | null {
  const canvasEl = canvasRef.value
  if (!canvasEl || !layoutAreaId.value) return null
  const area = canvasStore.areas.find(a => a.id === layoutAreaId.value)
  if (!area) return null
  const cr = canvasEl.getBoundingClientRect()
  const areaRect = new DOMRect(
    cr.left + (area.x / 100) * cr.width,
    cr.top + (area.y / 100) * cr.height,
    (area.width / 100) * cr.width,
    (area.height / 100) * cr.height,
  )
  if (!containerLayoutMode.value) return areaRect
  const cb = containerBounds.value
  if (!cb) return null
  return new DOMRect(
    areaRect.left + (cb.x / 100) * areaRect.width,
    areaRect.top + (cb.y / 100) * areaRect.height,
    (cb.w / 100) * areaRect.width,
    (cb.h / 100) * areaRect.height,
  )
}

function startLayoutDrag(e: MouseEvent, elementId: string, handle: string) {
  e.stopPropagation()
  if (!layoutParentId.value) return
  const parentRect = getLayoutParentRect()
  if (!parentRect) return
  if (layoutAreaId.value) canvasStore.selectArea(layoutAreaId.value)
  uiStore.selectLayoutItem(elementId)
  layoutDrag = {
    elementId, parentId: layoutParentId.value, parentRect,
    mode: handle === 'move' ? 'move' : 'resize',
    handle, startX: e.clientX, startY: e.clientY,
    startLayout: { ...layoutStore.getLayout(layoutParentId.value, elementId) },
  }
  window.addEventListener('mousemove', onLayoutMouseMove)
  window.addEventListener('mouseup', onLayoutMouseUp)
}

function onLayoutMouseMove(e: MouseEvent) {
  if (!layoutDrag) return
  const { elementId, parentId, parentRect, mode, handle, startX, startY, startLayout: sl } = layoutDrag
  const dx = ((e.clientX - startX) / parentRect.width) * 100
  const dy = ((e.clientY - startY) / parentRect.height) * 100

  if (mode === 'move') {
    layoutStore.setLayout(parentId, elementId, { x: Math.max(0, Math.min(100 - sl.w, sl.x + dx)), y: Math.max(0, Math.min(100 - sl.h, sl.y + dy)), w: sl.w, h: sl.h, z: sl.z })
    return
  }

  let { x, y, w, h } = sl
  if (handle.includes('e')) w = Math.max(MIN_LAYOUT_SIZE, sl.w + dx)
  if (handle.includes('s')) h = Math.max(MIN_LAYOUT_SIZE, sl.h + dy)
  if (handle.includes('w')) { const nw = Math.max(MIN_LAYOUT_SIZE, sl.w - dx); x = sl.x + sl.w - nw; w = nw }
  if (handle.includes('n')) { const nh = Math.max(MIN_LAYOUT_SIZE, sl.h - dy); y = sl.y + sl.h - nh; h = nh }
  layoutStore.setLayout(parentId, elementId, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), w: Math.min(w, 100 - x), h: Math.min(h, 100 - y), z: sl.z })
}

function onLayoutMouseUp() {
  layoutDrag = null
  window.removeEventListener('mousemove', onLayoutMouseMove)
  window.removeEventListener('mouseup', onLayoutMouseUp)
}

// ── Runtime rendering ─────────────────────────────────────────────────────────

function fadeStyle(areaId: string) {
  const scene = runtimeStore.scenes[areaId]
  if (!scene) return {}
  const duration = scene.phase === 'entering' ? (scene.transitionIn?.duration ?? 0) : scene.phase === 'exiting' ? (scene.transitionOut?.duration ?? 0) : 0
  return { opacity: scene.opacity, transition: duration > 0 ? `opacity ${duration}s ease` : 'none' }
}

function isContentItem(item: RenderItem): item is ContentItem { return item.kind === 'content' }

function modifierStyle(item: ContentItem | ContainerItem) {
  const m = item.modifiers ?? {}
  return {
    ...(m.opacity !== undefined && { opacity: m.opacity }),
    ...(m.filter && { filter: m.filter }),
    ...(m.animationDuration && { animationDuration: m.animationDuration }),
    ...(m.animationDelay && { animationDelay: m.animationDelay }),
    ...(m.animationIterationCount && { animationIterationCount: m.animationIterationCount }),
  }
}

function modifierClass(item: ContentItem | ContainerItem) { return item.modifiers?.animationClass ?? '' }

const WEB_SAFE_FONTS = new Set(['sans-serif','serif','monospace','cursive','fantasy','Arial','Verdana','Tahoma','Trebuchet MS','Georgia','Times New Roman','Courier New','Impact','Comic Sans MS'])

function loadGoogleFont(family: string) {
  if (!family || WEB_SAFE_FONTS.has(family)) return
  const id = `gfont-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100;200;300;400;500;600;700;800;900&display=swap`
  document.head.appendChild(link)
}

function textStyle(data: Record<string, unknown>) {
  loadGoogleFont(data.fontFamily as string)
  return {
    ...(data.fontSize   ? { fontSize:   `${data.fontSize}px` } : {}),
    ...(data.fontFamily ? { fontFamily:  data.fontFamily as string } : {}),
    ...(data.fontWeight ? { fontWeight:  String(data.fontWeight) } : {}),
    ...(data.color      ? { color:       data.color as string } : {}),
  }
}

function layoutTextStyle(el: ElementData) {
  loadGoogleFont(el.fontFamily)
  return { fontSize: `${el.fontSize}px`, fontFamily: el.fontFamily, fontWeight: String(el.fontWeight), color: el.textColor }
}

function elementEffectStyle(el: ElementData) {
  const fx = el.effects
  const s: Record<string, string | number> = {}
  if (fx?.opacity < 1) s.opacity = fx.opacity
  if (fx?.shadow?.enabled) {
    const { x, y, blur, color, opacity: op } = fx.shadow
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    s.filter = `drop-shadow(${x}px ${y}px ${blur}px rgba(${r},${g},${b},${op}))`
  }
  if (fx?.animation?.enabled) {
    s.animationDuration = `${fx.animation.duration}s`
    if (fx.animation.delay) s.animationDelay = `${fx.animation.delay}s`
    s.animationIterationCount = fx.animation.repeat === 0 ? 'infinite' : String(fx.animation.repeat)
  }
  return s
}

function elementEffectClass(el: ElementData) {
  const anim = el.effects?.animation
  if (!anim?.enabled) return ''
  return `animate__animated animate__${anim.name}`
}

// ── Element type drag-onto-canvas ─────────────────────────────────────────────

const ELEMENT_TYPE_ICONS: Record<string, string> = {
  image: 'image', text: 'type', video: 'video', color: 'palette', gif: 'film',
}
const ELEMENT_TYPE_LABELS: Record<string, string> = {
  image: 'Image', text: 'Text', video: 'Video', color: 'Color', gif: 'GIF',
}

const isElementTypeDragOver = ref(false)
const dragGhostPos = ref<{ x: number; y: number } | null>(null)

function onElementTypeDragOver(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('application/alchemy-element-type')) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
  isElementTypeDragOver.value = true

  const parentRect = getLayoutParentRect()
  if (parentRect) {
    dragGhostPos.value = {
      x: Math.max(0, Math.min(50, ((e.clientX - parentRect.left) / parentRect.width) * 100 - 25)),
      y: Math.max(0, Math.min(50, ((e.clientY - parentRect.top) / parentRect.height) * 100 - 25)),
    }
  }
}

function onElementTypeDragLeave(e: DragEvent) {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
  isElementTypeDragOver.value = false
  dragGhostPos.value = null
}

function onElementTypeDrop(e: DragEvent) {
  isElementTypeDragOver.value = false
  dragGhostPos.value = null
  const type = e.dataTransfer?.getData('application/alchemy-element-type') as ElementType | undefined
  if (!type || !uiStore.selectedNodeId || !layoutParentId.value) return
  const parentRect = getLayoutParentRect()
  if (!parentRect) return

  const x = Math.max(0, Math.min(50, ((e.clientX - parentRect.left) / parentRect.width) * 100 - 25))
  const y = Math.max(0, Math.min(50, ((e.clientY - parentRect.top) / parentRect.height) * 100 - 25))

  const el = elementsStore.addElement(uiStore.selectedNodeId, type)
  const z = elementsStore.getElements(uiStore.selectedNodeId).length - 1
  layoutStore.setLayout(layoutParentId.value, el.id, { x, y, w: 50, h: 50, z })
  uiStore.selectLayoutItem(el.id)
}

// ── Test fire ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'donation',     label: 'Donation' },
  { value: 'follow',       label: 'Follow' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'bits',         label: 'Bits' },
  { value: 'superchat',    label: 'Super Chat' },
  { value: 'raid',         label: 'Raid' },
  { value: 'merch',        label: 'Merch' },
]

const selectedEvent = ref('donation')
function fire() { runtimeStore.fireEvent(selectedEvent.value) }
</script>

<template>
  <div class="canvas-wrap">
    <div class="toolbar">
      <button class="tool-btn" :class="{ active: !drawMode }" title="Select (V)" @click="drawMode = false">
        <component :is="ICONS['mouse-pointer-2']" :size="14" />
      </button>
      <button class="tool-btn" :class="{ active: drawMode }" title="Draw Area (A)" @click="drawMode = true">
        <component :is="ICONS['square']" :size="14" />
      </button>
      <div class="toolbar-sep" />
      <span class="toolbar-hint">{{ drawMode ? 'Click and drag to draw an area' : 'Click an area to select it' }}</span>
      <div class="toolbar-spacer" />
      <button class="zoom-label" title="Reset view" @click="resetView">{{ zoomLabel }}</button>
      <div class="toolbar-sep" />
      <select v-model="selectedEvent" class="event-select">
        <option v-for="e in EVENT_TYPES" :key="e.value" :value="e.value">{{ e.label }}</option>
      </select>
      <button class="fire-btn" @click="fire">Fire</button>
      <button class="reset-btn" @click="runtimeStore.resetSession()">Reset</button>
    </div>

    <div ref="outerRef" class="canvas-outer" @wheel.prevent="onWheel" @mousedown="onOuterMouseDown">
      <div
        ref="canvasRef"
        class="canvas"
        :class="{ 'draw-mode': drawMode }"
        :style="{ transform: `translate(${tx}px, ${ty}px) scale(${totalScale})`, '--grid': gridCell + 'px' }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @click="deselectAll"
      >
        <div class="canvas-grid" />

        <!-- Runtime scene layers — rendered behind area controls -->
        <div
          v-for="area in canvasStore.areas"
          :key="'scene-' + area.id"
          class="scene-wrapper"
          :style="{ left: area.x + '%', top: area.y + '%', width: area.width + '%', height: area.height + '%' }"
        >
          <div
            v-if="runtimeStore.scenes[area.id] && !(isLayoutMode && area.id === layoutAreaId)"
            class="scene-layer"
            :style="fadeStyle(area.id)"
          >
            <template v-for="item in runtimeStore.scenes[area.id].items" :key="item.id">
              <!-- Container item -->
              <div
                v-if="!isContentItem(item)"
                class="content-item"
                :class="modifierClass(item)"
                :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, zIndex: item.zIndex, ...modifierStyle(item) }"
              >
                <div
                  v-for="child in (item as ContainerItem).children"
                  :key="child.id"
                  class="content-item"
                  :class="modifierClass(child)"
                  :style="{ left: `${child.x}%`, top: `${child.y}%`, width: `${child.w}%`, height: `${child.h}%`, zIndex: child.zIndex, ...modifierStyle(child) }"
                >
                  <img v-if="child.type === 'image' || child.type === 'gif'" :src="child.data.src as string" class="fill" />
                  <video v-else-if="child.type === 'video'" :src="child.data.src as string" class="fill" :autoplay="child.data.autoplay as boolean" :loop="child.data.loop as boolean" :muted="child.data.muted as boolean" />
                  <div v-else-if="child.type === 'text'" class="text-content fill" :style="textStyle(child.data)">{{ child.data.content }}</div>
                  <div v-else-if="child.type === 'color'" class="fill" :style="{ backgroundColor: child.data.color as string }" />
                </div>
              </div>
              <!-- Direct content item -->
              <div
                v-else
                class="content-item"
                :class="modifierClass(item as ContentItem)"
                :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, zIndex: item.zIndex, ...modifierStyle(item as ContentItem) }"
              >
                <img v-if="item.type === 'image' || item.type === 'gif'" :src="(item as ContentItem).data.src as string" class="fill" />
                <video v-else-if="item.type === 'video'" :src="(item as ContentItem).data.src as string" class="fill" :autoplay="(item as ContentItem).data.autoplay as boolean" :loop="(item as ContentItem).data.loop as boolean" :muted="(item as ContentItem).data.muted as boolean" />
                <div v-else-if="item.type === 'text'" class="text-content fill" :style="textStyle((item as ContentItem).data)">{{ (item as ContentItem).data.content }}</div>
                <div v-else-if="item.type === 'color'" class="fill" :style="{ backgroundColor: (item as ContentItem).data.color as string }" />
              </div>
            </template>
          </div>
        </div>

        <!-- Area rectangles -->
        <AreaItem
          v-for="area in canvasStore.areas"
          :key="area.id"
          :area="area"
          :selected="canvasStore.selectedAreaId === area.id"
          :draw-mode="drawMode"
          :canvas-scale="totalScale"
          @select="canvasStore.selectArea(area.id)"
          @rename="(name) => canvasStore.updateArea(area.id, { name })"
          @remove="canvasStore.removeArea(area.id)"
          @drag-start="(e) => onAreaDragStart(area.id, e)"
          @resize-start="(handle, e) => onAreaResizeStart(area.id, handle, e)"
        />

        <!-- Draft rectangle -->
        <div
          v-if="draft.visible"
          class="draft"
          :style="{ left: `${Math.min(draft.x, draft.x + draft.width)}%`, top: `${Math.min(draft.y, draft.y + draft.height)}%`, width: `${Math.abs(draft.width)}%`, height: `${Math.abs(draft.height)}%` }"
        />

        <!-- Layout editor overlay -->
        <template v-if="isLayoutMode && layoutAreaId">
          <div
            v-for="area in canvasStore.areas.filter(a => a.id === layoutAreaId)"
            :key="'layout-' + area.id"
            class="layout-area"
            :style="{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%` }"
          >
            <!-- Lifecycle-level: elements relative to area -->
            <template v-if="!containerLayoutMode">
              <div
                class="layout-overlay"
                :class="{ 'drop-target': isElementTypeDragOver }"
                @mousedown="deselectLayoutItem"
                @dragover="onElementTypeDragOver"
                @dragleave="onElementTypeDragLeave"
                @drop.prevent="onElementTypeDrop"
              >
                <div v-if="!layoutItems.length" class="drop-empty-state" :class="{ active: isElementTypeDragOver }">
                  <component :is="ICONS['plus']" :size="14" />
                  <span>Drag an element here</span>
                </div>
              </div>
              <div class="items-content-layer">
                <div
                  v-for="item in layoutItems" :key="'c-' + item.id"
                  class="item-content"
                  :class="elementEffectClass(item.data as ElementData)"
                  :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, zIndex: item.z + 1, ...elementEffectStyle(item.data as ElementData) }"
                  @mousedown="startLayoutDrag($event, item.id, 'move')"
                  @mouseenter="uiStore.hoverLayoutItem(item.id)"
                  @mouseleave="uiStore.hoverLayoutItem(null)"
                >
                  <img v-if="(item.type === 'image' || item.type === 'gif') && (item.data as ElementData).src" :src="(item.data as ElementData).src" class="fill" draggable="false" />
                  <div v-else-if="item.type === 'video' && (item.data as ElementData).src" class="item-placeholder fill">▶ Video</div>
                  <div v-else-if="item.type === 'text'" class="text-content fill" :style="layoutTextStyle(item.data as ElementData)">{{ (item.data as ElementData).content }}</div>
                  <div v-else-if="item.type === 'color'" class="fill" :style="{ backgroundColor: (item.data as ElementData).fillColor }" />
                  <div v-else class="item-placeholder fill">{{ ITEM_LABELS[item.type] ?? item.type }}</div>
                </div>
              </div>
              <div class="items-border-layer">
                <div
                  v-for="item in layoutItems" :key="'b-' + item.id"
                  class="item-frame"
                  :class="{ active: selectedLayoutItemId === item.id, hovered: uiStore.hoveredLayoutItemId === item.id && selectedLayoutItemId !== item.id }"
                  :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }"
                >
                  <div class="border-edge border-top" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                  <div class="border-edge border-right" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                  <div class="border-edge border-bottom" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                  <div class="border-edge border-left" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                  <div class="item-label" @mousedown.stop="startLayoutDrag($event, item.id, 'move')">
                    {{ ITEM_LABELS[item.type] ?? item.type }}
                  </div>
                  <template v-if="selectedLayoutItemId === item.id">
                    <div v-for="h in HANDLES" :key="h" :class="`resize-handle handle-${h}`" @mousedown.stop="startLayoutDrag($event, item.id, h)" />
                  </template>
                </div>
              </div>
              <!-- Ghost preview while dragging an element type onto the canvas -->
              <div
                v-if="dragGhostPos && uiStore.draggingElementType"
                class="element-ghost"
                :style="{ left: dragGhostPos.x + '%', top: dragGhostPos.y + '%' }"
              >
                <component :is="ICONS[ELEMENT_TYPE_ICONS[uiStore.draggingElementType]]" :size="14" />
                <span>{{ ELEMENT_TYPE_LABELS[uiStore.draggingElementType] }}</span>
              </div>
            </template>

            <!-- Container-level: elements within container bounds -->
            <template v-else-if="containerLayoutMode && containerBounds">
              <div
                class="container-frame"
                :style="{ left: `${containerBounds.x}%`, top: `${containerBounds.y}%`, width: `${containerBounds.w}%`, height: `${containerBounds.h}%` }"
              >
                <div
                  class="layout-overlay"
                  :class="{ 'drop-target': isElementTypeDragOver }"
                  @mousedown="deselectLayoutItem"
                  @dragover="onElementTypeDragOver"
                  @dragleave="onElementTypeDragLeave"
                  @drop.prevent="onElementTypeDrop"
                >
                  <div v-if="!layoutItems.length" class="drop-empty-state" :class="{ active: isElementTypeDragOver }">
                    <component :is="ICONS['plus']" :size="14" />
                    <span>Drag an element here</span>
                  </div>
                </div>
                <div class="items-content-layer">
                  <div
                    v-for="item in layoutItems" :key="'c-' + item.id"
                    class="item-content"
                    :class="elementEffectClass(item.data as ElementData)"
                    :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%`, zIndex: item.z + 1, ...elementEffectStyle(item.data as ElementData) }"
                    @mousedown="startLayoutDrag($event, item.id, 'move')"
                    @mouseenter="uiStore.hoverLayoutItem(item.id)"
                    @mouseleave="uiStore.hoverLayoutItem(null)"
                  >
                    <img v-if="(item.type === 'image' || item.type === 'gif') && (item.data as ElementData).src" :src="(item.data as ElementData).src" class="fill" draggable="false" />
                    <div v-else-if="item.type === 'text'" class="text-content fill" :style="layoutTextStyle(item.data as ElementData)">{{ (item.data as ElementData).content }}</div>
                    <div v-else-if="item.type === 'color'" class="fill" :style="{ backgroundColor: (item.data as ElementData).fillColor }" />
                    <div v-else class="item-placeholder fill">{{ ITEM_LABELS[item.type] ?? item.type }}</div>
                  </div>
                </div>
                <div class="items-border-layer">
                  <div
                    v-for="item in layoutItems" :key="'b-' + item.id"
                    class="item-frame"
                    :class="{ active: selectedLayoutItemId === item.id, hovered: uiStore.hoveredLayoutItemId === item.id && selectedLayoutItemId !== item.id }"
                    :style="{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }"
                  >
                    <div class="border-edge border-top" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                    <div class="border-edge border-right" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                    <div class="border-edge border-bottom" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                    <div class="border-edge border-left" @mousedown.stop="startLayoutDrag($event, item.id, 'move')" />
                    <div class="item-label" @mousedown.stop="startLayoutDrag($event, item.id, 'move')">
                      {{ ITEM_LABELS[item.type] ?? item.type }}
                      <select v-if="selectedLayoutItemId === item.id" :value="item.z" class="z-select" @change="setItemZ(item.id, +($event.target as HTMLSelectElement).value)" @mousedown.stop>
                        <option v-for="n in 10" :key="n - 1" :value="n - 1">Layer {{ n - 1 }}</option>
                      </select>
                    </div>
                    <template v-if="selectedLayoutItemId === item.id">
                      <div v-for="h in HANDLES" :key="h" :class="`resize-handle handle-${h}`" @mousedown.stop="startLayoutDrag($event, item.id, h)" />
                    </template>
                  </div>
                </div>
                <!-- Ghost preview while dragging an element type onto the canvas -->
                <div
                  v-if="dragGhostPos && uiStore.draggingElementType"
                  class="element-ghost"
                  :style="{ left: dragGhostPos.x + '%', top: dragGhostPos.y + '%' }"
                >
                  <component :is="ICONS[ELEMENT_TYPE_ICONS[uiStore.draggingElementType]]" :size="14" />
                  <span>{{ ELEMENT_TYPE_LABELS[uiStore.draggingElementType] }}</span>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Empty state guide — positioned over canvas-outer so it isn't scaled -->
      <div v-if="!canvasStore.areas.length" class="canvas-empty-state">
        <div class="empty-steps">
          <div class="empty-step" :class="{ highlight: drawMode }">
            <span class="step-number">1</span>
            <div class="step-content">
              <span class="step-title">Draw an area</span>
              <span class="step-desc">Click the <strong>□</strong> tool above, then click &amp; drag on the canvas to create an overlay region</span>
            </div>
          </div>
          <div class="empty-step">
            <span class="step-number">2</span>
            <div class="step-content">
              <span class="step-title">Build a node graph</span>
              <span class="step-desc">Drag nodes from the palette into the graph panel below to define triggers, transitions, and content</span>
            </div>
          </div>
          <div class="empty-step">
            <span class="step-number">3</span>
            <div class="step-content">
              <span class="step-title">Add elements</span>
              <span class="step-desc">Select a container node, then add images, text, video, or colors to design your overlay</span>
            </div>
          </div>
          <div class="empty-step">
            <span class="step-number">4</span>
            <div class="step-content">
              <span class="step-title">Export</span>
              <span class="step-desc">Export as a self-contained widget and paste it into Streamlabs as a Custom Widget source</span>
            </div>
          </div>
        </div>
        <div class="empty-or">or</div>
        <button class="empty-open-btn" @click.stop="$emit('open-scene')">Open an existing .alchemy file</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--surface-2);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--surface-2);
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}

.tool-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease;
}
.tool-btn:hover { border-color: var(--text-faint); color: var(--text); }
.tool-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

.toolbar-sep { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }
.toolbar-spacer { flex: 1; }
.toolbar-hint { font-size: 13px; color: var(--text-muted); }

.event-select {
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 3px 6px;
  outline: none;
}

.fire-btn {
  background: var(--cat-trigger);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--on-accent);
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  cursor: pointer;
}
.fire-btn:hover { background: #ffd09a; }

.reset-btn {
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  cursor: pointer;
}
.reset-btn:hover { background: var(--surface-3); color: var(--text); }

.zoom-label {
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  min-width: 38px;
  text-align: center;
}
.zoom-label:hover { background: var(--surface-3); color: var(--text); }

.canvas-outer {
  flex: 1;
  min-height: 0;
  position: relative;
  background: var(--bg);
  overflow: hidden;
  cursor: default;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  transform-origin: 0 0;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 0 0 1px var(--border-strong);
  background: #000;
}
.canvas.draw-mode { cursor: crosshair; }

.canvas-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, var(--text-faint) 1px, transparent 1px);
  background-size: var(--grid, 24px) var(--grid, 24px);
  pointer-events: none;
}

.canvas-empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  pointer-events: none;
  z-index: 10;
}

.empty-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
}

.empty-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.4);
  transition: border-color 0.2s, background 0.2s;
}
.empty-step.highlight {
  border-color: var(--accent-tint-md);
  background: var(--accent-dim);
}

.step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.step-desc {
  font-size: 12px;
  color: var(--text-faint);
  line-height: 1.4;
}
.step-desc strong {
  color: var(--accent);
  font-weight: 600;
}

.empty-or {
  color: var(--text-faint);
  font-size: 12px;
}

.empty-open-btn {
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 6px 16px;
  cursor: pointer;
  pointer-events: all;
  transition: all 120ms ease;
}
.empty-open-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

.scene-wrapper {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  z-index: 50;
}

.scene-layer {
  position: absolute;
  inset: 0;
}

.content-item {
  position: absolute;
  overflow: hidden;
}

.draft {
  position: absolute;
  border: 2px dashed var(--accent);
  background: var(--accent-dim);
  pointer-events: none;
}

/* ── Layout editor ── */

.layout-area {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}

.layout-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 0;
  pointer-events: all;
  transition: background 120ms ease;
}
.layout-overlay.drop-target {
  background: var(--accent-dim);
  outline: 2px dashed var(--accent);
  outline-offset: -2px;
}

.drop-empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.18);
  pointer-events: none;
  font-size: 11px;
  letter-spacing: 0.3px;
  transition: color 120ms ease;
}
.drop-empty-state i { font-size: 22px; }
.drop-empty-state.active {
  color: var(--accent);
}

.element-ghost {
  position: absolute;
  width: 50%;
  height: 50%;
  border: 2px dashed var(--accent);
  background: var(--accent-dim);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  z-index: 10;
  color: var(--accent);
  font-size: 11px;
}
.element-ghost i { font-size: 20px; }

.items-content-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.item-content {
  position: absolute;
  cursor: move;
  user-select: none;
  overflow: hidden;
  pointer-events: all;
}

.items-border-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.item-frame {
  position: absolute;
  pointer-events: none;
}

.border-edge {
  position: absolute;
  background: rgba(182, 138, 229, 0.3);
  pointer-events: all;
  cursor: move;
  transition: background 120ms ease;
}
.item-frame:hover .border-edge,
.item-frame.active .border-edge { background: var(--cat-lifecycle); }
.item-frame.hovered .border-edge { background: rgba(182, 138, 229, 0.5); }

.border-top    { top: 0;    left: 0;  right: 0;   height: 2px; }
.border-right  { top: 0;    right: 0; bottom: 0;  width: 2px; }
.border-bottom { bottom: 0; left: 0;  right: 0;   height: 2px; }
.border-left   { top: 0;    left: 0;  bottom: 0;  width: 2px; }

.item-label {
  position: absolute;
  top: 2px; left: 2px;
  background: rgba(182, 138, 229, 0.7);
  color: var(--on-accent);
  font-size: 9px; font-weight: 700;
  padding: 2px 5px;
  letter-spacing: 0.4px;
  border-radius: 2px;
  pointer-events: all;
  cursor: move;
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap;
  user-select: none;
}
.item-frame.active .item-label { background: var(--cat-lifecycle); }

.z-select {
  background: var(--surface-2);
  border: 1px solid var(--text-faint);
  border-radius: 3px;
  color: var(--text);
  font-size: 9px;
  padding: 1px 2px;
  cursor: pointer;
}

.item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
  font-size: 11px;
}

.fill {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.text-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2em;
  font-weight: 600;
  text-shadow: 0 1px 4px #000a;
  padding: 4px;
  text-align: center;
}

.resize-handle {
  position: absolute;
  width: 8px; height: 8px;
  background: var(--text);
  border: 1.5px solid var(--cat-lifecycle);
  border-radius: 2px;
  pointer-events: all;
}

.handle-nw { top: 0;    left: 0;   transform: translate(-50%,-50%); cursor: nwse-resize; }
.handle-n  { top: 0;    left: 50%; transform: translate(-50%,-50%); cursor: ns-resize;   }
.handle-ne { top: 0;    right: 0;  transform: translate(50%,-50%);  cursor: nesw-resize; }
.handle-e  { top: 50%;  right: 0;  transform: translate(50%,-50%);  cursor: ew-resize;   }
.handle-se { bottom: 0; right: 0;  transform: translate(50%,50%);   cursor: nwse-resize; }
.handle-s  { bottom: 0; left: 50%; transform: translate(-50%,50%);  cursor: ns-resize;   }
.handle-sw { bottom: 0; left: 0;   transform: translate(-50%,50%);  cursor: nesw-resize; }
.handle-w  { top: 50%;  left: 0;   transform: translate(-50%,-50%); cursor: ew-resize;   }

.container-frame {
  position: absolute;
  outline: 1px dashed var(--cat-transition);
  overflow: hidden;
}
</style>
