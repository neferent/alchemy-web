import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultElement } from '@/types'
import type { ElementData, ElementType } from '@/types'

export const useElementsStore = defineStore('elements', () => {
  // Keyed by nodeId (transient / persistent / container node IDs)
  const elements = ref<Record<string, ElementData[]>>({})

  function getElements(nodeId: string): ElementData[] {
    return elements.value[nodeId] ?? []
  }

  function setElements(nodeId: string, elems: ElementData[]) {
    elements.value[nodeId] = elems
  }

  function addElement(nodeId: string, type: ElementType): ElementData {
    const el = defaultElement(type)
    if (!elements.value[nodeId]) elements.value[nodeId] = []
    elements.value[nodeId].push(el)
    return el
  }

  function removeElement(nodeId: string, elementId: string) {
    if (!elements.value[nodeId]) return
    elements.value[nodeId] = elements.value[nodeId].filter(e => e.id !== elementId)
  }

  function updateElement(nodeId: string, elementId: string, patch: Partial<ElementData>) {
    const els = elements.value[nodeId]
    if (!els) return
    const idx = els.findIndex(e => e.id === elementId)
    if (idx >= 0) Object.assign(els[idx], patch)
  }

  function reorderElements(nodeId: string, fromIdx: number, toIdx: number) {
    const els = elements.value[nodeId]
    if (!els || fromIdx === toIdx) return
    const [moved] = els.splice(fromIdx, 1)
    els.splice(toIdx, 0, moved)
  }

  function removeNodeElements(nodeId: string) {
    delete elements.value[nodeId]
  }

  return { elements, getElements, setElements, addElement, removeElement, updateElement, reorderElements, removeNodeElements }
})
