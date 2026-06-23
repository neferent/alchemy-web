<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { NODE_TYPES, NODE_CATEGORY_COLORS } from '@/types'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  close: []
  select: [type: string]
}>()

const search = ref('')
const activeIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return NODE_TYPES
  return NODE_TYPES.filter(n =>
    n.label.toLowerCase().includes(q) || n.category.includes(q) || n.type.includes(q)
  )
})

watch(() => props.visible, (v) => {
  if (v) {
    search.value = ''
    activeIndex.value = 0
    nextTick(() => searchInput.value?.focus())
  }
})

watch(filtered, () => {
  activeIndex.value = 0
})

function select(type: string) {
  emit('select', type)
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1) }
  if (e.key === 'ArrowUp')   { e.preventDefault(); activeIndex.value = Math.max(activeIndex.value - 1, 0) }
  if (e.key === 'Enter' && filtered.value[activeIndex.value]) {
    select(filtered.value[activeIndex.value].type)
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="ctx-backdrop" @mousedown.self="emit('close')" />
    <div
      v-if="visible"
      class="ctx-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <div class="ctx-search-wrap">
        <i class="icon-search ctx-search-icon" />
        <input
          ref="searchInput"
          v-model="search"
          class="ctx-search"
          placeholder="Search nodes…"
          @keydown="onKey"
        />
      </div>
      <div class="ctx-list">
        <div
          v-for="(node, i) in filtered"
          :key="node.type"
          class="ctx-item"
          :class="{ active: i === activeIndex }"
          :style="{ '--cat-color': NODE_CATEGORY_COLORS[node.category] }"
          @mousedown.prevent="select(node.type)"
          @mousemove="activeIndex = i"
        >
          <i :class="node.icon" class="ctx-item-icon" />
          <span class="ctx-item-label">{{ node.label }}</span>
          <span class="ctx-item-cat">{{ node.category }}</span>
        </div>
        <div v-if="filtered.length === 0" class="ctx-empty">No nodes match</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.ctx-menu {
  position: fixed;
  z-index: 1000;
  width: 220px;
  background: #1e2d35;
  border: 1px solid #3a474f;
  border-radius: 8px;
  box-shadow: 0 8px 24px #00000070;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ctx-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid #3a474f;
}

.ctx-search-icon {
  color: #4F5E65;
  font-size: 13px;
  flex-shrink: 0;
}

.ctx-search {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 12px;
  font-family: inherit;
}

.ctx-search::placeholder {
  color: #4F5E65;
}

.ctx-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 4px 0;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
  border-left: 2px solid transparent;
}

.ctx-item.active {
  background: #2B383F;
  border-left-color: var(--cat-color);
}

.ctx-item-icon {
  font-size: 13px;
  color: var(--cat-color);
  width: 16px;
  flex-shrink: 0;
  text-align: center;
}

.ctx-item-label {
  font-size: 12px;
  color: var(--text);
  flex: 1;
}

.ctx-item-cat {
  font-size: 9px;
  color: #4F5E65;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ctx-empty {
  padding: 12px 10px;
  font-size: 11px;
  color: #4F5E65;
  text-align: center;
}
</style>
