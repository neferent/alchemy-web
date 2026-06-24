<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { searchStickers, trendingStickers, type KlipySticker } from '@/services/klipy'

const emit = defineEmits<{ select: [url: string] }>()

const query = ref('')
const stickers = ref<KlipySticker[]>([])
const loading = ref(false)
const page = ref(1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  const results = query.value.trim()
    ? await searchStickers(query.value.trim(), page.value)
    : await trendingStickers(page.value)
  stickers.value = page.value === 1 ? results : [...stickers.value, ...results]
  loading.value = false
}

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})

function loadMore() {
  page.value++
  load()
}

function select(sticker: KlipySticker) {
  emit('select', sticker.url)
}

onMounted(load)
</script>

<template>
  <div class="sticker-picker">
    <input
      v-model="query"
      type="text"
      class="sticker-search"
      placeholder="Search KLIPY"
    />
    <div class="sticker-grid" @scroll="(e) => { const t = e.target as HTMLElement; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 40 && !loading) loadMore() }">
      <div
        v-for="sticker in stickers"
        :key="sticker.id"
        class="sticker-item"
        :title="sticker.title"
        @click="select(sticker)"
      >
        <img :src="sticker.preview_url" :alt="sticker.title" loading="lazy" />
      </div>
      <div v-if="loading" class="sticker-loading">Loading...</div>
      <div v-else-if="!stickers.length" class="sticker-empty">No stickers found</div>
    </div>
    <div class="sticker-powered">
      <img src="/Powered-by-KLIPY-white.svg" alt="Powered by KLIPY" class="powered-logo" />
    </div>
  </div>
</template>

<style scoped>
.sticker-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sticker-search {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
  width: 100%;
}
.sticker-search:focus { border-color: var(--accent); }

.sticker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  border-radius: var(--radius-sm);
}

.sticker-item {
  cursor: pointer;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 120ms ease;
  aspect-ratio: 1 / 1;
  min-height: 0;
}
.sticker-item:hover { border-color: var(--accent); }

.sticker-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.sticker-loading,
.sticker-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-faint);
  font-size: 12px;
  padding: 12px;
}

.sticker-powered {
  text-align: right;
  padding-top: 2px;
  padding-right: 12px;
}
.powered-logo {
  height: 12px;
  opacity: 0.35;
}
</style>
