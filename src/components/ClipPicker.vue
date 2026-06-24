<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { searchClips, trendingClips, type KlipyClip } from '@/services/klipy'

const emit = defineEmits<{ select: [url: string] }>()

const query = ref('')
const clips = ref<KlipyClip[]>([])
const loading = ref(false)
const page = ref(1)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  const results = query.value.trim()
    ? await searchClips(query.value.trim(), page.value)
    : await trendingClips(page.value)
  clips.value = page.value === 1 ? results : [...clips.value, ...results]
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

function select(clip: KlipyClip) {
  emit('select', clip.url)
}

onMounted(load)
</script>

<template>
  <div class="clip-picker">
    <input
      v-model="query"
      type="text"
      class="clip-search"
      placeholder="Search KLIPY"
    />
    <div class="clip-grid" @scroll="(e) => { const t = e.target as HTMLElement; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 40 && !loading) loadMore() }">
      <div
        v-for="clip in clips"
        :key="clip.id"
        class="clip-item"
        :title="clip.title"
        @click="select(clip)"
      >
        <img :src="clip.preview_url" :alt="clip.title" loading="lazy" />
      </div>
      <div v-if="loading" class="clip-loading">Loading...</div>
      <div v-else-if="!clips.length" class="clip-empty">No clips found</div>
    </div>
    <div class="clip-powered">
      <img src="/Powered-by-KLIPY-white.svg" alt="Powered by KLIPY" class="powered-logo" />
    </div>
  </div>
</template>

<style scoped>
.clip-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clip-search {
  background: var(--surface-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
  width: 100%;
}
.clip-search:focus { border-color: var(--accent); }

.clip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  border-radius: var(--radius-sm);
}

.clip-item {
  cursor: pointer;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 120ms ease;
  aspect-ratio: 16 / 9;
  min-height: 0;
}
.clip-item:hover { border-color: var(--accent); }

.clip-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.clip-loading,
.clip-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-faint);
  font-size: 12px;
  padding: 12px;
}

.clip-powered {
  text-align: right;
  padding-top: 2px;
  padding-right: 12px;
}
.powered-logo {
  height: 12px;
  opacity: 0.35;
}
</style>
