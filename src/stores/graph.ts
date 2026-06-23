import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'

interface AreaGraph {
  nodes: Node[]
  edges: Edge[]
}

export const useGraphStore = defineStore('graph', () => {
  const graphs = ref<Record<string, AreaGraph>>({})

  function getGraph(areaId: string): AreaGraph {
    if (!graphs.value[areaId]) {
      graphs.value[areaId] = { nodes: [], edges: [] }
    }
    return graphs.value[areaId]
  }

  function saveGraph(areaId: string, nodes: Node[], edges: Edge[]) {
    graphs.value[areaId] = {
      nodes: nodes.map((n) => ({ ...n })),
      edges: edges.map((e) => ({ ...e }))
    }
  }

  function initGraph(areaId: string) {
    if (graphs.value[areaId]) return
    graphs.value[areaId] = {
      nodes: [
        {
          id: 'trigger-1',
          type: 'on-event',
          position: { x: 60, y: 120 },
          data: { event: 'donation' }
        }
      ],
      edges: []
    }
  }

  function removeGraph(areaId: string) {
    delete graphs.value[areaId]
  }

  return { graphs, getGraph, saveGraph, initGraph, removeGraph }
})
