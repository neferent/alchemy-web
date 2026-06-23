import { describe, it, expect } from 'vitest'
import { executeGraph, executeGraphFromTrigger } from './executor'
import type { Node, Edge } from '@vue-flow/core'
import type { ElementData } from '@/types'

function node(id: string, type: string, data: Record<string, unknown> = {}): Node {
  return { id, type, position: { x: 0, y: 0 }, data } as Node
}

function edge(source: string, target: string, sourceHandle?: string, targetHandle?: string): Edge {
  return { id: `${source}-${target}`, source, target, sourceHandle: sourceHandle ?? null, targetHandle: targetHandle ?? null } as Edge
}

function stubElement(id = 'el-1'): ElementData {
  return {
    id, type: 'text', src: '', autoplay: true, loop: false, muted: false, volume: 1,
    content: 'hi', fontSize: 24, fontFamily: 'sans-serif', fontWeight: 400,
    textColor: '#fff', fillColor: '#000',
    effects: { opacity: 1, shadow: { enabled: false, x: 0, y: 0, blur: 0, spread: 0, color: '#000', opacity: 0 }, animation: { enabled: false, name: '', duration: 0, delay: 0, repeat: 0 } },
  }
}

function elementsFor(nodeId: string): Record<string, ElementData[]> {
  return { [nodeId]: [stubElement()] }
}

describe('executeGraph', () => {
  it('returns null scene when no matching trigger exists', () => {
    const nodes = [node('t1', 'on-event', { event: 'donation' })]
    const result = executeGraph('a1', nodes, [], 'follow')
    expect(result.scene).toBeNull()
  })

  it('walks trigger → fade-in → transient and produces a scene', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('fi', 'fade-in', { duration: 0.5 }),
      node('tr', 'transient', { duration: 3 }),
    ]
    const edges = [edge('t1', 'fi'), edge('fi', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'donation', {}, elementsFor('tr'))

    expect(result.scene).not.toBeNull()
    expect(result.scene!.areaId).toBe('a1')
    expect(result.scene!.transitionIn).toEqual({ type: 'fade', duration: 0.5 })
    expect(result.scene!.lifecycleDuration).toBe(3)
  })

  it('walks trigger → fade-in → persistent (null duration)', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('fi', 'fade-in', { duration: 1 }),
      node('p', 'persistent', {}),
    ]
    const edges = [edge('t1', 'fi'), edge('fi', 'p')]
    const result = executeGraph('a1', nodes, edges, 'donation', {}, elementsFor('p'))

    expect(result.scene).not.toBeNull()
    expect(result.scene!.lifecycleDuration).toBeNull()
  })

  it('resolves fade-out transition', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'follow' }),
      node('fo', 'fade-out', { duration: 0.8 }),
      node('tr', 'transient', { duration: 2 }),
    ]
    const edges = [edge('t1', 'fo'), edge('fo', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'follow', {}, elementsFor('tr'))

    expect(result.scene!.transitionOut).toEqual({ type: 'fade', duration: 0.8 })
  })

  it('resolves slide-in transition', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'follow' }),
      node('si', 'slide-in', { duration: 0.4, direction: 'left' }),
      node('tr', 'transient', { duration: 2 }),
    ]
    const edges = [edge('t1', 'si'), edge('si', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'follow', {}, elementsFor('tr'))

    expect(result.scene!.transitionIn).toEqual({ type: 'slide', duration: 0.4, direction: 'left' })
  })

  it('accumulates delay from delay nodes', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('d1', 'delay', { duration: 2 }),
      node('d2', 'delay', { duration: 1.5 }),
      node('tr', 'transient', { duration: 5 }),
    ]
    const edges = [edge('t1', 'd1'), edge('d1', 'd2'), edge('d2', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'donation')

    expect(result.delayMs).toBe(3500)
  })

  it('collects audio commands', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('au', 'audio', { src: 'https://example.com/ding.mp3', volume: 0.8 }),
      node('tr', 'transient', { duration: 2 }),
    ]
    const edges = [edge('t1', 'au'), edge('au', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'donation')

    expect(result.audio).toEqual([{ src: 'https://example.com/ding.mp3', volume: 0.8 }])
  })

  it('skips audio with empty src', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('au', 'audio', { src: '', volume: 1 }),
      node('tr', 'transient', { duration: 2 }),
    ]
    const edges = [edge('t1', 'au'), edge('au', 'tr')]
    const result = executeGraph('a1', nodes, edges, 'donation')

    expect(result.audio).toEqual([])
  })
})

describe('logic nodes', () => {
  it('set-var stores a value accessible to later interpolation', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('sv', 'set-var', { variable: 'myVar', value: 'hello' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'sv'), edge('sv', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars.myVar).toBe('hello')
  })

  it('set-var does not overwrite reserved variables', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('sv', 'set-var', { variable: 'amount', value: '999' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'sv'), edge('sv', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars.amount).toBeUndefined()
  })

  it('reset-var deletes a variable', () => {
    const vars: Record<string, unknown> = { myVar: 'hello' }
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('rv', 'reset-var', { variable: 'myVar' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'rv'), edge('rv', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars.myVar).toBeUndefined()
  })

  it('math node computes and stores result', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('m1', 'math', { a: '10', b: '3', operator: '+' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'm1'), edge('m1', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$mathResult_m1']).toBe(13)
  })

  it('math node handles division by zero', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('m1', 'math', { a: '10', b: '0', operator: '/' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'm1'), edge('m1', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$mathResult_m1']).toBe(0)
  })

  it('condition node branches on true', () => {
    const els = { trT: [stubElement()], trF: [stubElement('el-2')] }
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('c1', 'condition', { operator: '>=', value: 5 }),
      node('trT', 'transient', { duration: 1 }),
      node('trF', 'transient', { duration: 2 }),
    ]
    const edges = [
      edge('t1', 'c1'),
      edge('c1', 'trT', 'true'),
      edge('c1', 'trF', 'false'),
    ]
    const result = executeGraph('a1', nodes, edges, 'donation', {}, els, { amount: 10 })

    expect(result.scene).not.toBeNull()
    expect(result.scene!.lifecycleDuration).toBe(1)
  })

  it('condition node branches on false', () => {
    const els = { trT: [stubElement()], trF: [stubElement('el-2')] }
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('c1', 'condition', { operator: '>=', value: 5 }),
      node('trT', 'transient', { duration: 1 }),
      node('trF', 'transient', { duration: 2 }),
    ]
    const edges = [
      edge('t1', 'c1'),
      edge('c1', 'trT', 'true'),
      edge('c1', 'trF', 'false'),
    ]
    const result = executeGraph('a1', nodes, edges, 'donation', {}, els, { amount: 2 })

    expect(result.scene).not.toBeNull()
    expect(result.scene!.lifecycleDuration).toBe(2)
  })

  it('compare node branches correctly', () => {
    const els = { trT: [stubElement()], trF: [stubElement('el-2')] }
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('cmp', 'compare', { a: '10', b: '5', operator: '>' }),
      node('trT', 'transient', { duration: 1 }),
      node('trF', 'transient', { duration: 2 }),
    ]
    const edges = [
      edge('t1', 'cmp'),
      edge('cmp', 'trT', 'true'),
      edge('cmp', 'trF', 'false'),
    ]
    const result = executeGraph('a1', nodes, edges, 'donation', {}, els)

    expect(result.scene!.lifecycleDuration).toBe(1)
  })

  it('clamp node stores clamped result', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('cl', 'clamp', { value: '15', min: '0', max: '10' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'cl'), edge('cl', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$clampResult_cl']).toBe(10)
  })

  it('to-number converts string to number', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('tn', 'to-number', { value: '42.5' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'tn'), edge('tn', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$toNumberResult_tn']).toBe(42.5)
  })

  it('to-string converts number with decimals', () => {
    const vars: Record<string, unknown> = {}
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('ts', 'to-string', { value: '3.14159', decimals: 2 }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'ts'), edge('ts', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$toStringResult_ts']).toBe('3.14')
  })

  it('str-format interpolates variables', () => {
    const vars: Record<string, unknown> = { name: 'World' }
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('sf', 'str-format', { template: 'Hello {$name}!' }),
      node('tr', 'transient', { duration: 1 }),
    ]
    const edges = [edge('t1', 'sf'), edge('sf', 'tr')]
    executeGraph('a1', nodes, edges, 'donation', {}, {}, {}, vars)

    expect(vars['$strFormatResult_sf']).toBe('Hello World!')
  })
})

describe('executeGraphFromTrigger', () => {
  it('executes from a specific trigger node id', () => {
    const nodes = [
      node('timer1', 'on-timer', { interval: 60 }),
      node('tr', 'transient', { duration: 5 }),
    ]
    const edges = [edge('timer1', 'tr')]
    const result = executeGraphFromTrigger('a1', nodes, edges, 'timer1', {}, elementsFor('tr'))

    expect(result.scene).not.toBeNull()
    expect(result.scene!.lifecycleDuration).toBe(5)
  })

  it('returns null when trigger node id not found', () => {
    const result = executeGraphFromTrigger('a1', [], [], 'nonexistent')
    expect(result.scene).toBeNull()
  })
})

describe('cycle detection', () => {
  it('does not infinite loop on graph cycles', () => {
    const nodes = [
      node('t1', 'on-event', { event: 'donation' }),
      node('d1', 'delay', { duration: 1 }),
      node('d2', 'delay', { duration: 1 }),
    ]
    const edges = [edge('t1', 'd1'), edge('d1', 'd2'), edge('d2', 'd1')]
    const result = executeGraph('a1', nodes, edges, 'donation')

    expect(result.scene).toBeNull()
    expect(result.delayMs).toBeGreaterThan(0)
  })
})
