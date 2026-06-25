<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useCanvasStore } from '@/stores/canvas'
import { useGraphStore } from '@/stores/graph'
import { useLayoutStore } from '@/stores/layout'
import { useElementsStore } from '@/stores/elements'
import { generateHTML, generateCSS, generateJS } from '@/exporter/generateWidget'

defineEmits<{ close: [] }>()

const canvasStore = useCanvasStore()
const graphStore = useGraphStore()
const layoutStore = useLayoutStore()
const elementsStore = useElementsStore()

const activeTab = ref<'html' | 'css' | 'js'>('html')
const copied = ref<string | null>(null)
const error = ref<string | null>(null)

function safeGenerate<T>(fn: () => T, fallback: T): T {
  try { return fn() }
  catch (e) { error.value = e instanceof Error ? e.message : 'Export generation failed'; return fallback }
}

const html = computed(() => safeGenerate(() => generateHTML(canvasStore.areas), ''))
const css = computed(() => safeGenerate(() => generateCSS(), ''))
const js = computed(() =>
  safeGenerate(() => generateJS(
    canvasStore.areas,
    Object.fromEntries(
      canvasStore.areas.map((a) => [a.id, graphStore.getGraph(a.id)]),
    ),
    layoutStore.layout,
    elementsStore.elements,
  ), ''),
)

const tabs = [
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'js', label: 'JavaScript' },
] as const

const activeCode = computed(() => {
  if (activeTab.value === 'html') return html.value
  if (activeTab.value === 'css') return css.value
  return js.value
})

async function copy(tab: 'html' | 'css' | 'js') {
  const code = tab === 'html' ? html.value : tab === 'css' ? css.value : js.value
  await navigator.clipboard.writeText(code)
  copied.value = tab
  setTimeout(() => { copied.value = null }, 1800)
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Export to Streamlabs Custom Widget</span>
        <button class="close-btn" @click="$emit('close')"><X :size="14" /></button>
      </div>

      <p v-if="error" class="modal-error">{{ error }}</p>

      <p class="modal-hint">
        In Streamlabs, add a <strong>Custom Widget</strong> source and paste each section into
        the corresponding field.
      </p>

      <div class="tab-row">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab-btn"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
        <button
          class="copy-btn"
          :class="{ done: copied === activeTab }"
          @click="copy(activeTab)"
        >
          {{ copied === activeTab ? 'Copied!' : 'Copy' }}
        </button>
      </div>

      <pre class="code-block"><code>{{ activeCode }}</code></pre>

      <p class="modal-disclaimer">
        This is custom-generated code. Always review and understand any code before pasting it
        into a website or application.
      </p>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--surface-3);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius-lg);
  width: min(860px, 94vw);
  height: min(600px, 84vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
.close-btn:hover {
  color: var(--text);
  background: var(--border);
}

.modal-error {
  font-size: 12px;
  color: var(--danger);
  background: var(--danger-tint);
  border: 1px solid var(--danger-tint);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  margin: 10px 16px 0;
  flex-shrink: 0;
}

.modal-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 16px 0;
  flex-shrink: 0;
}
.modal-hint strong {
  color: var(--text);
  font-weight: 600;
}

.tab-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px 0;
  flex-shrink: 0;
}

.tab-btn {
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 120ms ease;
}
.tab-btn:hover {
  color: var(--text);
}
.tab-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.copy-btn {
  margin-left: auto;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: all 120ms ease;
}
.copy-btn:hover {
  background: var(--border);
}
.copy-btn.done {
  border-color: var(--success);
  color: var(--success);
}

.code-block {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 10px 16px 16px;
  padding: 12px;
  background: var(--bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text);
  white-space: pre;
  tab-size: 2;
}
.modal-disclaimer {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 16px 14px;
  flex-shrink: 0;
}
</style>
