<script setup lang="ts">
import { X, ChevronRight, Download, ExternalLink } from 'lucide-vue-next'
import { PRESETS, buildSampleScene } from '@/presets'

defineEmits<{ close: []; loadPreset: [id: string] }>()

function downloadSample() {
  const scene = buildSampleScene()
  const payload = JSON.stringify({ version: 2, ...scene }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'sample-scene.alchemy'
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <Transition name="drawer">
    <div class="drawer-backdrop" @click.self="$emit('close')">
      <div class="drawer">
        <div class="drawer-header">
          <span class="text-subtitle">Getting Started</span>
          <button class="close-btn" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="drawer-body">
          <section class="section">
            <h3 class="section-title">What is Alchemy?</h3>
            <p class="text-body section-text">
              Alchemy is a visual node-graph editor for building interactive stream overlay widgets.
              Draw areas on a canvas, wire up event-driven logic using nodes, and export
              self-contained HTML/CSS/JS widgets ready for OBS or any streaming tool.
            </p>
          </section>

          <a
            href="https://streamlabs.com/dashboard#/widgets/customwidget"
            target="_blank"
            rel="noopener"
            class="sl-link"
          >
            <ExternalLink :size="14" />
            Open Streamlabs Custom Widget
          </a>

          <section class="section">
            <h3 class="section-title">Quick Start</h3>
            <ol class="steps">
              <li>
                <strong>Draw an area</strong>
                <span>Click the <kbd>□</kbd> draw tool in the canvas toolbar, then drag on the canvas to create a rectangular overlay region.</span>
              </li>
              <li>
                <strong>Open the node graph</strong>
                <span>Click an area to select it. Its node graph appears in the bottom panel.</span>
              </li>
              <li>
                <strong>Add nodes</strong>
                <span>Drag nodes from the palette on the left into the graph. Start with a <em>trigger</em> (e.g. Chat Message) and a <em>transition</em> (e.g. Show/Hide).</span>
              </li>
              <li>
                <strong>Wire nodes together</strong>
                <span>Drag from an output handle on one node to an input handle on another to create a connection.</span>
              </li>
              <li>
                <strong>Configure elements</strong>
                <span>Select a transition node to see its element slots. Add images, text, video, or color elements and position them in the area preview.</span>
              </li>
              <li>
                <strong>Preview your widget</strong>
                <span>Use the runtime controls in the graph panel to fire test events and see your widget animate live.</span>
              </li>
              <li>
                <strong>Export</strong>
                <span>Click <em>Export Widget</em> to generate standalone HTML, CSS, and JavaScript you can paste into your <a href="https://streamlabs.com/dashboard#/widgets/customwidget" target="_blank" rel="noopener" class="inline-link">Streamlabs Custom Widget <ExternalLink :size="11" style="vertical-align: middle" /></a> or any browser source.</span>
              </li>
            </ol>
          </section>

          <section class="section">
            <h3 class="section-title">Start from a Preset</h3>
            <p class="text-body section-text" style="margin-bottom: 12px;">
              Load a ready-made scene to explore how things work, then customize it.
            </p>
            <div class="preset-list">
              <button
                v-for="preset in PRESETS"
                :key="preset.id"
                class="preset-card"
                @click="$emit('loadPreset', preset.id)"
              >
                <div class="preset-info">
                  <span class="preset-name">{{ preset.name }}</span>
                  <span class="preset-desc">{{ preset.description }}</span>
                </div>
                <ChevronRight :size="16" class="preset-arrow" />
              </button>
            </div>
          </section>

          <section class="section">
            <h3 class="section-title">Sample Scene</h3>
            <p class="text-body section-text" style="margin-bottom: 12px;">
              Download a complex scene file with multiple areas to reverse-engineer. Includes a tiered donation alert, persistent follower goal, and a timed info banner.
            </p>
            <button class="download-btn" @click="downloadSample">
              <Download :size="14" />
              Download sample-scene.alchemy
            </button>
          </section>

          <section class="section">
            <h3 class="section-title">Keyboard Shortcuts</h3>
            <div class="shortcuts">
              <div class="shortcut"><kbd>Ctrl+S</kbd> <span>Save scene</span></div>
              <div class="shortcut"><kbd>Ctrl+O</kbd> <span>Open scene</span></div>
              <div class="shortcut"><kbd>Ctrl+E</kbd> <span>Export widget</span></div>
              <div class="shortcut"><kbd>Esc</kbd> <span>Deselect / close</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
}

.drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: 450px;
  max-width: 90vw;
  height: 100%;
  background: var(--surface-2);
  border-left: 0.5px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.close-btn:hover {
  background: var(--surface-4);
  color: var(--text);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section {
  margin-bottom: 28px;
}
.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.section-text {
  color: var(--text);
  line-height: 1.65;
}

.steps {
  list-style: none;
  counter-reset: step;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.steps li {
  counter-increment: step;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 32px;
  position: relative;
}

.steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 1px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.steps li strong {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.steps li span {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.55;
}

.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-muted);
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--surface-4);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text);
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface-3);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.download-btn:hover {
  background: var(--surface-4);
  border-color: var(--border-hover);
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-3);
  border: 0.5px solid var(--border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  color: var(--text);
  transition: background 120ms ease, border-color 120ms ease;
}
.preset-card:hover {
  background: var(--surface-4);
  border-color: var(--border-hover);
}

.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preset-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.preset-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.45;
}

.preset-arrow {
  flex-shrink: 0;
  color: var(--text-faint);
  transition: color 120ms ease;
}
.preset-card:hover .preset-arrow {
  color: var(--text-muted);
}

.sl-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 28px;
  background: var(--accent-dim);
  border: 0.5px solid var(--accent);
  border-radius: var(--radius-md);
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.sl-link:hover {
  background: var(--surface-4);
}

.inline-link {
  color: var(--accent);
  text-decoration: none;
}
.inline-link:hover {
  text-decoration: underline;
}

/* Slide transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 200ms ease;
}
.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
</style>
