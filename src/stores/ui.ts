import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ElementType } from '@/types'

export const useUiStore = defineStore('ui', () => {
  const selectedNodeId = ref<string | null>(null)
  const selectedNodeType = ref<string | null>(null)
  const selectedLayoutItemId = ref<string | null>(null)
  const hoveredLayoutItemId = ref<string | null>(null)
  const draggingElementType = ref<ElementType | null>(null)

  const nudgeDrawTool = ref(false)
  const showPaletteTooltip = ref(false)

  function selectNode(id: string | null, type: string | null) {
    selectedNodeId.value = id
    selectedNodeType.value = type
    selectedLayoutItemId.value = null
  }

  function selectLayoutItem(id: string | null) {
    selectedLayoutItemId.value = id
  }

  function hoverLayoutItem(id: string | null) {
    hoveredLayoutItemId.value = id
  }

  function setDraggingElementType(type: ElementType | null) {
    draggingElementType.value = type
  }

  return {
    selectedNodeId, selectedNodeType, selectedLayoutItemId,
    hoveredLayoutItemId, draggingElementType,
    nudgeDrawTool, showPaletteTooltip,
    selectNode, selectLayoutItem, hoverLayoutItem, setDraggingElementType,
  }
})
