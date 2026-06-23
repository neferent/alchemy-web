<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'

const props = defineProps<{ data: { a: string; operator: string; b: string } }>()
</script>

<template>
  <Handle type="target" :position="Position.Left" />
  <BaseNode icon="icon-balance" title="Compare" category="logic">
    <div class="row">
      <div class="node-field" style="flex: 1">
        <span class="node-label">A</span>
        <input v-model="props.data.a" type="text" placeholder="{$amount}" class="node-input" />
      </div>
      <div class="node-field" style="flex: 0 0 64px">
        <span class="node-label">Op</span>
        <select v-model="props.data.operator" class="node-select">
          <option value=">">></option>
          <option value=">=">≥</option>
          <option value="<"><</option>
          <option value="<=">≤</option>
          <option value="==">==</option>
          <option value="!=">≠</option>
        </select>
      </div>
      <div class="node-field" style="flex: 1">
        <span class="node-label">B</span>
        <input v-model="props.data.b" type="text" placeholder="{$maxTip}" class="node-input" />
      </div>
    </div>
    <div class="outputs">
      <span class="out-label true">True →</span>
      <span class="out-label false">False →</span>
    </div>
  </BaseNode>
  <Handle id="true"  type="source" :position="Position.Right" style="top: 74%" />
  <Handle id="false" type="source" :position="Position.Right" style="top: 87%" />
</template>

<style scoped>
.row {
  display: flex;
  gap: 6px;
}
.outputs {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid #2a2a2a;
  margin-top: 4px;
  margin-bottom: 4px;
}
.out-label {
  font-size: 9px;
  font-weight: 600;
}
.out-label.true  { color: #22c55e; transform: translateY(-1px); }
.out-label.false { color: #f43f5e; transform: translateY(1px); }
</style>
