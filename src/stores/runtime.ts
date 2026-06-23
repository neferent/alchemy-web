import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGraphStore } from './graph'
import { useCanvasStore } from './canvas'
import { useLayoutStore } from './layout'
import { useElementsStore } from './elements'
import { executeGraph, executeGraphFromTrigger } from '@/engine/executor'
import type { RenderItem, ContentItem, ContainerItem, TransitionSpec, SceneCommand, AudioCommand } from '@/engine/executor'

export interface ActiveScene {
  items: RenderItem[]
  opacity: number
  phase: 'entering' | 'active' | 'exiting'
  transitionIn: TransitionSpec | null
  transitionOut: TransitionSpec | null
}

export { ContentItem, ContainerItem, RenderItem }

export const useRuntimeStore = defineStore('runtime', () => {
  const graphStore = useGraphStore()
  const canvasStore = useCanvasStore()
  const layoutStore = useLayoutStore()
  const elementsStore = useElementsStore()

  const scenes = ref<Record<string, ActiveScene>>({})

  // setTimeout handles (scene lifecycle: fade-in, transient duration, fade-out)
  const _timers: Record<string, ReturnType<typeof setTimeout>[]> = {}
  // setInterval handles (on-timer nodes)
  const _intervals: Record<string, ReturnType<typeof setInterval>[]> = {}

  const _areaVars: Record<string, Record<string, unknown>> = {}

  function _clearTimers(areaId: string) {
    ;(_timers[areaId] ?? []).forEach(clearTimeout)
    _timers[areaId] = []
  }

  function _addTimer(areaId: string, fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    _timers[areaId] = [...(_timers[areaId] ?? []), id]
  }

  function _clearAllIntervals() {
    for (const areaId of Object.keys(_intervals)) {
      ;(_intervals[areaId] ?? []).forEach(clearInterval)
    }
    for (const key of Object.keys(_intervals)) delete _intervals[key]
  }

  function _playAudio(commands: AudioCommand[]) {
    for (const cmd of commands) {
      if (!cmd.src) continue
      const el = new Audio(cmd.src)
      el.volume = Math.max(0, Math.min(1, cmd.volume))
      el.play().catch(() => {})
    }
  }

  function _applyScene(areaId: string, cmd: SceneCommand) {
    _clearTimers(areaId)
    const fadeInMs  = cmd.transitionIn?.type  === 'fade' ? cmd.transitionIn.duration  * 1000 : 0
    const fadeOutMs = cmd.transitionOut?.type === 'fade' ? cmd.transitionOut.duration * 1000 : 0

    scenes.value[areaId] = {
      items: cmd.items,
      opacity: 0,
      phase: 'entering',
      transitionIn: cmd.transitionIn,
      transitionOut: cmd.transitionOut,
    }

    _addTimer(areaId, () => {
      if (scenes.value[areaId]) scenes.value[areaId].opacity = 1
    }, 16)

    _addTimer(areaId, () => {
      const scene = scenes.value[areaId]
      if (!scene) return
      scene.phase = 'active'

      if (cmd.lifecycleDuration !== null) {
        _addTimer(areaId, () => {
          const s = scenes.value[areaId]
          if (!s) return
          s.phase = 'exiting'
          s.opacity = 0
          _addTimer(areaId, () => { delete scenes.value[areaId] }, fadeOutMs)
        }, cmd.lifecycleDuration * 1000)
      }
    }, fadeInMs)
  }

  function _findItem(items: RenderItem[], nodeId: string): ContentItem | null {
    for (const item of items) {
      if (item.id === nodeId && item.kind === 'content') return item
      if (item.kind === 'container') {
        const found = _findItem(item.children, nodeId)
        if (found) return found
      }
    }
    return null
  }

  const MOCK_EVENT_DATA: Record<string, () => Record<string, unknown>> = {
    donation:     () => { const amount = Math.floor(Math.random() * 20) + 1; const tipper = ['StreamKing', 'NightOwl99', 'PixelWitch', 'ChaosGremlin', 'LootGoblin', 'VoidWalker', 'NeonSerpent', 'FrostByte', 'ThunderClap', 'GlitchHunter'][Math.floor(Math.random() * 10)]; return { amount, tipper, message: 'Test donation!', formattedAmount: `$${amount}.00` } },
    follow:       () => ({ username: 'TestUser' }),
    subscription: () => ({ username: 'TestUser', months: 3, streak: 3, tier: '1000' }),
    bits:         () => ({ username: 'TestUser', bits: 100, message: 'Cheer100' }),
    superchat:    () => ({ username: 'TestUser', amount: 5, message: 'Super chat!', formattedAmount: '$5.00' }),
    raid:         () => ({ username: 'TestUser', raiders: 50, viewerCount: 50 }),
    merch:        () => ({ username: 'TestUser', message: 'Thanks for the merch!' }),
  }

  function fireEvent(eventType: string, ev?: Record<string, unknown>) {
    const eventData = ev ?? MOCK_EVENT_DATA[eventType]?.() ?? {}
    for (const area of canvasStore.areas) {
      if (!_areaVars[area.id]) _areaVars[area.id] = {}
      const graph = graphStore.getGraph(area.id)
      const { scene: cmd, updates, audio, delayMs } = executeGraph(
        area.id, graph.nodes, graph.edges, eventType,
        layoutStore.layout, elementsStore.elements,
        eventData, _areaVars[area.id],
      )

      for (const update of updates) {
        const scene = scenes.value[area.id]
        if (!scene) continue
        const item = _findItem(scene.items, update.nodeId)
        if (item) Object.assign(item.data, update.data)
      }

      _playAudio(audio)
      if (cmd) {
        if (delayMs > 0) {
          _addTimer(area.id, () => _applyScene(area.id, cmd), delayMs)
        } else {
          _applyScene(area.id, cmd)
        }
      }
    }
  }

  // Scan all area graphs for on-timer nodes and wire up setInterval for each.
  function _setupTimers() {
    _clearAllIntervals()
    for (const area of canvasStore.areas) {
      const graph = graphStore.getGraph(area.id)
      for (const node of graph.nodes) {
        if (node.type !== 'on-timer') continue
        const intervalMs = Math.max(1000, (Number(node.data.interval) || 60) * 1000)
        const nodeId = node.id
        const areaId = area.id
        const id = setInterval(() => {
          if (!_areaVars[areaId]) _areaVars[areaId] = {}
          const g = graphStore.getGraph(areaId)
          const { scene: cmd, updates, audio, delayMs } = executeGraphFromTrigger(
            areaId, g.nodes, g.edges, nodeId,
            layoutStore.layout, elementsStore.elements,
            { now: Date.now() }, _areaVars[areaId],
          )
          for (const update of updates) {
            const scene = scenes.value[areaId]
            if (!scene) continue
            const item = _findItem(scene.items, update.nodeId)
            if (item) Object.assign(item.data, update.data)
          }
          _playAudio(audio)
          if (cmd) {
            if (delayMs > 0) {
              _addTimer(areaId, () => _applyScene(areaId, cmd), delayMs)
            } else {
              _applyScene(areaId, cmd)
            }
          }
        }, intervalMs)
        if (!_intervals[areaId]) _intervals[areaId] = []
        _intervals[areaId].push(id)
      }
    }
  }

  // Call after any graph change so new/removed timer nodes take effect immediately.
  function refreshTimers() {
    _setupTimers()
  }

  function clearArea(areaId: string) {
    _clearTimers(areaId)
    ;(_intervals[areaId] ?? []).forEach(clearInterval)
    delete _intervals[areaId]
    delete scenes.value[areaId]
    delete _areaVars[areaId]
  }

  function resetSession() {
    for (const area of canvasStore.areas) clearArea(area.id)
    fireEvent('init', {})
    _setupTimers()
  }

  fireEvent('init', {})
  _setupTimers()

  return { scenes, fireEvent, clearArea, resetSession, refreshTimers }
})
