<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
  inputClass?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const query = ref(props.modelValue ?? '')
const open = ref(false)
const listRef = ref<HTMLUListElement | null>(null)
const activeIndex = ref(-1)

watch(() => props.modelValue, (v) => { query.value = v })

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.toLowerCase().includes(q))
})

function commit(value: string) {
  emit('update:modelValue', value)
  query.value = value
  open.value = false
  activeIndex.value = -1
}

function onInput() {
  open.value = true
  activeIndex.value = -1
}

function onFocus() {
  open.value = true
}

function onBlur() {
  setTimeout(() => {
    open.value = false
    // restore to last committed value if query doesn't match an option exactly
    const exact = props.options.find((o) => o.toLowerCase() === query.value.trim().toLowerCase())
    if (exact) {
      commit(exact)
    } else if (query.value.trim()) {
      // allow custom value (free-form Google Font name)
      commit(query.value.trim())
    } else {
      query.value = props.modelValue
    }
  }, 150)
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) { open.value = true; return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
    scrollActive()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActive()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIndex.value >= 0 && filtered.value[activeIndex.value]) {
      commit(filtered.value[activeIndex.value])
    } else if (query.value.trim()) {
      commit(query.value.trim())
    }
  } else if (e.key === 'Escape') {
    open.value = false
    query.value = props.modelValue
  }
}

async function scrollActive() {
  await nextTick()
  const item = listRef.value?.children[activeIndex.value] as HTMLElement | undefined
  item?.scrollIntoView({ block: 'nearest' })
}
</script>

<template>
  <div class="ss-wrap">
    <input
      v-model="query"
      type="text"
      :class="['ss-input', inputClass ?? 'node-input']"
      :placeholder="placeholder ?? 'Search…'"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <ul v-if="open && filtered.length" ref="listRef" class="ss-list" @mousedown.prevent>
      <li
        v-for="(opt, i) in filtered"
        :key="opt"
        class="ss-item"
        :class="{ 'ss-item--active': i === activeIndex }"
        @mousedown.prevent="commit(opt)"
      >
        {{ opt }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ss-wrap {
  position: relative;
  width: 100%;
}
.ss-input {
  width: 100%;
}
.ss-list {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  max-height: 160px;
  overflow-y: auto;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 3px;
  z-index: 9999;
  list-style: none;
  margin: 0;
  padding: 2px 0;
}
.ss-item {
  padding: 5px 8px;
  font-size: 11px;
  color: #ccc;
  cursor: pointer;
}
.ss-item:hover,
.ss-item--active {
  background: #2a2a2a;
  color: #fff;
}
</style>
