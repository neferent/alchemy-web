
export interface Area {
  id: string
  name: string
  x: number      // % of canvas width
  y: number      // % of canvas height
  width: number  // %
  height: number // %
  color: string
}

export type NodeCategory = 'trigger' | 'lifecycle' | 'transition' | 'logic'

export const NODE_CATEGORY_COLORS: Record<NodeCategory, string> = {
  trigger:    '#E8A862',
  lifecycle:  '#B68AE5',
  transition: '#5DB8D9',
  logic:      '#7C8896',
}

export interface NodeTypeDefinition {
  type: string
  label: string
  category: NodeCategory
  icon: string
  advanced?: boolean
}

export const NODE_TYPES: NodeTypeDefinition[] = [
  { type: 'on-event',   label: 'On Event',             category: 'trigger',    icon: 'bell-ring' },
  { type: 'on-timer',   label: 'On Timer',             category: 'trigger',    icon: 'timer' },
  { type: 'end-signal', label: 'End Signal',           category: 'trigger',    icon: 'circle-stop' },
  { type: 'transient',  label: 'Transient Container',  category: 'lifecycle',  icon: 'box-select' },
  { type: 'persistent', label: 'Persistent Container', category: 'lifecycle',  icon: 'lock' },
  { type: 'audio',      label: 'Audio',                category: 'lifecycle',  icon: 'volume-2' },
  { type: 'fade-in',    label: 'Fade In',              category: 'transition', icon: 'blend' },
  { type: 'fade-out',   label: 'Fade Out',             category: 'transition', icon: 'blend' },
  { type: 'slide-in',   label: 'Slide In',             category: 'transition', icon: 'move-right' },
  { type: 'condition',  label: 'Condition',            category: 'logic',      icon: 'sliders-horizontal' },
  { type: 'delay',      label: 'Delay',                category: 'logic',      icon: 'clock' },
  { type: 'set-var',    label: 'Set Variable',         category: 'logic',      icon: 'pencil' },
  { type: 'get-var',    label: 'Get Variable',         category: 'logic',      icon: 'info' },
  { type: 'reset-var',  label: 'Reset Variable',       category: 'logic',      icon: 'rotate-ccw' },
  { type: 'math',       label: 'Math',                 category: 'logic',      icon: 'bar-chart',                    advanced: true },
  { type: 'compare',    label: 'Compare',              category: 'logic',      icon: 'scale',                        advanced: true },
  { type: 'clamp',      label: 'Clamp',                category: 'logic',      icon: 'align-center-horizontal',      advanced: true },
  { type: 'random',     label: 'Random',               category: 'logic',      icon: 'shuffle',                      advanced: true },
  { type: 'str-format', label: 'String Format',        category: 'logic',      icon: 'layout-grid',                  advanced: true },
  { type: 'to-number',  label: 'To Number',            category: 'logic',      icon: 'filter',                       advanced: true },
  { type: 'to-string',  label: 'To String',            category: 'logic',      icon: 'case-sensitive',               advanced: true },
]

// ── Element model ─────────────────────────────────────────────────────────────
// Visual elements (image / text / video / color) are no longer graph nodes.
// They live in the elements store, keyed by container nodeId.

export type ElementType = 'image' | 'text' | 'video' | 'color' | 'gif'

export interface ElementEffects {
  opacity: number
  shadow: { enabled: boolean; x: number; y: number; blur: number; spread: number; color: string; opacity: number }
  animation: { enabled: boolean; name: string; duration: number; delay: number; repeat: number }
}

export interface ElementData {
  id: string
  type: ElementType
  // image / video
  src: string
  // video
  autoplay: boolean
  loop: boolean
  muted: boolean
  volume: number
  // text
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textColor: string
  // color
  fillColor: string
  // shared
  effects: ElementEffects
}

const DEFAULT_EFFECTS: ElementEffects = {
  opacity: 1,
  shadow:    { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 },
  animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 },
}

export function defaultElement(type: ElementType): ElementData {
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    src: '',
    autoplay: true,
    loop: false,
    muted: false,
    volume: 1,
    content: 'Hello!',
    fontSize: 24,
    fontFamily: 'sans-serif',
    fontWeight: 400,
    textColor: '#ffffff',
    fillColor: '#3b82f6',
    effects: {
      opacity: DEFAULT_EFFECTS.opacity,
      shadow:    { ...DEFAULT_EFFECTS.shadow },
      animation: { ...DEFAULT_EFFECTS.animation },
    },
  }
}
