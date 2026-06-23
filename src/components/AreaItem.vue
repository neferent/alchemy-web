<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Area } from '@/types'
import { useGraphStore } from '@/stores/graph'
import { Info, Pencil, Trash2 } from 'lucide-vue-next'

const graphStore = useGraphStore()

const props = defineProps<{
  area: Area
  selected: boolean
  drawMode: boolean
}>()

const emit = defineEmits<{
  select: []
  rename: [name: string]
  remove: []
  dragStart: [e: MouseEvent]
  resizeStart: [handle: string, e: MouseEvent]
}>()

const editing = ref(false)
const editName = ref('')

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

function onBodyMouseDown(e: MouseEvent) {
  if (props.drawMode) return
  e.stopPropagation()
  emit('select')
  emit('dragStart', e)
}

function onHandleMouseDown(handle: string, e: MouseEvent) {
  e.stopPropagation()
  emit('select')
  emit('resizeStart', handle, e)
}

function startEdit(e?: MouseEvent) {
  e?.stopPropagation()
  editing.value = true
  editName.value = props.area.name
}

const graph = computed(() => graphStore.getGraph(props.area.id))
const nodeCount = computed(() => graph.value.nodes.length)
const edgeCount = computed(() => graph.value.edges.length)

watch(() => props.selected, (selected) => {
  if (!selected && editing.value) commitEdit()
})

function commitEdit() {
  editing.value = false
  const name = editName.value.trim()
  if (name && name !== props.area.name) emit('rename', name)
}
</script>

<template>
  <div
    class="area"
    :class="{ selected, interactive: !drawMode }"
    :style="{
      left: `${area.x}%`,
      top: `${area.y}%`,
      width: `${area.width}%`,
      height: `${area.height}%`,
      '--color': area.color
    }"
    @mousedown="onBodyMouseDown"
  >
    <div class="area-actions" @mousedown.stop>
      <!-- name — always visible -->
      <div class="area-name-pill" @dblclick.stop="startEdit">
        <template v-if="editing">
          <input
            v-model="editName"
            class="area-name-input"
            :size="Math.max(2, editName.length)"
            autofocus
            @blur="commitEdit"
            @keydown.enter="commitEdit"
            @keydown.esc="editing = false"
            @mousedown.stop
          />
        </template>
        <template v-else>{{ area.name }}</template>
      </div>

      <!-- action buttons — selected only, pinned right -->
      <template v-if="selected && !drawMode">
        <div class="info-wrap" style="margin-left: auto" @click.stop>
          <button class="area-action-btn" title="Area info">
            <Info :size="13" />
          </button>
          <div class="info-tooltip">
            <div class="info-row"><span class="info-label">Origin</span><span class="info-val">{{ area.x.toFixed(1) }}%, {{ area.y.toFixed(1) }}%</span></div>
            <div class="info-row"><span class="info-label">Size</span><span class="info-val">{{ area.width.toFixed(1) }}% × {{ area.height.toFixed(1) }}%</span></div>
            <div class="info-sep" />
            <div class="info-row"><span class="info-label">Nodes</span><span class="info-val">{{ nodeCount }}</span></div>
            <div class="info-row"><span class="info-label">Connections</span><span class="info-val">{{ edgeCount }}</span></div>
          </div>
        </div>
        <button class="area-action-btn" title="Rename area" @click.stop="startEdit()">
          <Pencil :size="13" />
        </button>
        <button class="area-action-btn" title="Remove area" @click.stop="emit('remove')">
          <Trash2 :size="13" />
        </button>
      </template>
    </div>

    <template v-if="selected && !drawMode">
      <div
        v-for="handle in HANDLES"
        :key="handle"
        :class="`handle handle-${handle}`"
        @mousedown.stop="onHandleMouseDown(handle, $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.area {
  position: absolute;
  border: 1.5px solid var(--color);
  background: color-mix(in srgb, var(--color) 7%, transparent);
  transition: background 0.1s;
}

.area.interactive {
  cursor: grab;
}

.area:hover {
  background: color-mix(in srgb, var(--color) 13%, transparent);
}

.area.selected {
  border-width: 2px;
  background: color-mix(in srgb, var(--color) 13%, transparent);
  box-shadow: 0 0 0 1px var(--color);
}

.area-actions {
  position: absolute;
  top: -34px;
  left: 0;
  right: 0;
  height: 26px;
  display: flex;
  align-items: center;
  z-index: 20;
  padding: 0 0 0 6px;
  gap: 2px;
}

.area-name-pill {
  flex: 1;
  min-width: 0;
  height: 22px;
  padding: 0 4px 0 0;
  color: var(--color);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  cursor: default;
  border-radius: 3px;
}

.area-name-pill:has(.area-name-input) {
  flex: none;
  background: color-mix(in srgb, var(--color) 20%, transparent);
  padding-left: 0;
  padding-right: 0;
}

.area-action-btn {
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  color: var(--color);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.7;
  border-radius: 3px;
}
.area-action-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--color) 20%, transparent);
}

.info-wrap {
  position: relative;
}

.info-tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 7px 9px;
  min-width: 160px;
  box-shadow: 0 4px 16px #0008;
  z-index: 100;
  pointer-events: none;
}

.info-wrap:hover .info-tooltip {
  display: block;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 1px 0;
}

.info-label {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.info-val {
  font-size: 10px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.info-sep {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.area-name-input {
  background: transparent;
  border: none;
  color: var(--color);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  padding: 0 2px;
}

/* Resize handles */
.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1.5px solid var(--color);
  border-radius: 2px;
  z-index: 10;
}

.handle-nw { top: 0; left: 0;   transform: translate(-50%, -50%); cursor: nwse-resize; }
.handle-n  { top: 0; left: 50%; transform: translate(-50%, -50%); cursor: ns-resize;   }
.handle-ne { top: 0; right: 0;  transform: translate(50%, -50%);  cursor: nesw-resize; }
.handle-e  { top: 50%; right: 0; transform: translate(50%, -50%); cursor: ew-resize;   }
.handle-se { bottom: 0; right: 0; transform: translate(50%, 50%); cursor: nwse-resize; }
.handle-s  { bottom: 0; left: 50%; transform: translate(-50%, 50%); cursor: ns-resize; }
.handle-sw { bottom: 0; left: 0; transform: translate(-50%, 50%);  cursor: nesw-resize;}
.handle-w  { top: 50%; left: 0; transform: translate(-50%, -50%); cursor: ew-resize;   }
</style>
