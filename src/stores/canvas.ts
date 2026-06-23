import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Area } from '@/types'

const AREA_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#f43f5e']

export const useCanvasStore = defineStore('canvas', () => {
  const areas = ref<Area[]>([])
  const selectedAreaId = ref<string | null>(null)

  const selectedArea = computed(() => areas.value.find((a) => a.id === selectedAreaId.value) ?? null)

  function addArea(partial: Omit<Area, 'id' | 'color'>): Area {
    const color = AREA_COLORS[areas.value.length % AREA_COLORS.length]
    const area: Area = { ...partial, id: uuidv4(), color }
    areas.value.push(area)
    return area
  }

  function updateArea(id: string, patch: Partial<Omit<Area, 'id'>>) {
    const area = areas.value.find((a) => a.id === id)
    if (area) Object.assign(area, patch)
  }

  function removeArea(id: string) {
    areas.value = areas.value.filter((a) => a.id !== id)
    if (selectedAreaId.value === id) selectedAreaId.value = null
  }

  function selectArea(id: string | null) {
    selectedAreaId.value = id
  }

  return { areas, selectedAreaId, selectedArea, addArea, updateArea, removeArea, selectArea }
})
