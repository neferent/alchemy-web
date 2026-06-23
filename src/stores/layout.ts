import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ItemLayout {
  x: number  // % of parent width
  y: number  // % of parent height
  w: number  // % of parent width
  h: number  // % of parent height
  z: number  // layer order 0–9 (higher = on top)
}

export const useLayoutStore = defineStore('layout', () => {
  // layout[parentId][nodeId] — parentId is areaId or containerId
  const layout = ref<Record<string, Record<string, ItemLayout>>>({})

  function getLayout(parentId: string, nodeId: string, nodeType?: string): ItemLayout {
    const stored = layout.value[parentId]?.[nodeId]
    if (stored) return stored
    const fill = nodeType === 'container'
    return { x: 0, y: 0, w: fill ? 100 : 50, h: fill ? 100 : 50, z: 0 }
  }

  function setLayout(parentId: string, nodeId: string, pos: ItemLayout) {
    if (!layout.value[parentId]) layout.value[parentId] = {}
    layout.value[parentId][nodeId] = { ...pos }
  }

  return { layout, getLayout, setLayout }
})
