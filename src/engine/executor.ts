import type { Node, Edge } from '@vue-flow/core'
import type { ItemLayout } from '@/stores/layout'
import type { ElementData, ElementEffects } from '@/types'

const RESERVED_VARS = new Set([
  'amount', 'tipper', 'username', 'message', 'months', 'streak',
  'gifted', 'bits', 'raiders', 'viewerCount', 'tier', 'formattedAmount', 'now',
])

const LOGIC_NODE_TYPES = new Set([
  'set-var', 'get-var', 'reset-var', 'math', 'compare',
  'clamp', 'random', 'str-format', 'to-number', 'to-string', 'condition', 'delay',
])

const BRANCHING_TYPES = new Set(['compare', 'condition'])

function interpolate(template: string, ev: Record<string, unknown>, vars: Record<string, unknown>): string {
  return String(template).replace(/\{\$(\w+)\}/g, (_, key) => {
    if (ev[key] !== undefined) return String(ev[key])
    if (vars[key] !== undefined) return String(vars[key])
    return ''
  })
}

function evalExpr(expr: unknown, ev: Record<string, unknown>, vars: Record<string, unknown>): number {
  if (expr === null || expr === undefined) return 0
  const s = String(expr).trim()
  const m = s.match(/^\{\$(\w+)\}$/)
  if (m) {
    const key = m[1]
    if (ev[key] !== undefined) return Number(ev[key]) || 0
    if (vars[key] !== undefined) return Number(vars[key]) || 0
    return 0
  }
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

function executeLogicNode(
  node: Node,
  ev: Record<string, unknown>,
  vars: Record<string, unknown>,
): { branch: 'true' | 'false' } | null {
  const d = node.data as Record<string, unknown>

  if (node.type === 'set-var') {
    const name = d.variable as string
    if (name && !RESERVED_VARS.has(name))
      vars[name] = interpolate(String(d.value ?? ''), ev, vars)
  } else if (node.type === 'reset-var') {
    const name = d.variable as string
    if (name && !RESERVED_VARS.has(name)) delete vars[name]
  } else if (node.type === 'math') {
    const a = evalExpr(d.a, ev, vars)
    const b = evalExpr(d.b, ev, vars)
    const op = d.operator as string
    let result = 0
    if (op === '+') result = a + b
    else if (op === '-') result = a - b
    else if (op === '*') result = a * b
    else if (op === '/') result = b !== 0 ? a / b : 0
    else if (op === '%') result = b !== 0 ? a % b : 0
    else if (op === 'min') result = Math.min(a, b)
    else if (op === 'max') result = Math.max(a, b)
    vars[`$mathResult_${node.id}`] = result
  } else if (node.type === 'compare') {
    const ca = evalExpr(d.a, ev, vars)
    const cb = evalExpr(d.b, ev, vars)
    const op = d.operator as string
    let pass = false
    if (op === '>') pass = ca > cb
    else if (op === '>=') pass = ca >= cb
    else if (op === '<') pass = ca < cb
    else if (op === '<=') pass = ca <= cb
    else if (op === '==') pass = ca == cb  // eslint-disable-line eqeqeq
    else if (op === '!=') pass = ca != cb  // eslint-disable-line eqeqeq
    return { branch: pass ? 'true' : 'false' }
  } else if (node.type === 'condition') {
    const amount = Number(ev.amount) || 0
    const threshold = Number(d.value) || 0
    const op = d.operator as string
    let pass = false
    if (op === '>') pass = amount > threshold
    else if (op === '>=') pass = amount >= threshold
    else if (op === '<') pass = amount < threshold
    else if (op === '<=') pass = amount <= threshold
    else if (op === '==') pass = amount == threshold  // eslint-disable-line eqeqeq
    else if (op === '!=') pass = amount != threshold  // eslint-disable-line eqeqeq
    return { branch: pass ? 'true' : 'false' }
  } else if (node.type === 'clamp') {
    const v = evalExpr(d.value, ev, vars)
    const mn = evalExpr(d.min, ev, vars)
    const mx = evalExpr(d.max, ev, vars)
    vars[`$clampResult_${node.id}`] = Math.min(Math.max(v, mn), mx)
  } else if (node.type === 'random') {
    const rmin = Number(d.min) || 0
    const rmax = Number(d.max) || 1
    const rval = Math.random() * (rmax - rmin) + rmin
    vars[`$randomResult_${node.id}`] = d.integer ? Math.floor(rval) : rval
  } else if (node.type === 'str-format') {
    vars[`$strFormatResult_${node.id}`] = interpolate(String(d.template ?? ''), ev, vars)
  } else if (node.type === 'to-number') {
    vars[`$toNumberResult_${node.id}`] = parseFloat(interpolate(String(d.value ?? ''), ev, vars)) || 0
  } else if (node.type === 'to-string') {
    const dec = Number(d.decimals) || 0
    vars[`$toStringResult_${node.id}`] = evalExpr(d.value, ev, vars).toFixed(dec)
  }

  return null
}

export type TransitionSpec = {
  type: 'fade' | 'slide'
  duration: number
  direction?: string
}

export interface ModifierStyles {
  opacity?: number
  filter?: string
  animationClass?: string
  animationDuration?: string
  animationDelay?: string
  animationIterationCount?: string
}

export interface ContentItem {
  kind: 'content'
  id: string
  type: 'image' | 'text' | 'audio' | 'video' | 'color' | 'gif' | 'clip' | 'sticker'
  data: Record<string, unknown>
  modifiers: ModifierStyles
  zIndex: number
  x: number
  y: number
  w: number
  h: number
}

export interface ContainerItem {
  kind: 'container'
  id: string
  modifiers: ModifierStyles
  zIndex: number
  x: number
  y: number
  w: number
  h: number
  children: ContentItem[]
}

export type RenderItem = ContentItem | ContainerItem

export interface SceneCommand {
  areaId: string
  items: RenderItem[]
  transitionIn: TransitionSpec | null
  transitionOut: TransitionSpec | null
  lifecycleDuration: number | null
}

export interface UpdateCommand {
  areaId: string
  nodeId: string
  data: Record<string, unknown>
}

export interface AudioCommand {
  src: string
  volume: number
}

export interface ExecuteResult {
  scene: SceneCommand | null
  updates: UpdateCommand[]
  audio: AudioCommand[]
  delayMs: number
}

function resolveModifiersFromEffects(effects?: ElementEffects): ModifierStyles {
  if (!effects) return {}
  const mods: ModifierStyles = {}
  if (typeof effects.opacity === 'number' && effects.opacity < 1) mods.opacity = effects.opacity
  const shadow = effects.shadow
  if (shadow?.enabled) {
    const r = parseInt(shadow.color.slice(1, 3), 16)
    const g = parseInt(shadow.color.slice(3, 5), 16)
    const b = parseInt(shadow.color.slice(5, 7), 16)
    mods.filter = `drop-shadow(${shadow.x}px ${shadow.y}px ${shadow.blur}px rgba(${r},${g},${b},${shadow.opacity}))`
  }
  const anim = effects.animation
  if (anim?.enabled) {
    mods.animationClass = `animate__animated animate__${anim.name}`
    mods.animationDuration = `${anim.duration}s`
    if (anim.delay) mods.animationDelay = `${anim.delay}s`
    mods.animationIterationCount = anim.repeat === 0 ? 'infinite' : String(anim.repeat)
  }
  return mods
}

function resolveModifiers(node: Node): ModifierStyles {
  const fx = node.data.effects as Record<string, unknown> | undefined
  if (!fx) return {}
  const mods: ModifierStyles = {}
  if (typeof fx.opacity === 'number' && fx.opacity < 1) mods.opacity = fx.opacity
  const shadow = fx.shadow as Record<string, unknown> | undefined
  if (shadow?.enabled) {
    const x = shadow.x as number, y = shadow.y as number, blur = shadow.blur as number
    const color = shadow.color as string, op = shadow.opacity as number
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    mods.filter = `drop-shadow(${x}px ${y}px ${blur}px rgba(${r},${g},${b},${op}))`
  }
  const anim = fx.animation as Record<string, unknown> | undefined
  if (anim?.enabled) {
    mods.animationClass = `animate__animated animate__${anim.name as string}`
    mods.animationDuration = `${anim.duration as number}s`
    const delay = anim.delay as number
    if (delay) mods.animationDelay = `${delay}s`
    const repeat = anim.repeat as number
    mods.animationIterationCount = repeat === 0 ? 'infinite' : String(repeat)
  }
  return mods
}

// Shared execution logic — call with the trigger node already resolved
function _execute(
  areaId: string,
  nodes: Node[],
  edges: Edge[],
  trigger: Node,
  allLayouts: Record<string, Record<string, ItemLayout>>,
  allElements: Record<string, ElementData[]>,
  ev: Record<string, unknown>,
  vars: Record<string, unknown>,
): ExecuteResult {
  const byId = (id: string) => nodes.find(n => n.id === id)
  const outEdges = (nodeId: string) => edges.filter(e => e.source === nodeId)

  function collectElementItems(nodeId: string, parentLayoutId: string): ContentItem[] {
    const elements = allElements[nodeId] ?? []
    return elements.map((el, i) => {
      const layout = allLayouts[parentLayoutId]?.[el.id] ?? { x: 0, y: 0, w: 50, h: 50, z: 0 }
      const data: Record<string, unknown> = {
        src: el.src,
        autoplay: el.autoplay, loop: el.loop, muted: el.muted, volume: el.volume,
        content: el.type === 'text' ? interpolate(el.content, ev, vars) : el.content,
        fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: el.fontWeight,
        color: el.type === 'color' ? el.fillColor : el.textColor,
        fillColor: el.fillColor,
      }
      return {
        kind: 'content' as const,
        id: el.id,
        type: el.type as ContentItem['type'],
        data,
        modifiers: resolveModifiersFromEffects(el.effects),
        zIndex: i,
        x: layout.x, y: layout.y, w: layout.w, h: layout.h,
      }
    })
  }

  function resolveContainerNode(sourceId: string, zIndex: number): RenderItem | null {
    const n = byId(sourceId)
    if (!n || n.type !== 'container') return null
    const layout = allLayouts[areaId]?.[n.id] ?? { x: 0, y: 0, w: 100, h: 100, z: 0 }
    const children = collectElementItems(n.id, n.id)
    return {
      kind: 'container',
      id: n.id,
      modifiers: resolveModifiers(n),
      zIndex: layout.z ?? zIndex,
      x: layout.x, y: layout.y, w: layout.w, h: layout.h,
      children,
    }
  }

  function collectItems(lifecycleNodeId: string): RenderItem[] {
    const direct = collectElementItems(lifecycleNodeId, areaId)
    const containerItems = edges
      .filter(e => e.target === lifecycleNodeId && e.targetHandle === 'content')
      .map((e, i) => resolveContainerNode(e.source, direct.length + i))
      .filter(Boolean) as RenderItem[]
    return [...direct, ...containerItems]
  }

  let transitionIn: TransitionSpec | null = null
  let transitionOut: TransitionSpec | null = null
  let lifecycleDuration: number | null = null
  let items: RenderItem[] = []
  let delayMs = 0
  const updates: UpdateCommand[] = []
  const audio: AudioCommand[] = []

  const visited = new Set<string>()
  let currentId = trigger.id

  while (true) {
    if (visited.has(currentId)) break
    visited.add(currentId)

    const current = byId(currentId)
    const outs = outEdges(currentId)
    if (outs.length === 0) break

    const mainOuts = outs.filter(e => e.targetHandle !== 'update' && e.targetHandle !== 'content')
    if (mainOuts.length === 0) break

    let nextEdge = mainOuts[0]
    if (current && BRANCHING_TYPES.has(current.type ?? '')) {
      const result = executeLogicNode(current, ev, vars)
      const branch = result?.branch ?? 'true'
      const branchEdge = mainOuts.find(e => e.sourceHandle === branch)
      if (!branchEdge) break
      nextEdge = branchEdge
    }

    const next = byId(nextEdge.target)
    if (!next) break
    currentId = next.id

    if (LOGIC_NODE_TYPES.has(next.type ?? '') && !BRANCHING_TYPES.has(next.type ?? '')) {
      if (next.type === 'delay') {
        delayMs += (Number(next.data.duration) || 0) * 1000
      } else {
        executeLogicNode(next, ev, vars)
      }
      continue
    }

    switch (next.type) {
      case 'fade-in':
        transitionIn = { type: 'fade', duration: next.data.duration as number }
        break
      case 'slide-in':
        transitionIn = { type: 'slide', duration: next.data.duration as number, direction: next.data.direction as string }
        break
      case 'fade-out':
        transitionOut = { type: 'fade', duration: next.data.duration as number }
        break
      case 'transient':
        lifecycleDuration = next.data.duration as number
        items = collectItems(next.id)
        break
      case 'persistent':
        lifecycleDuration = null
        items = collectItems(next.id)
        break
      case 'audio': {
        const src = String(next.data.src ?? '')
        if (src) audio.push({ src, volume: Number(next.data.volume ?? 1) })
        break
      }
    }
  }

  const scene = items.length > 0 ? { areaId, items, transitionIn, transitionOut, lifecycleDuration } : null
  return { scene, updates, audio, delayMs }
}

// Execute a graph starting from an on-event trigger matching eventType
export function executeGraph(
  areaId: string,
  nodes: Node[],
  edges: Edge[],
  eventType: string,
  allLayouts: Record<string, Record<string, ItemLayout>> = {},
  allElements: Record<string, ElementData[]> = {},
  ev: Record<string, unknown> = {},
  vars: Record<string, unknown> = {},
): ExecuteResult {
  const trigger = nodes.find(n => n.type === 'on-event' && n.data.event === eventType)
  if (!trigger) return { scene: null, updates: [], audio: [], delayMs: 0 }
  return _execute(areaId, nodes, edges, trigger, allLayouts, allElements, ev, vars)
}

// Execute a graph starting from a specific trigger node (used by on-timer)
export function executeGraphFromTrigger(
  areaId: string,
  nodes: Node[],
  edges: Edge[],
  triggerNodeId: string,
  allLayouts: Record<string, Record<string, ItemLayout>> = {},
  allElements: Record<string, ElementData[]> = {},
  ev: Record<string, unknown> = {},
  vars: Record<string, unknown> = {},
): ExecuteResult {
  const trigger = nodes.find(n => n.id === triggerNodeId)
  if (!trigger) return { scene: null, updates: [], audio: [], delayMs: 0 }
  return _execute(areaId, nodes, edges, trigger, allLayouts, allElements, ev, vars)
}
