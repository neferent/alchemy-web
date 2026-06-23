<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { event: string } }>()

const EVENT_VARS: Record<string, string[]> = {
  init:         [],
  donation:     ['tipper', 'amount', 'formattedAmount', 'message'],
  follow:       ['username'],
  subscription: ['username', 'months', 'streak', 'tier'],
  bits:         ['username', 'bits', 'message'],
  superchat:    ['username', 'amount', 'formattedAmount', 'message'],
  raid:         ['username', 'raiders', 'viewerCount'],
  merch:        ['username', 'message'],
}

const vars = computed(() => EVENT_VARS[props.data.event] ?? [])
</script>

<template>
  <BaseNode icon="icon-alert-box" title="On Event" category="trigger">
    <div class="node-field">
      <span class="node-label">Event</span>
      <select v-model="props.data.event" class="node-select">
        <option value="init">Session Init</option>
        <option value="donation">Donation</option>
        <option value="follow">Follow</option>
        <option value="subscription">Subscription</option>
        <option value="bits">Bits / Cheer</option>
        <option value="superchat">Super Chat</option>
        <option value="raid">Raid / Host</option>
        <option value="merch">Merch Purchase</option>
      </select>
    </div>
    <div v-if="vars.length" class="node-vars">
      <span v-for="v in vars" :key="v" class="node-var-chip">{${{ v }}}</span>
    </div>
  </BaseNode>
  <Handle type="source" :position="Position.Right" />
</template>

<style scoped>
.node-vars {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.node-var-chip {
  font-size: 9px;
  font-family: monospace;
  color: #80F5D2;
  background: rgba(128, 245, 210, 0.08);
  border: 1px solid rgba(128, 245, 210, 0.2);
  border-radius: 3px;
  padding: 1px 4px;
}
</style>
