
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
  trigger:    '#FFBE72',
  lifecycle:  '#C57BFF',
  transition: '#72D5FF',
  logic:      '#91979A',
}

export interface NodeTypeDefinition {
  type: string
  label: string
  category: NodeCategory
  icon: string
  advanced?: boolean
}

export const NODE_TYPES: NodeTypeDefinition[] = [
  { type: 'on-event',   label: 'On Event',             category: 'trigger',    icon: 'icon-alert-box' },
  { type: 'on-timer',   label: 'On Timer',             category: 'trigger',    icon: 'icon-time' },
  { type: 'end-signal', label: 'End Signal',           category: 'trigger',    icon: 'icon-stop-recording' },
  { type: 'transient',  label: 'Transient Container',  category: 'lifecycle',  icon: 'icon-record' },
  { type: 'persistent', label: 'Persistent Container', category: 'lifecycle',  icon: 'icon-lock-2' },
  { type: 'audio',      label: 'Audio',                category: 'lifecycle',  icon: 'icon-audio' },
  { type: 'fade-in',    label: 'Fade In',              category: 'transition', icon: 'icon-transition' },
  { type: 'fade-out',   label: 'Fade Out',             category: 'transition', icon: 'icon-transition' },
  { type: 'slide-in',   label: 'Slide In',             category: 'transition', icon: 'icon-expand-1' },
  { type: 'condition',  label: 'Condition',            category: 'logic',      icon: 'icon-settings-3' },
  { type: 'delay',      label: 'Delay',                category: 'logic',      icon: 'icon-time' },
  { type: 'set-var',    label: 'Set Variable',         category: 'logic',      icon: 'icon-edit' },
  { type: 'get-var',    label: 'Get Variable',         category: 'logic',      icon: 'icon-information' },
  { type: 'reset-var',  label: 'Reset Variable',       category: 'logic',      icon: 'icon-reset' },
  { type: 'math',       label: 'Math',                 category: 'logic',      icon: 'icon-stats',                   advanced: true },
  { type: 'compare',    label: 'Compare',              category: 'logic',      icon: 'icon-balance',                 advanced: true },
  { type: 'clamp',      label: 'Clamp',                category: 'logic',      icon: 'icon-align-center-horizontal', advanced: true },
  { type: 'random',     label: 'Random',               category: 'logic',      icon: 'icon-shuffle',                 advanced: true },
  { type: 'str-format', label: 'String Format',        category: 'logic',      icon: 'icon-widgets',                 advanced: true },
  { type: 'to-number',  label: 'To Number',            category: 'logic',      icon: 'icon-filter',                  advanced: true },
  { type: 'to-string',  label: 'To String',            category: 'logic',      icon: 'icon-text-transform',          advanced: true },
]

// ── Element model ─────────────────────────────────────────────────────────────
// Visual elements (image / text / video / color) are no longer graph nodes.
// They live in the elements store, keyed by container nodeId.

export type ElementType = 'image' | 'text' | 'video' | 'color'

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
