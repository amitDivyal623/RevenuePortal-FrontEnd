<template>
  <div v-if="chips.length" class="fp-chips" role="list" aria-label="Recently used filters">
    <span class="fp-chips-label">Recent:</span>
    <button
      v-for="chip in chips"
      :key="chip.id"
      class="fp-chip"
      role="listitem"
      :title="chip.filter_name"
      @click="handleApply(chip)"
    >
      {{ chip.filter_name }}
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useFilterPresetsStore } from '@/store/filterPresets.store.js'

defineProps({
  section: { type: String, default: 'case_list' },
})

const emit = defineEmits(['apply'])

const store = useFilterPresetsStore()
const chips = computed(() => store.chips)

onMounted(() => store.fetchChips())

function handleApply(chip) {
  let parsed
  try {
    parsed = typeof chip.json_field === 'string'
      ? JSON.parse(chip.json_field)
      : chip.json_field
  } catch {
    parsed = {}
  }
  emit('apply', parsed)
  store.recordUse(chip.id)
}
</script>

<style scoped>
.fp-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0 2px;
}

.fp-chips-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-right: 2px;
}

.fp-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-light);
  border: 1px solid var(--primary);
  border-radius: 13px;
  cursor: pointer;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s, color 0.15s;
}

.fp-chip:hover {
  background: var(--primary);
  color: #fff;
}
</style>
