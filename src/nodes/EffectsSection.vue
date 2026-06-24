<script setup lang="ts">
import { ref } from 'vue'

const ANIMATIONS = [
  { group: 'Attention', options: ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'tada', 'wobble', 'heartBeat', 'jello'] },
  { group: 'Entrance', options: ['backInDown', 'backInLeft', 'backInRight', 'backInUp', 'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp', 'fadeIn', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'fadeInUp', 'flipInX', 'flipInY', 'rotateIn', 'slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp'] },
  { group: 'Exit', options: ['bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp', 'fadeOut', 'fadeOutDown', 'fadeOutLeft', 'fadeOutRight', 'fadeOutUp', 'rotateOut', 'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp'] },
]

export interface EffectsData {
  opacity: number
  shadow: {
    enabled: boolean
    x: number
    y: number
    blur: number
    spread: number
    color: string
    opacity: number
  }
  animation: {
    enabled: boolean
    name: string
    duration: number
    repeat: number
    delay: number
  }
}

const props = defineProps<{ effects: EffectsData }>()

const open = ref(false)
</script>

<template>
  <div class="fx-section">
    <button class="fx-toggle nodrag" @click.stop="open = !open">
      <span class="fx-chevron" :class="{ open }">▾</span>
      Effects
    </button>
    <template v-if="open">
      <div class="node-field">
        <span class="node-label">Opacity ({{ Math.round(props.effects.opacity * 100) }}%)</span>
        <input v-model.number="props.effects.opacity" type="range" min="0" max="1" step="0.05" class="node-slider" />
      </div>

      <label class="fx-check">
        <input v-model="props.effects.shadow.enabled" type="checkbox" />
        Drop Shadow
      </label>
      <template v-if="props.effects.shadow.enabled">
        <div class="row">
          <div class="node-field half">
            <span class="node-label">X</span>
            <input v-model.number="props.effects.shadow.x" type="number" class="node-input" />
          </div>
          <div class="node-field half">
            <span class="node-label">Y</span>
            <input v-model.number="props.effects.shadow.y" type="number" class="node-input" />
          </div>
        </div>
        <div class="row">
          <div class="node-field half">
            <span class="node-label">Blur</span>
            <input v-model.number="props.effects.shadow.blur" type="number" min="0" class="node-input" />
          </div>
          <div class="node-field half">
            <span class="node-label">Color</span>
            <input v-model="props.effects.shadow.color" type="color" class="node-color" />
          </div>
        </div>
        <div class="node-field">
          <span class="node-label">Shadow Opacity ({{ Math.round(props.effects.shadow.opacity * 100) }}%)</span>
          <input v-model.number="props.effects.shadow.opacity" type="range" min="0" max="1" step="0.05" class="node-slider" />
        </div>
      </template>

      <label class="fx-check">
        <input v-model="props.effects.animation.enabled" type="checkbox" />
        Animation
      </label>
      <template v-if="props.effects.animation.enabled">
        <div class="node-field">
          <span class="node-label">Animation</span>
          <select v-model="props.effects.animation.name" class="node-select">
            <optgroup v-for="group in ANIMATIONS" :key="group.group" :label="group.group">
              <option v-for="anim in group.options" :key="anim" :value="anim">{{ anim }}</option>
            </optgroup>
          </select>
        </div>
        <div class="row">
          <div class="node-field half">
            <span class="node-label">Duration (s)</span>
            <input v-model.number="props.effects.animation.duration" type="number" min="0.1" step="0.1" class="node-input" />
          </div>
          <div class="node-field half">
            <span class="node-label">Delay (s)</span>
            <input :value="props.effects.animation.delay ?? 0" type="number" min="0" step="0.1" class="node-input" @change="props.effects.animation.delay = +($event.target as HTMLInputElement).value" />
          </div>
        </div>
        <div class="node-field">
          <span class="node-label">Repeat (0=∞)</span>
          <input v-model.number="props.effects.animation.repeat" type="number" min="0" step="1" class="node-input" />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.fx-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-strong);
  padding-top: 6px;
  margin-top: 2px;
}

.fx-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.fx-toggle:hover {
  color: var(--text);
}

.fx-chevron {
  font-size: 12px;
  transition: transform 120ms ease;
  display: inline-block;
  transform: rotate(-90deg);
}

.fx-chevron.open {
  transform: rotate(0deg);
}

.fx-check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.fx-check input[type='checkbox'] {
  accent-color: var(--accent);
  cursor: pointer;
}

.node-slider {
  width: 100%;
  accent-color: var(--accent);
}

.row {
  display: flex;
  gap: 6px;
}

.half {
  flex: 1;
  min-width: 0;
}

.node-color {
  width: 100%;
  height: 24px;
  padding: 1px 2px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
</style>
