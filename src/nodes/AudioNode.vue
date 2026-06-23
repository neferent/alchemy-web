<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { sanitizeUrl } from '@/utils/sanitize'

const props = defineProps<{ data: { src: string; volume: number } }>()

const src = computed({
  get: () => props.data.src,
  set: (val: string) => { props.data.src = sanitizeUrl(val) },
})
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-audio" title="Audio" category="lifecycle">
    <div class="node-field">
      <span class="node-label">Source URL / Path</span>
      <input v-model="src" type="text" placeholder="https://... or /path/to/audio" class="node-input" />
    </div>
    <div class="node-field">
      <span class="node-label">Volume ({{ Math.round(props.data.volume * 100) }}%)</span>
      <input v-model.number="props.data.volume" type="range" min="0" max="1" step="0.05" class="node-slider" />
    </div>
  </BaseNode>
  <Handle id="out" type="source" :position="Position.Right" />
</template>

<style scoped>
.node-slider {
  width: 100%;
  accent-color: #22c55e;
}
</style>
