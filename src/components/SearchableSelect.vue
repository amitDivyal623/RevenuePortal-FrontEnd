<template>
  <div class="ss-wrap" ref="wrapRef" @keydown.escape.stop="close">
    <div class="ss-control" @click="openDropdown">
      <input
        ref="inputRef"
        type="text"
        class="ss-input"
        :value="isOpen ? query : selectedLabel"
        :placeholder="isOpen ? 'Type to search…' : (selectedLabel || placeholder)"
        @input="onInput"
        autocomplete="off"
        spellcheck="false"
      />
      <span class="ss-arrow" :class="{ flipped: isOpen }">▾</span>
    </div>

    <!-- Teleport to body so modal overflow:hidden never clips the list -->
    <Teleport to="body">
      <div v-if="isOpen" class="ss-dropdown-teleport" :style="dropdownStyle">
        <div
          v-for="opt in filtered"
          :key="opt.value"
          class="ss-option"
          :class="{ 'ss-option--selected': String(opt.value) === String(modelValue) }"
          @mousedown.prevent="select(opt)"
        >
          {{ opt.label }}
        </div>
        <div v-if="filtered.length === 0" class="ss-no-options">No results</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue:  { type: [String, Number], default: '' },
  options:     { type: Array,            default: () => [] },
  placeholder: { type: String,           default: 'Select…' },
})
const emit = defineEmits(['update:modelValue'])

const isOpen        = ref(false)
const query         = ref('')
const wrapRef       = ref(null)
const inputRef      = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const opt = props.options.find(o => String(o.value) === String(props.modelValue))
  return opt ? opt.label : ''
})

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(o => String(o.label).toLowerCase().includes(q))
})

function updateDropdownPos() {
  if (!wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top:      `${rect.bottom + 3}px`,
    left:     `${rect.left}px`,
    width:    `${rect.width}px`,
    zIndex:   9999,
  }
}

function openDropdown() {
  if (!isOpen.value) {
    updateDropdownPos()
    isOpen.value = true
    query.value  = ''
    nextTick(() => inputRef.value?.focus())
  }
}

function close() {
  isOpen.value = false
  query.value  = ''
}

function select(opt) {
  emit('update:modelValue', opt.value)
  close()
}

function onInput(e) {
  query.value  = e.target.value
  isOpen.value = true
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) close()
}

onMounted(()   => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.ss-wrap {
  position: relative;
  width: 100%;
}

.ss-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.ss-control:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(21, 169, 130, 0.15);
}

.ss-input {
  flex: 1;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--text-default);
  cursor: pointer;
  min-width: 0;
}
.ss-input::placeholder { color: var(--text-muted); }

.ss-arrow {
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-muted);
  transition: transform 0.15s;
  user-select: none;
  pointer-events: none;
}
.ss-arrow.flipped { transform: rotate(180deg); }
</style>

<!-- Global styles for the teleported dropdown (not scoped — lives outside this component's DOM) -->
<style>
.ss-dropdown-teleport {
  background: #fff;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius-sm, 4px);
  box-shadow: 0 4px 16px rgba(30, 34, 54, 0.14);
  max-height: 220px;
  overflow-y: auto;
}

.ss-dropdown-teleport .ss-option {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-default, #1e2236);
  cursor: pointer;
  transition: background 0.12s;
}
.ss-dropdown-teleport .ss-option:hover { background: var(--bg-hover, #f1f5f9); }
.ss-dropdown-teleport .ss-option--selected {
  background: rgba(21, 169, 130, 0.08);
  color: var(--primary, #15a982);
  font-weight: 500;
}

.ss-dropdown-teleport .ss-no-options {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  text-align: center;
}
</style>
