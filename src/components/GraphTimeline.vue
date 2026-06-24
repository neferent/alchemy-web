<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { NODE_CATEGORY_COLORS } from '@/types'

const props = defineProps<{ nodes: Node[], edges: Edge[] }>()

interface TimelineBlock {
  label: string
  start: number
  duration: number
  color: string
}

const TIMED_TYPES = new Set(['fade-in', 'fade-out', 'slide-in', 'transient', 'delay'])
const TRIGGER_TYPES = new Set(['on-event', 'on-timer'])

const LANE_H = 12
const LANE_H_SEL = 26

function labelFor(type: string, dur: number): string {
  const map: Record<string, string> = {
    'fade-in':   `Fade In ${dur}s`,
    'fade-out':  `Fade Out ${dur}s`,
    'slide-in':  `Slide In ${dur}s`,
    'transient': `Transient ${dur}s`,
  }
  return map[type] ?? `${type} ${dur}s`
}

function colorFor(type: string): string {
  if (type === 'transient') return NODE_CATEGORY_COLORS.lifecycle
  if (type === 'fade-in' || type === 'fade-out' || type === 'slide-in') return NODE_CATEGORY_COLORS.transition
  return NODE_CATEGORY_COLORS.logic
}

const timeline = computed((): TimelineBlock[] => {
  const { nodes, edges } = props
  if (!nodes.length) return []

  const outEdges = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.targetHandle === 'content') continue
    if (!outEdges.has(edge.source)) outEdges.set(edge.source, [])
    outEdges.get(edge.source)!.push(edge.target)
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const blocks: TimelineBlock[] = []

  function walk(nodeId: string, time: number, visited: Set<string>) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return

    const type = node.type ?? ''
    const data = node.data as Record<string, unknown>
    let nextTime = time

    if (TIMED_TYPES.has(type)) {
      const dur = (data.duration as number) ?? 1
      if (type !== 'delay') {
        blocks.push({ label: labelFor(type, dur), start: time, duration: dur, color: colorFor(type) })
      }
      nextTime = time + dur
    }

    for (const childId of outEdges.get(nodeId) ?? []) {
      walk(childId, nextTime, visited)
    }
  }

  const triggers = nodes.filter(n => TRIGGER_TYPES.has(n.type ?? ''))
  for (const trigger of triggers) {
    walk(trigger.id, 0, new Set())
  }

  return blocks
})

const lanes = computed((): TimelineBlock[][] => {
  const sorted = [...timeline.value].sort((a, b) => a.start - b.start)
  const result: TimelineBlock[][] = []
  const ends: number[] = []

  for (const block of sorted) {
    let placed = false
    for (let i = 0; i < result.length; i++) {
      if (ends[i] <= block.start) {
        result[i].push(block)
        ends[i] = block.start + block.duration
        placed = true
        break
      }
    }
    if (!placed) {
      result.push([block])
      ends.push(block.start + block.duration)
    }
  }
  return result
})

const hasTrigger = computed(() =>
  props.nodes.some(n => TRIGGER_TYPES.has(n.type ?? ''))
)

const totalTime = computed(() => {
  if (!timeline.value.length) return 10
  const max = Math.max(...timeline.value.map(b => b.start + b.duration))
  return Math.max(max, 5)
})

const ticks = computed(() => {
  const total = totalTime.value
  const raw = total / 8
  let interval: number
  if (raw < 0.25) interval = 0.1
  else if (raw < 0.75) interval = 0.5
  else if (raw < 2.5) interval = 1
  else if (raw < 7.5) interval = 5
  else interval = Math.ceil(raw / 10) * 10

  const result: number[] = []
  for (let t = 0; t <= total + interval * 0.01; t += interval) {
    result.push(Math.round(t * 100) / 100)
  }
  return result
})

function pct(t: number): string {
  return `${(t / totalTime.value) * 100}%`
}

// Selection
const selectedKey = ref<string | null>(null)
function blockKey(li: number, bi: number) { return `${li}-${bi}` }
function toggleBlock(li: number, bi: number) {
  const k = blockKey(li, bi)
  selectedKey.value = selectedKey.value === k ? null : k
}
function laneHasSelection(li: number): boolean {
  return lanes.value[li].some((_, bi) => selectedKey.value === blockKey(li, bi))
}


// Playhead
const isPlaying = ref(false)
const currentTime = ref(0)
let rafId: number | null = null
let lastTs: number | null = null

function tick(ts: number) {
  if (lastTs !== null) {
    currentTime.value += (ts - lastTs) / 1000
    if (currentTime.value >= totalTime.value) {
      currentTime.value = totalTime.value
      isPlaying.value = false
      lastTs = null
      return
    }
  }
  lastTs = ts
  rafId = requestAnimationFrame(tick)
}

function togglePlay() {
  if (isPlaying.value) {
    isPlaying.value = false
    if (rafId !== null) cancelAnimationFrame(rafId)
    lastTs = null
    currentTime.value = 0
  } else {
    currentTime.value = 0
    isPlaying.value = true
    lastTs = null
    rafId = requestAnimationFrame(tick)
  }
}

// Stop playback when the graph changes
watch(() => props.nodes, () => {
  if (isPlaying.value) {
    isPlaying.value = false
    if (rafId !== null) cancelAnimationFrame(rafId)
    lastTs = null
  }
  currentTime.value = 0
})

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="timeline-strip">
    <div class="timeline-label">
      <span class="label-text">Timeline</span>
      <div v-if="hasTrigger && lanes.length" class="play-wrap">
      <button
        class="play-btn"
        :title="isPlaying ? 'Stop' : 'Play'"
        @click="togglePlay"
      >
        <!-- Play icon -->
        <svg v-if="!isPlaying" width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
          <polygon points="2,1 9,5 2,9" />
        </svg>
        <!-- Stop icon -->
        <svg v-else width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
          <rect x="1.5" y="1.5" width="7" height="7" rx="0.5" />
        </svg>
      </button>
      </div>
    </div>

    <div class="timeline-body">
      <template v-if="!hasTrigger">
        <div class="timeline-hint">Add a trigger node to see timeline</div>
      </template>

      <template v-else>
        <!-- Ruler -->
        <div class="ruler">
          <div
            v-for="t in ticks"
            :key="t"
            class="tick"
            :style="{ left: pct(t) }"
          >
            <span class="tick-label">{{ t }}s</span>
          </div>
        </div>

        <!-- Lanes -->
        <div
          v-for="(lane, li) in lanes"
          :key="li"
          class="lane"
          :style="{ height: (laneHasSelection(li) ? LANE_H_SEL : LANE_H) + 'px' }"
          @click="selectedKey = null"
        >
          <div
            v-for="(block, bi) in lane"
            :key="bi"
            class="block"
            :class="{ expanded: laneHasSelection(li), selected: selectedKey === blockKey(li, bi) }"
            :style="{
              left: pct(block.start),
              width: pct(block.duration),
              background: block.color + (selectedKey === blockKey(li, bi) ? '44' : '28'),
              borderColor: block.color,
            }"
            @click.stop="toggleBlock(li, bi)"
          >
            <span v-if="selectedKey === blockKey(li, bi)" class="block-label">{{ block.label }}</span>
          </div>
        </div>

        <div v-if="!lanes.length" class="timeline-hint">
          No timing nodes in graph
        </div>

        <!-- Playhead -->
        <div
          v-if="lanes.length"
          class="playhead"
          :style="{ left: pct(currentTime) }"
        >
          <div class="playhead-caret" />
          <div class="playhead-line" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.timeline-strip {
  display: flex;
  align-items: stretch;
  border-top: 0.5px solid var(--border-strong);
  background: var(--surface-2);
  flex-shrink: 0;
}

.timeline-label {
  width: 64px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-right: 0.5px solid var(--border-strong);
}

.label-text {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.play-wrap {
  display: flex;
  padding: 4px;
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  transition: background 120ms ease, color 120ms ease;
}

.play-btn:hover {
  background: var(--surface-4);
  color: var(--text);
}

.timeline-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  position: relative;
}

.timeline-hint {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-faint);
}

.ruler {
  height: 16px;
  position: relative;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tick::before {
  content: '';
  display: block;
  width: 1px;
  height: 4px;
  background: var(--border-strong);
  margin-bottom: 2px;
}

.tick-label {
  font-size: 11px;
  color: var(--text-faint);
  white-space: nowrap;
}

.lane {
  position: relative;
  flex-shrink: 0;
  transition: height 120ms ease;
}

.block {
  position: absolute;
  height: 10px;
  top: 50%;
  transform: translateY(-50%);
  min-width: 2px;
  border: 1px solid;
  border-radius: 2px;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0;
  transition: height 120ms ease, top 120ms ease, transform 120ms ease, padding 120ms ease;
}

.block.expanded {
  height: calc(100% - 2px);
  top: 1px;
  transform: none;
}

.block.selected {
  padding: 0 5px;
}

.block-label {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

/* Playhead */
.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.playhead-caret {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid var(--accent);
  flex-shrink: 0;
  margin-top: 1px;
}

.playhead-line {
  width: 1px;
  flex: 1;
  background: var(--accent);
  opacity: 0.4;
}
</style>
