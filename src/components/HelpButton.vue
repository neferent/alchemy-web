<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'

defineEmits<{ click: [] }>()
</script>

<template>
  <button class="help-fab" title="Getting Started" @click="$emit('click')">
    <HelpCircle :size="20" />
  </button>
</template>

<style scoped>
.help-fab {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 900;
  width: 32px;
  height: 40px;
  border: 0.5px solid var(--border-strong);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  background: var(--surface-3);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms ease, color 120ms ease, width 120ms ease;
}
.help-fab:hover {
  background: var(--surface-4);
  color: var(--text);
  width: 36px;
}
</style>
