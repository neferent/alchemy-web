<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGraphStore } from '@/stores/graph'
import { useElementsStore } from '@/stores/elements'
import { useLayoutStore } from '@/stores/layout'
import { useUiStore } from '@/stores/ui'
import type { ElementData, ElementType } from '@/types'
import { sanitizeUrl } from '@/utils/sanitize'
import SearchSelect from './SearchSelect.vue'
import GifPicker from './GifPicker.vue'
import ClipPicker from './ClipPicker.vue'
import StickerPicker from './StickerPicker.vue'
import { ICONS } from '@/utils/icons'

const POPULAR_FONTS = [
  'Arial','Verdana','Tahoma','Trebuchet MS','Georgia','Times New Roman','Courier New','Impact',
  'Roboto','Open Sans','Lato','Montserrat','Oswald','Raleway','Poppins','Merriweather',
  'Playfair Display','Ubuntu','Nunito','Inter','Bebas Neue','Pacifico','Lobster',
  'Dancing Script','Comfortaa','Righteous','Permanent Marker','Bangers','Press Start 2P',
]

const CONTAINER_TYPES = new Set(['transient', 'persistent', 'container'])

const canvasStore = useCanvasStore()
const graphStore = useGraphStore()
const elementsStore = useElementsStore()
const layoutStore = useLayoutStore()
const uiStore = useUiStore()

const selectedNodeId = computed(() => uiStore.selectedNodeId)
const selectedNodeType = computed(() => uiStore.selectedNodeType)

const isActive = computed(() =>
  !!selectedNodeId.value && CONTAINER_TYPES.has(selectedNodeType.value ?? '')
)

const nodeLabel = computed(() => {
  if (!selectedNodeType.value) return ''
  if (selectedNodeType.value === 'transient') return 'Transient Container'
  if (selectedNodeType.value === 'persistent') return 'Persistent Container'
  if (selectedNodeType.value === 'container') return 'Container'
  return selectedNodeType.value
})

const elements = computed<ElementData[]>(() => {
  if (!selectedNodeId.value) return []
  return elementsStore.getElements(selectedNodeId.value)
})

const selectedElementId = computed({
  get: () => uiStore.selectedLayoutItemId,
  set: (v) => uiStore.selectLayoutItem(v),
})

const selectedElement = computed<ElementData | null>(() =>
  elements.value.find(e => e.id === selectedElementId.value) ?? null
)

function addElement(type: ElementType) {
  if (!selectedNodeId.value) return
  const el = elementsStore.addElement(selectedNodeId.value, type)
  // Default layout: centred 50×50% within the parent
  const parentId = selectedNodeType.value === 'container'
    ? selectedNodeId.value
    : (canvasStore.selectedAreaId ?? selectedNodeId.value)
  layoutStore.setLayout(parentId, el.id, { x: 25, y: 25, w: 50, h: 50, z: elements.value.length - 1 })
  uiStore.selectLayoutItem(el.id)
}

function removeElement(id: string) {
  if (!selectedNodeId.value) return
  elementsStore.removeElement(selectedNodeId.value, id)
  if (selectedElementId.value === id) uiStore.selectLayoutItem(null)
}

function selectElement(id: string) {
  uiStore.selectLayoutItem(id)
}

// ── Watched patches for inline editing ──────────────────────────────────────

function patch(field: keyof ElementData, value: unknown) {
  if (!selectedNodeId.value || !selectedElementId.value) return
  elementsStore.updateElement(selectedNodeId.value, selectedElementId.value, { [field]: value } as Partial<ElementData>)
}

function patchSrc(raw: string) {
  patch('src', sanitizeUrl(raw))
}

// Font loading for text preview
const WEB_SAFE = new Set(['sans-serif','serif','monospace','cursive','fantasy','Arial','Verdana','Tahoma','Trebuchet MS','Georgia','Times New Roman','Courier New','Impact','Comic Sans MS'])

function loadFont(family: string) {
  if (!family || WEB_SAFE.has(family)) return
  const id = `gfont-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100;300;400;600;700;900&display=swap`
  document.head.appendChild(link)
}

watch(() => selectedElement.value?.fontFamily, (f) => { if (f) loadFont(f) }, { immediate: true })

const TYPE_ICONS: Record<ElementType, string> = {
  image:   'image',
  text:    'type',
  video:   'video',
  color:   'palette',
  gif:     'film',
  clip:    'clapperboard',
  sticker: 'sticker',
}

const TYPE_LABELS: Record<ElementType, string> = {
  image:   'Image',
  text:    'Text',
  video:   'Video',
  color:   'Color',
  gif:     'GIF',
  clip:    'Clip',
  sticker: 'Sticker',
}

// Section collapse state
const elementsOpen = ref(true)
const layersOpen = ref(true)
const contentOpen = ref(true)
const fxOpen = ref(false)
watch(selectedElementId, () => { contentOpen.value = true; fxOpen.value = false })

// Drag-to-reorder state (indices into the reversed display list)
const dragFromDisplay = ref<number | null>(null)
const dragOverDisplay = ref<number | null>(null)

// Elements displayed top→bottom = highest z → lowest z (reversed from store order)
const displayedElements = computed(() => [...elements.value].reverse())

function displayToActual(displayIdx: number) {
  return elements.value.length - 1 - displayIdx
}

function onLayerDragStart(displayIdx: number) {
  dragFromDisplay.value = displayIdx
}

function onLayerDragOver(e: DragEvent, displayIdx: number) {
  e.preventDefault()
  dragOverDisplay.value = displayIdx
}

function onLayerDrop(displayIdx: number) {
  if (dragFromDisplay.value === null || !selectedNodeId.value) return
  elementsStore.reorderElements(
    selectedNodeId.value,
    displayToActual(dragFromDisplay.value),
    displayToActual(displayIdx),
  )
  dragFromDisplay.value = null
  dragOverDisplay.value = null
}

function onLayerDragEnd() {
  dragFromDisplay.value = null
  dragOverDisplay.value = null
}

const ADD_KEY_MAP: Record<string, ElementType> = { i: 'image', t: 'text', v: 'video', c: 'color', g: 'gif', l: 'clip', s: 'sticker' }

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!selectedElementId.value || !selectedNodeId.value) return
    e.preventDefault()
    removeElement(selectedElementId.value)
    return
  }

  const type = ADD_KEY_MAP[e.key.toLowerCase()]
  if (type && isActive.value && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault()
    addElement(type)
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

function patchFx(field: string, value: unknown) {
  if (!selectedElement.value) return
  patch('effects', { ...selectedElement.value.effects, [field]: value })
}

function patchShadow(field: string, value: unknown) {
  if (!selectedElement.value) return
  const shadow = { ...selectedElement.value.effects.shadow, [field]: value }
  patch('effects', { ...selectedElement.value.effects, shadow })
}

function patchAnim(field: string, value: unknown) {
  if (!selectedElement.value) return
  const animation = { ...selectedElement.value.effects.animation, [field]: value }
  patch('effects', { ...selectedElement.value.effects, animation })
}

const ANIMATIONS = [
  'bounce','flash','pulse','rubberBand','shakeX','shakeY','tada','wobble','heartBeat',
  'backInDown','backInLeft','backInRight','backInUp',
  'bounceIn','bounceInDown','bounceInLeft','bounceInRight','bounceInUp',
  'fadeIn','fadeInDown','fadeInLeft','fadeInRight','fadeInUp',
  'flipInX','flipInY','rotateIn','zoomIn','zoomInDown','zoomInLeft','zoomInRight',
  'bounceOut','bounceOutDown','bounceOutLeft','bounceOutRight','bounceOutUp',
  'fadeOut','fadeOutDown','fadeOutLeft','fadeOutRight','fadeOutUp',
  'rotateOut','zoomOut','zoomOutDown','zoomOutLeft','zoomOutRight',
]
</script>

<template>
  <div class="elements-panel">
    <div class="panel-header">
      <span class="panel-title">Elements</span>
      <span v-if="isActive" class="node-badge">{{ nodeLabel }}</span>
    </div>

    <template v-if="isActive">
      <!-- ── Elements section ── -->
      <div class="section-header" @click="elementsOpen = !elementsOpen">
        <span class="section-chevron" :class="{ collapsed: !elementsOpen }">▾</span>
        <span class="section-title">Elements</span>
      </div>
      <template v-if="elementsOpen">
        <div class="add-section">
          <div class="add-section-label">Media <span class="add-section-tag">KLIPY</span></div>
          <div class="add-row">
            <button
              v-for="type in (['gif', 'clip', 'sticker'] as ElementType[])"
              :key="type"
              class="add-btn add-btn--media"
              :title="'Drag onto canvas or click to add ' + TYPE_LABELS[type]"
              draggable="true"
              @dragstart="(e) => { e.dataTransfer!.setData('application/alchemy-element-type', type); e.dataTransfer!.effectAllowed = 'copy'; uiStore.setDraggingElementType(type) }"
              @dragend="uiStore.setDraggingElementType(null)"
              @click="addElement(type)"
            >
              <component :is="ICONS[TYPE_ICONS[type]]" :size="14" />
              <span>{{ TYPE_LABELS[type] }}</span>
            </button>
          </div>
        </div>
        <div class="add-section">
          <div class="add-section-label">Custom</div>
          <div class="add-row">
            <button
              v-for="type in (['image', 'video', 'text', 'color'] as ElementType[])"
              :key="type"
              class="add-btn"
              :title="'Drag onto canvas or click to add ' + TYPE_LABELS[type]"
              draggable="true"
              @dragstart="(e) => { e.dataTransfer!.setData('application/alchemy-element-type', type); e.dataTransfer!.effectAllowed = 'copy'; uiStore.setDraggingElementType(type) }"
              @dragend="uiStore.setDraggingElementType(null)"
              @click="addElement(type)"
            >
              <component :is="ICONS[TYPE_ICONS[type]]" :size="14" />
              <span>{{ TYPE_LABELS[type] }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- ── Layers section ── -->
      <div class="section-header" @click="layersOpen = !layersOpen">
        <span class="section-chevron" :class="{ collapsed: !layersOpen }">▾</span>
        <span class="section-title">Layers</span>
        <span class="section-count">{{ elements.length }}</span>
      </div>
      <template v-if="layersOpen">
        <div v-if="displayedElements.length" class="element-list">
          <div
            v-for="(el, displayIdx) in displayedElements"
            :key="el.id"
            class="element-row"
            :class="{
              active: selectedElementId === el.id,
              hovered: uiStore.hoveredLayoutItemId === el.id && selectedElementId !== el.id,
              'drag-over': dragOverDisplay === displayIdx && dragFromDisplay !== displayIdx,
            }"
            draggable="true"
            @click="selectElement(el.id)"
            @mouseenter="uiStore.hoverLayoutItem(el.id)"
            @mouseleave="uiStore.hoverLayoutItem(null)"
            @dragstart="onLayerDragStart(displayIdx)"
            @dragover="onLayerDragOver($event, displayIdx)"
            @drop.prevent="onLayerDrop(displayIdx)"
            @dragend="onLayerDragEnd"
          >
            <component :is="ICONS['grip-horizontal']" :size="12" class="drag-grip" title="Drag to reorder" />
            <component :is="ICONS[TYPE_ICONS[el.type]]" :size="14" class="el-icon" />
            <span class="el-label">{{ TYPE_LABELS[el.type] }}</span>
            <button class="el-delete" title="Remove" @click.stop="removeElement(el.id)">✕</button>
          </div>
        </div>
        <div v-else class="empty-list">No elements — add one above</div>
      </template>

      <!-- ── Content section (selected element) ── -->
      <template v-if="selectedElement">
        <div class="section-header" @click="contentOpen = !contentOpen">
          <span class="section-chevron" :class="{ collapsed: !contentOpen }">▾</span>
          <span class="section-title">Content</span>
          <span class="section-count">{{ TYPE_LABELS[selectedElement.type] }}</span>
        </div>
        <template v-if="contentOpen">

        <!-- Image -->
        <template v-if="selectedElement.type === 'image'">
          <div class="prop-group">
            <label class="prop-label">Source URL / Path</label>
            <input
              :value="selectedElement.src"
              type="text"
              class="prop-input"
              placeholder="https://... or /path/to/img"
              @input="patchSrc(($event.target as HTMLInputElement).value)"
            />
            <div v-if="selectedElement.src" class="img-preview">
              <img :src="selectedElement.src" alt="" />
            </div>
          </div>
        </template>

        <!-- GIF -->
        <template v-else-if="selectedElement.type === 'gif'">
          <div class="prop-group">
            <div v-if="selectedElement.src" class="media-preview">
              <img :src="selectedElement.src" alt="" />
            </div>
            <GifPicker @select="(url) => patchSrc(url)" />
          </div>
        </template>

        <!-- Clip -->
        <template v-else-if="selectedElement.type === 'clip'">
          <div class="prop-group">
            <div v-if="selectedElement.src" class="media-preview">
              <img :src="selectedElement.src" alt="" />
            </div>
            <ClipPicker @select="(url) => patchSrc(url)" />
          </div>
        </template>

        <!-- Sticker -->
        <template v-else-if="selectedElement.type === 'sticker'">
          <div class="prop-group">
            <div v-if="selectedElement.src" class="media-preview">
              <img :src="selectedElement.src" alt="" />
            </div>
            <StickerPicker @select="(url) => patchSrc(url)" />
          </div>
        </template>

        <!-- Text -->
        <template v-else-if="selectedElement.type === 'text'">
          <div class="prop-group">
            <label class="prop-label">Content (use {$var})</label>
            <textarea
              :value="selectedElement.content"
              class="prop-input prop-textarea"
              rows="2"
              @input="patch('content', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <div class="prop-row">
            <div class="prop-group half">
              <label class="prop-label">Size (px)</label>
              <input
                :value="selectedElement.fontSize"
                type="number" min="8" max="200"
                class="prop-input"
                @input="patch('fontSize', +($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="prop-group half">
              <label class="prop-label">Color</label>
              <input
                :value="selectedElement.textColor"
                type="color"
                class="prop-color"
                @input="patch('textColor', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="prop-group">
            <label class="prop-label">Font Family</label>
            <SearchSelect
              :model-value="selectedElement.fontFamily ?? ''"
              :options="POPULAR_FONTS"
              placeholder="sans-serif"
              input-class="prop-input"
              @update:model-value="(v) => { patch('fontFamily', v); loadFont(v) }"
            />
          </div>
          <div class="prop-group">
            <label class="prop-label">Font Weight</label>
            <select
              :value="selectedElement.fontWeight"
              class="prop-input prop-select"
              @change="patch('fontWeight', +($event.target as HTMLSelectElement).value)"
            >
              <option :value="100">Thin (100)</option>
              <option :value="300">Light (300)</option>
              <option :value="400">Regular (400)</option>
              <option :value="500">Medium (500)</option>
              <option :value="600">Semi Bold (600)</option>
              <option :value="700">Bold (700)</option>
              <option :value="900">Black (900)</option>
            </select>
          </div>
        </template>

        <!-- Video -->
        <template v-else-if="selectedElement.type === 'video'">
          <div class="prop-group">
            <label class="prop-label">Source URL / Path</label>
            <input
              :value="selectedElement.src"
              type="text"
              class="prop-input"
              placeholder="https://... or /path/to/video"
              @input="patchSrc(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="prop-group">
            <label class="prop-label">Volume ({{ Math.round(selectedElement.volume * 100) }}%)</label>
            <input
              :value="selectedElement.volume"
              type="range" min="0" max="1" step="0.05"
              class="prop-slider"
              @input="patch('volume', +($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="prop-checks">
            <label class="prop-check">
              <input :checked="selectedElement.autoplay" type="checkbox" @change="patch('autoplay', ($event.target as HTMLInputElement).checked)" />
              Autoplay
            </label>
            <label class="prop-check">
              <input :checked="selectedElement.loop" type="checkbox" @change="patch('loop', ($event.target as HTMLInputElement).checked)" />
              Loop
            </label>
            <label class="prop-check">
              <input :checked="selectedElement.muted" type="checkbox" @change="patch('muted', ($event.target as HTMLInputElement).checked)" />
              Muted
            </label>
          </div>
        </template>

        <!-- Color -->
        <template v-else-if="selectedElement.type === 'color'">
          <div class="prop-group">
            <label class="prop-label">Fill Color</label>
            <div class="color-row">
              <input
                :value="selectedElement.fillColor"
                type="color"
                class="prop-color-lg"
                @input="patch('fillColor', ($event.target as HTMLInputElement).value)"
              />
              <input
                :value="selectedElement.fillColor"
                type="text"
                class="prop-input color-hex"
                maxlength="7"
                @input="patch('fillColor', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="color-swatch" :style="{ background: selectedElement.fillColor }" />
          </div>
        </template>

        </template><!-- /contentOpen -->

        <!-- ── Effects section ── -->
        <div class="section-header" @click="fxOpen = !fxOpen">
          <span class="section-chevron" :class="{ collapsed: !fxOpen }">▾</span>
          <span class="section-title">Effects</span>
        </div>
        <template v-if="fxOpen">
          <!-- Opacity -->
          <div class="prop-group">
            <label class="prop-label">Opacity ({{ Math.round(selectedElement.effects.opacity * 100) }}%)</label>
            <input
              :value="selectedElement.effects.opacity"
              type="range" min="0" max="1" step="0.05"
              class="prop-slider"
              @input="patchFx('opacity', +($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Drop Shadow -->
          <label class="prop-check fx-check-row">
            <input
              :checked="selectedElement.effects.shadow.enabled"
              type="checkbox"
              @change="patchShadow('enabled', ($event.target as HTMLInputElement).checked)"
            />
            Drop Shadow
          </label>
          <template v-if="selectedElement.effects.shadow.enabled">
            <div class="prop-row">
              <div class="prop-group half">
                <label class="prop-label">X</label>
                <input :value="selectedElement.effects.shadow.x" type="number" class="prop-input" @input="patchShadow('x', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="prop-group half">
                <label class="prop-label">Y</label>
                <input :value="selectedElement.effects.shadow.y" type="number" class="prop-input" @input="patchShadow('y', +($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div class="prop-row">
              <div class="prop-group half">
                <label class="prop-label">Blur</label>
                <input :value="selectedElement.effects.shadow.blur" type="number" min="0" class="prop-input" @input="patchShadow('blur', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="prop-group half">
                <label class="prop-label">Color</label>
                <input :value="selectedElement.effects.shadow.color" type="color" class="prop-color" @input="patchShadow('color', ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div class="prop-group">
              <label class="prop-label">Shadow Opacity ({{ Math.round(selectedElement.effects.shadow.opacity * 100) }}%)</label>
              <input :value="selectedElement.effects.shadow.opacity" type="range" min="0" max="1" step="0.05" class="prop-slider" @input="patchShadow('opacity', +($event.target as HTMLInputElement).value)" />
            </div>
          </template>

          <!-- Animation -->
          <label class="prop-check fx-check-row">
            <input
              :checked="selectedElement.effects.animation.enabled"
              type="checkbox"
              @change="patchAnim('enabled', ($event.target as HTMLInputElement).checked)"
            />
            Animation
          </label>
          <template v-if="selectedElement.effects.animation.enabled">
            <div class="prop-group">
              <label class="prop-label">Preset</label>
              <select :value="selectedElement.effects.animation.name" class="prop-input prop-select" @change="patchAnim('name', ($event.target as HTMLSelectElement).value)">
                <option v-for="a in ANIMATIONS" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div class="prop-row">
              <div class="prop-group half">
                <label class="prop-label">Duration (s)</label>
                <input :value="selectedElement.effects.animation.duration" type="number" min="0.1" step="0.1" class="prop-input" @input="patchAnim('duration', +($event.target as HTMLInputElement).value)" />
              </div>
              <div class="prop-group half">
                <label class="prop-label">Delay (s)</label>
                <input :value="selectedElement.effects.animation.delay ?? 0" type="number" min="0" step="0.1" class="prop-input" @input="patchAnim('delay', +($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div class="prop-row">
              <div class="prop-group half">
                <label class="prop-label">Repeat (0=∞)</label>
                <input :value="selectedElement.effects.animation.repeat" type="number" min="0" step="1" class="prop-input" @input="patchAnim('repeat', +($event.target as HTMLInputElement).value)" />
              </div>
            </div>
          </template>
        </template>
      </template>
    </template>

    <div v-else class="empty-state">
      <component :is="ICONS['layers']" :size="28" class="empty-icon" />
      <div class="empty-state-content">
        <span class="empty-state-title">Elements</span>
        <span>Add a <strong>Transient</strong> or <strong>Persistent</strong> container node in the graph, then select it to add images, text, video, and colors here</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.elements-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-2);
  border-right: 0.5px solid var(--border);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px 4px;
  background: var(--surface-2);
  border-bottom: 0.5px solid var(--border);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.section-header:hover { background: var(--surface-3); }

.section-chevron {
  font-size: 12px;
  transition: transform 120ms ease;
  display: inline-block;
  color: var(--text-faint);
}
.section-chevron.collapsed { transform: rotate(-90deg); }

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: var(--text-muted);
  flex: 1;
}

.section-count {
  font-size: 11px;
  color: var(--text-faint);
  background: var(--surface-3);
  border-radius: var(--radius-sm);
  padding: 1px 5px;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--accent);
}

.node-badge {
  font-size: 10px;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-sm);
  padding: 1px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.add-section {
  padding: 0;
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}

.add-section-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 5px 10px 0;
}

.add-section-tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.4px;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: var(--radius-sm);
  padding: 1px 4px;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px 8px 6px;
  flex-shrink: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}
.add-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}
.add-btn--media {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  color: var(--text);
}
.add-btn--media:hover {
  border-color: var(--accent);
}
.klipy-icon {
  width: 14px;
  height: 14px;
}

.element-list {
  flex-shrink: 0;
  border-bottom: 0.5px solid var(--border);
}

.element-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  cursor: pointer;
  border-left: 2px solid transparent;
  border-top: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
}
.element-row:hover { background: var(--surface-3); }
.element-row.active {
  background: var(--surface-3);
  border-left-color: var(--cat-lifecycle);
}
.element-row.hovered {
  background: var(--surface-3);
  border-left-color: rgba(182, 138, 229, 0.35);
}
.element-row.drag-over {
  border-top-color: var(--accent);
}

.drag-grip {
  font-size: 12px;
  color: var(--text-faint);
  cursor: grab;
  flex-shrink: 0;
}
.element-row:hover .drag-grip { color: var(--text-faint); }
.element-row:active .drag-grip { cursor: grabbing; }

.el-icon {
  font-size: 14px;
  color: var(--cat-lifecycle);
  width: 16px;
  flex-shrink: 0;
}

.el-label {
  font-size: 13px;
  color: var(--text-muted);
  flex: 1;
}
.element-row.active .el-label { color: var(--text); }

.el-delete {
  background: none;
  border: none;
  color: var(--text-faint);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 3px;
  border-radius: var(--radius-sm);
  line-height: 1;
  opacity: 0;
  transition: opacity 120ms ease;
}
.element-row:hover .el-delete { opacity: 1; }
.el-delete:hover { color: var(--danger); background: var(--danger-tint); }

.empty-list {
  font-size: 12px;
  color: var(--text-faint);
  padding: 8px 10px;
  text-align: center;
  border-bottom: 0.5px solid var(--border);
}

.props-divider {
  height: 1px;
  background: var(--border);
  flex-shrink: 0;
  margin: 4px 0;
}

.prop-group {
  padding: 4px 10px 2px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.prop-group.half { flex: 1; min-width: 0; }
.prop-row { display: flex; gap: 0; }

.prop-label {
  font-size: 11px;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.prop-input {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 4px 6px;
  outline: none;
  width: 100%;
}
.prop-input:focus { border-color: var(--accent); }

.prop-textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 40px;
}

.prop-select { appearance: none; cursor: pointer; }

.prop-color {
  width: 100%;
  height: 26px;
  padding: 1px 2px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-3);
  cursor: pointer;
}

.prop-slider {
  width: 100%;
  accent-color: var(--accent);
}

.prop-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 2px 10px 4px;
}
.prop-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}
.prop-check input[type='checkbox'] {
  accent-color: var(--accent);
  cursor: pointer;
}

.color-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.prop-color-lg {
  width: 36px;
  height: 28px;
  padding: 2px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
  flex-shrink: 0;
}

.color-hex {
  flex: 1;
  font-family: monospace;
}

.color-swatch {
  height: 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  margin-top: 2px;
}

.img-preview,
.media-preview {
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}
.img-preview img,
.media-preview img {
  width: 100%;
  height: 54px;
  object-fit: cover;
  display: block;
}

.fx-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  cursor: pointer;
  padding: 4px 10px;
  text-align: left;
  flex-shrink: 0;
}
.fx-toggle:hover { color: var(--text); }

.fx-check-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
  padding: 3px 10px;
  flex-shrink: 0;
}
.fx-check-row input[type='checkbox'] {
  accent-color: var(--accent);
  cursor: pointer;
}

.fx-chevron {
  font-size: 12px;
  transition: transform 120ms ease;
  display: inline-block;
  transform: rotate(-90deg);
}
.fx-chevron.open { transform: rotate(0deg); }

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  text-align: center;
}

.empty-icon {
  font-size: 28px;
  color: var(--text-faint);
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-state-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.empty-state-content span {
  font-size: 12px;
  color: var(--text-faint);
  line-height: 1.5;
}

.empty-state-content strong {
  color: var(--accent);
  font-weight: 600;
}
</style>
