import { v4 as uuidv4 } from 'uuid'
import type { Area } from '@/types'
import type { ElementData } from '@/types'

interface PresetNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

interface PresetEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

interface PresetScene {
  areas: Area[]
  graphs: Record<string, { nodes: PresetNode[]; edges: PresetEdge[] }>
  layout: Record<string, Record<string, { x: number; y: number; w: number; h: number; z: number }>>
  elements: Record<string, ElementData[]>
}

export interface Preset {
  id: string
  name: string
  description: string
  build: () => PresetScene
}

function uid() {
  return uuidv4()
}

function makeElement(partial: Partial<ElementData> & { id: string; type: ElementData['type'] }): ElementData {
  return {
    id: partial.id,
    type: partial.type,
    src: partial.src ?? '',
    autoplay: partial.autoplay ?? true,
    loop: partial.loop ?? false,
    muted: partial.muted ?? false,
    volume: partial.volume ?? 1,
    content: partial.content ?? '',
    fontSize: partial.fontSize ?? 24,
    fontFamily: partial.fontFamily ?? 'sans-serif',
    fontWeight: partial.fontWeight ?? 400,
    textColor: partial.textColor ?? '#ffffff',
    fillColor: partial.fillColor ?? '#3b82f6',
    effects: {
      opacity: partial.effects?.opacity ?? 1,
      shadow: {
        enabled: partial.effects?.shadow?.enabled ?? false,
        x: partial.effects?.shadow?.x ?? 4,
        y: partial.effects?.shadow?.y ?? 4,
        blur: partial.effects?.shadow?.blur ?? 8,
        spread: partial.effects?.shadow?.spread ?? 0,
        color: partial.effects?.shadow?.color ?? '#000000',
        opacity: partial.effects?.shadow?.opacity ?? 0.5,
      },
      animation: {
        enabled: partial.effects?.animation?.enabled ?? false,
        name: partial.effects?.animation?.name ?? 'bounce',
        duration: partial.effects?.animation?.duration ?? 1,
        delay: partial.effects?.animation?.delay ?? 0,
        repeat: partial.effects?.animation?.repeat ?? 1,
      },
    },
  }
}

export function buildSampleScene(): PresetScene {
  const alertAreaId = uid()
  const goalAreaId = uid()
  const bannerAreaId = uid()

  // --- Alert area: donation with condition ---
  const alertTrigger = uid()
  const alertCondition = uid()
  const bigFadeIn = uid()
  const bigContainer = uid()
  const bigDelay = uid()
  const bigFadeOut = uid()
  const smallSlideIn = uid()
  const smallContainer = uid()
  const smallDelay = uid()
  const smallFadeOut = uid()

  // --- Goal area: persistent follower counter ---
  const goalInit = uid()
  const goalPersistent = uid()
  const goalFollowTrigger = uid()
  const goalSetVar = uid()

  // --- Banner area: timed rotation ---
  const bannerTimer = uid()
  const bannerFadeIn = uid()
  const bannerContainer = uid()
  const bannerDelay = uid()
  const bannerFadeOut = uid()

  return {
    areas: [
      { id: alertAreaId, name: 'Donation Alert', x: 25, y: 10, width: 50, height: 18, color: '#f59e0b' },
      { id: goalAreaId, name: 'Follower Goal', x: 10, y: 85, width: 80, height: 8, color: '#22c55e' },
      { id: bannerAreaId, name: 'Info Banner', x: 30, y: 75, width: 40, height: 8, color: '#06b6d4' },
    ],
    graphs: {
      [alertAreaId]: {
        nodes: [
          { id: alertTrigger, type: 'on-event', position: { x: 40, y: 140 }, data: { event: 'donation' } },
          { id: alertCondition, type: 'condition', position: { x: 260, y: 120 }, data: { operator: '>=', value: 25 } },
          { id: bigFadeIn, type: 'fade-in', position: { x: 500, y: 40 }, data: { duration: 0.3 } },
          { id: bigContainer, type: 'transient', position: { x: 720, y: 40 }, data: { duration: 7 } },
          { id: bigDelay, type: 'delay', position: { x: 720, y: 170 }, data: { duration: 6 } },
          { id: bigFadeOut, type: 'fade-out', position: { x: 940, y: 170 }, data: { duration: 0.5 } },
          { id: smallSlideIn, type: 'slide-in', position: { x: 500, y: 280 }, data: { duration: 0.4, direction: 'top' } },
          { id: smallContainer, type: 'transient', position: { x: 720, y: 280 }, data: { duration: 4 } },
          { id: smallDelay, type: 'delay', position: { x: 720, y: 410 }, data: { duration: 3 } },
          { id: smallFadeOut, type: 'fade-out', position: { x: 940, y: 410 }, data: { duration: 0.5 } },
        ],
        edges: [
          { id: uid(), source: alertTrigger, target: alertCondition },
          { id: uid(), source: alertCondition, target: bigFadeIn, sourceHandle: 'true' },
          { id: uid(), source: bigFadeIn, target: bigContainer },
          { id: uid(), source: alertCondition, target: bigDelay, sourceHandle: 'true' },
          { id: uid(), source: bigDelay, target: bigFadeOut },
          { id: uid(), source: alertCondition, target: smallSlideIn, sourceHandle: 'false' },
          { id: uid(), source: smallSlideIn, target: smallContainer },
          { id: uid(), source: alertCondition, target: smallDelay, sourceHandle: 'false' },
          { id: uid(), source: smallDelay, target: smallFadeOut },
        ],
      },
      [goalAreaId]: {
        nodes: [
          { id: goalInit, type: 'on-event', position: { x: 40, y: 80 }, data: { event: 'init' } },
          { id: goalPersistent, type: 'persistent', position: { x: 300, y: 80 }, data: {} },
          { id: goalFollowTrigger, type: 'on-event', position: { x: 40, y: 220 }, data: { event: 'follow' } },
          { id: goalSetVar, type: 'set-var', position: { x: 300, y: 220 }, data: { variable: 'followers', mode: 'increment', value: 1 } },
        ],
        edges: [
          { id: uid(), source: goalInit, target: goalPersistent },
          { id: uid(), source: goalFollowTrigger, target: goalSetVar },
        ],
      },
      [bannerAreaId]: {
        nodes: [
          { id: bannerTimer, type: 'on-timer', position: { x: 40, y: 100 }, data: { interval: 30 } },
          { id: bannerFadeIn, type: 'fade-in', position: { x: 260, y: 60 }, data: { duration: 0.5 } },
          { id: bannerContainer, type: 'transient', position: { x: 480, y: 60 }, data: { duration: 8 } },
          { id: bannerDelay, type: 'delay', position: { x: 480, y: 200 }, data: { duration: 7 } },
          { id: bannerFadeOut, type: 'fade-out', position: { x: 700, y: 200 }, data: { duration: 0.5 } },
        ],
        edges: [
          { id: uid(), source: bannerTimer, target: bannerFadeIn },
          { id: uid(), source: bannerFadeIn, target: bannerContainer },
          { id: uid(), source: bannerTimer, target: bannerDelay },
          { id: uid(), source: bannerDelay, target: bannerFadeOut },
        ],
      },
    },
    layout: {
      [alertAreaId]: {
        [bigContainer]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
        [smallContainer]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
      },
      [goalAreaId]: {
        [goalPersistent]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
      },
      [bannerAreaId]: {
        [bannerContainer]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
      },
    },
    elements: {
      [bigContainer]: [
        makeElement({ id: uid(), type: 'color', fillColor: '#1a0a2e', effects: { opacity: 0.95, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } } }),
        makeElement({ id: uid(), type: 'text', content: 'HUGE DONATION!', fontSize: 36, fontWeight: 700, textColor: '#fbbf24', effects: { opacity: 1, shadow: { enabled: true, x: 0, y: 0, blur: 12, spread: 0, color: '#f59e0b', opacity: 0.6 }, animation: { enabled: true, name: 'pulse', duration: 0.8, delay: 0, repeat: 0 } } }),
        makeElement({ id: uid(), type: 'text', content: '{$tipper} just donated {$formattedAmount}!', fontSize: 20, fontWeight: 400, textColor: '#e2e8f0' }),
        makeElement({ id: uid(), type: 'text', content: '{$message}', fontSize: 16, textColor: '#94a3b8' }),
      ],
      [smallContainer]: [
        makeElement({ id: uid(), type: 'color', fillColor: '#0f172a', effects: { opacity: 0.9, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } } }),
        makeElement({ id: uid(), type: 'text', content: '{$tipper} donated {$formattedAmount}', fontSize: 22, fontWeight: 500, textColor: '#cbd5e1' }),
      ],
      [goalPersistent]: [
        makeElement({ id: uid(), type: 'color', fillColor: '#064e3b', effects: { opacity: 0.8, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } } }),
        makeElement({ id: uid(), type: 'text', content: 'Follower Goal: {$followers} / 100', fontSize: 18, fontWeight: 600, textColor: '#4ade80' }),
      ],
      [bannerContainer]: [
        makeElement({ id: uid(), type: 'color', fillColor: '#0c4a6e', effects: { opacity: 0.85, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } } }),
        makeElement({ id: uid(), type: 'text', content: 'Thanks for watching! Follow for more content.', fontSize: 18, fontWeight: 500, textColor: '#7dd3fc' }),
      ],
    },
  }
}

export const PRESETS: Preset[] = [
  {
    id: 'donation-alert',
    name: 'Donation Alert',
    description: 'Fades in a thank-you message when a donation is received, then fades out after a few seconds.',
    build() {
      const areaId = uid()
      const trigger = uid()
      const fadeIn = uid()
      const container = uid()
      const delay = uid()
      const fadeOut = uid()

      return {
        areas: [
          { id: areaId, name: 'Donation Alert', x: 30, y: 35, width: 40, height: 15, color: '#f59e0b' },
        ],
        graphs: {
          [areaId]: {
            nodes: [
              { id: trigger, type: 'on-event', position: { x: 40, y: 100 }, data: { event: 'donation' } },
              { id: fadeIn, type: 'fade-in', position: { x: 260, y: 60 }, data: { duration: 0.5 } },
              { id: container, type: 'transient', position: { x: 480, y: 60 }, data: { duration: 5 } },
              { id: delay, type: 'delay', position: { x: 480, y: 200 }, data: { duration: 4 } },
              { id: fadeOut, type: 'fade-out', position: { x: 700, y: 200 }, data: { duration: 0.5 } },
            ],
            edges: [
              { id: uid(), source: trigger, target: fadeIn },
              { id: uid(), source: fadeIn, target: container },
              { id: uid(), source: trigger, target: delay },
              { id: uid(), source: delay, target: fadeOut },
            ],
          },
        },
        layout: {
          [areaId]: {
            [container]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
          },
        },
        elements: {
          [container]: [
            makeElement({
              id: uid(),
              type: 'color',
              fillColor: '#1a1a2e',
              effects: { opacity: 0.9, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } },
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: 'Thanks {$tipper}! 🎉',
              fontSize: 28,
              fontWeight: 600,
              textColor: '#f59e0b',
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: '{$formattedAmount}',
              fontSize: 22,
              textColor: '#ffffff',
            }),
          ],
        },
      }
    },
  },
  {
    id: 'follow-notification',
    name: 'Follow Notification',
    description: 'Slides in a welcome banner when someone follows, then fades out.',
    build() {
      const areaId = uid()
      const trigger = uid()
      const slideIn = uid()
      const container = uid()
      const delay = uid()
      const fadeOut = uid()

      return {
        areas: [
          { id: areaId, name: 'Follow Banner', x: 25, y: 80, width: 50, height: 10, color: '#22c55e' },
        ],
        graphs: {
          [areaId]: {
            nodes: [
              { id: trigger, type: 'on-event', position: { x: 40, y: 100 }, data: { event: 'follow' } },
              { id: slideIn, type: 'slide-in', position: { x: 260, y: 60 }, data: { duration: 0.4, direction: 'bottom' } },
              { id: container, type: 'transient', position: { x: 480, y: 60 }, data: { duration: 4 } },
              { id: delay, type: 'delay', position: { x: 480, y: 200 }, data: { duration: 3 } },
              { id: fadeOut, type: 'fade-out', position: { x: 700, y: 200 }, data: { duration: 0.5 } },
            ],
            edges: [
              { id: uid(), source: trigger, target: slideIn },
              { id: uid(), source: slideIn, target: container },
              { id: uid(), source: trigger, target: delay },
              { id: uid(), source: delay, target: fadeOut },
            ],
          },
        },
        layout: {
          [areaId]: {
            [container]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
          },
        },
        elements: {
          [container]: [
            makeElement({
              id: uid(),
              type: 'color',
              fillColor: '#064e3b',
              effects: { opacity: 0.85, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } },
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: 'Welcome {$username}! 👋',
              fontSize: 24,
              fontWeight: 600,
              textColor: '#4ade80',
            }),
          ],
        },
      }
    },
  },
  {
    id: 'big-donation-alert',
    name: 'Big Donation Alert',
    description: 'A conditional alert that shows a special animation for donations over $50, and a standard message for smaller ones.',
    build() {
      const areaId = uid()
      const trigger = uid()
      const condition = uid()
      const fadeInBig = uid()
      const containerBig = uid()
      const fadeInSmall = uid()
      const containerSmall = uid()
      const delayBig = uid()
      const fadeOutBig = uid()
      const delaySmall = uid()
      const fadeOutSmall = uid()

      return {
        areas: [
          { id: areaId, name: 'Donation Tier', x: 25, y: 25, width: 50, height: 20, color: '#8b5cf6' },
        ],
        graphs: {
          [areaId]: {
            nodes: [
              { id: trigger, type: 'on-event', position: { x: 40, y: 140 }, data: { event: 'donation' } },
              { id: condition, type: 'condition', position: { x: 260, y: 120 }, data: { operator: '>=', value: 50 } },
              { id: fadeInBig, type: 'fade-in', position: { x: 500, y: 40 }, data: { duration: 0.3 } },
              { id: containerBig, type: 'transient', position: { x: 720, y: 40 }, data: { duration: 8 } },
              { id: delayBig, type: 'delay', position: { x: 720, y: 170 }, data: { duration: 7 } },
              { id: fadeOutBig, type: 'fade-out', position: { x: 940, y: 170 }, data: { duration: 0.5 } },
              { id: fadeInSmall, type: 'fade-in', position: { x: 500, y: 280 }, data: { duration: 0.5 } },
              { id: containerSmall, type: 'transient', position: { x: 720, y: 280 }, data: { duration: 4 } },
              { id: delaySmall, type: 'delay', position: { x: 720, y: 410 }, data: { duration: 3 } },
              { id: fadeOutSmall, type: 'fade-out', position: { x: 940, y: 410 }, data: { duration: 0.5 } },
            ],
            edges: [
              { id: uid(), source: trigger, target: condition },
              { id: uid(), source: condition, target: fadeInBig, sourceHandle: 'true' },
              { id: uid(), source: fadeInBig, target: containerBig },
              { id: uid(), source: condition, target: delayBig, sourceHandle: 'true' },
              { id: uid(), source: delayBig, target: fadeOutBig },
              { id: uid(), source: condition, target: fadeInSmall, sourceHandle: 'false' },
              { id: uid(), source: fadeInSmall, target: containerSmall },
              { id: uid(), source: condition, target: delaySmall, sourceHandle: 'false' },
              { id: uid(), source: delaySmall, target: fadeOutSmall },
            ],
          },
        },
        layout: {
          [areaId]: {
            [containerBig]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
            [containerSmall]: { x: 0, y: 0, w: 100, h: 100, z: 0 },
          },
        },
        elements: {
          [containerBig]: [
            makeElement({
              id: uid(),
              type: 'color',
              fillColor: '#4c1d95',
              effects: { opacity: 0.95, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } },
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: 'HUGE DONATION! 🔥',
              fontSize: 32,
              fontWeight: 700,
              textColor: '#f59e0b',
              effects: { opacity: 1, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: true, name: 'pulse', duration: 1, delay: 0, repeat: 3 } },
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: '{$tipper} donated {$formattedAmount}!',
              fontSize: 22,
              textColor: '#e2e8f0',
            }),
          ],
          [containerSmall]: [
            makeElement({
              id: uid(),
              type: 'color',
              fillColor: '#1e293b',
              effects: { opacity: 0.9, shadow: { enabled: false, x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.5 }, animation: { enabled: false, name: 'bounce', duration: 1, delay: 0, repeat: 1 } },
            }),
            makeElement({
              id: uid(),
              type: 'text',
              content: 'Thanks {$tipper}! {$formattedAmount}',
              fontSize: 22,
              fontWeight: 500,
              textColor: '#94a3b8',
            }),
          ],
        },
      }
    },
  },
]
