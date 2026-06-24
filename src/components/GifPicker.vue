<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { searchGifs, trendingGifs, type KlipyGif } from '@/services/klipy'

const emit = defineEmits<{ select: [url: string] }>()

const query = ref('')
const gifs = ref<KlipyGif[]>([])
const loading = ref(false)
const page = ref(1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  const results = query.value.trim()
    ? await searchGifs(query.value.trim(), page.value)
    : await trendingGifs(page.value)
  gifs.value = page.value === 1 ? results : [...gifs.value, ...results]
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

function select(gif: KlipyGif) {
  emit('select', gif.url)
}

onMounted(load)
</script>

<template>
  <div class="gif-picker">
    <input
      v-model="query"
      type="text"
      class="gif-search"
      placeholder="Search KLIPY"
    />
    <div class="gif-grid" @scroll="(e) => { const t = e.target as HTMLElement; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 40 && !loading) loadMore() }">
      <div
        v-for="gif in gifs"
        :key="gif.id"
        class="gif-item"
        :title="gif.title"
        @click="select(gif)"
      >
        <img :src="gif.preview_url" :alt="gif.title" loading="lazy" />
      </div>
      <div v-if="loading" class="gif-loading">Loading...</div>
      <div v-else-if="!gifs.length" class="gif-empty">No GIFs found</div>
    </div>
    <div class="gif-powered">
      <img src="/Powered-by-KLIPY-white.svg" alt="Powered by KLIPY" class="powered-logo" />
    </div>
  </div>
</template>

<style scoped>
.gif-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gif-search {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
  width: 100%;
}
.gif-search:focus { border-color: var(--accent); }

.gif-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  border-radius: var(--radius-sm);
}

.gif-item {
  cursor: pointer;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 120ms ease;
  aspect-ratio: 16 / 9;
  min-height: 0;
}
.gif-item:hover { border-color: var(--accent); }

.gif-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gif-loading,
.gif-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-faint);
  font-size: 12px;
  padding: 12px;
}

.gif-powered {
  text-align: right;
  padding-top: 2px;
  padding-right: 12px;
}
.powered-logo {
  height: 12px;
  opacity: 0.35;
}
</style>
