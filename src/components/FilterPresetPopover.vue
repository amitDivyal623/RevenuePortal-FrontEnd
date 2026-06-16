<template>
  <div class="fp-wrapper" ref="wrapperRef">
    <!-- Trigger -->
    <button
      class="btn btn-secondary btn-sm fp-trigger"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="toggle"
    >
      Saved Filters
      <span v-if="totalCount" class="fp-badge">{{ totalCount }}</span>
      <span class="fp-caret" aria-hidden="true">{{ open ? '▴' : '▾' }}</span>
    </button>

    <!-- Popover panel -->
    <div
      v-if="open"
      class="fp-panel"
      role="dialog"
      aria-label="Saved filter presets"
      @keydown.escape.stop="close"
    >
      <!-- ── Save current filters ──────────────────────────────────────── -->
      <div class="fp-section">
        <div class="fp-section-title">Save Current Filters</div>
        <div class="fp-save-row">
          <input
            v-model="saveName"
            class="fp-name-input"
            type="text"
            placeholder="Preset name…"
            maxlength="100"
            @keyup.enter="handleSave"
          />
          <label v-if="isAdmin" class="fp-team-label">
            <input v-model="saveAsPersonal" type="checkbox" />
            For Personal Use
          </label>
          <button
            class="btn btn-primary btn-sm"
            :disabled="!saveName.trim() || saving"
            @click="handleSave"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
        <p v-if="nameExists" class="fp-inline-error">
          A preset named "{{ saveName }}" already exists.
        </p>
        <p v-if="saveError" class="fp-inline-error">{{ saveError }}</p>
      </div>

      <div class="fp-divider" />

      <!-- ── Personal presets ──────────────────────────────────────────── -->
      <div class="fp-section">
        <div class="fp-section-title">My Presets</div>
        <div v-if="presetsStore.loading" class="fp-empty">Loading…</div>
        <div v-else-if="!personal.length" class="fp-empty">No saved presets yet.</div>
        <div
          v-for="preset in personal"
          :key="preset.id"
          class="fp-item"
          :class="{ 'fp-item--confirm': pendingDelete?.id === preset.id }"
        >
          <template v-if="pendingDelete?.id === preset.id">
            <span class="fp-confirm-text">Delete "{{ preset.filter_name }}"?</span>
            <button class="btn btn-danger btn-sm fp-confirm-yes" :disabled="deleting" @click="handleDelete">
              {{ deleting ? '…' : 'Yes' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="pendingDelete = null">No</button>
          </template>
          <template v-else>
            <button class="fp-item-name" @click="handleApply(preset)">{{ preset.filter_name }}</button>
            <button class="fp-item-delete" aria-label="Delete preset" @click="pendingDelete = preset">×</button>
          </template>
        </div>
      </div>

      <div class="fp-divider" />

      <!-- ── Team presets ──────────────────────────────────────────────── -->
      <div class="fp-section">
        <div class="fp-section-title">Team Presets</div>
        <div v-if="presetsStore.loading" class="fp-empty">Loading…</div>
        <div v-else-if="!team.length" class="fp-empty">No team presets.</div>
        <div
          v-for="preset in team"
          :key="preset.id"
          class="fp-item"
          :class="{ 'fp-item--confirm': pendingDelete?.id === preset.id }"
        >
          <template v-if="pendingDelete?.id === preset.id">
            <span class="fp-confirm-text">Delete "{{ preset.filter_name }}"?</span>
            <button class="btn btn-danger btn-sm fp-confirm-yes" :disabled="deleting" @click="handleDelete">
              {{ deleting ? '…' : 'Yes' }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="pendingDelete = null">No</button>
          </template>
          <template v-else>
            <button class="fp-item-name" @click="handleApply(preset)">{{ preset.filter_name }}</button>
            <button v-if="isAdmin" class="fp-item-delete" aria-label="Delete preset" @click="pendingDelete = preset">×</button>
          </template>
        </div>
      </div>

      <div v-if="presetsStore.error" class="fp-section">
        <p class="fp-inline-error">{{ presetsStore.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import { useFilterPresetsStore } from '@/store/filterPresets.store.js'
import { useAuthStore } from '@/store/auth.js'

const props = defineProps({
  // Current filter state from the case list page — serialised when saving
  currentFilters: { type: Object, default: () => ({}) },
  section:        { type: String, default: 'case_list' },
})

const emit = defineEmits([
  'apply',  // payload: parsed filter object from the preset's json_field
])

const presetsStore = useFilterPresetsStore()
const authStore    = useAuthStore()

const isAdmin = computed(() => authStore.hasRole('RevpAdminUser'))

// ── Popover open/close ────────────────────────────────────────────────────
const open       = ref(false)
const wrapperRef = ref(null)

function toggle() {
  if (!open.value) {
    open.value = true
    presetsStore.fetchAll()
  } else {
    close()
  }
}

function close() {
  open.value     = false
  pendingDelete.value = null
  nameExists.value    = false
  saveError.value     = null
}

function onDocClick(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))

// ── Computed ──────────────────────────────────────────────────────────────
const personal   = computed(() => presetsStore.personal)
const team       = computed(() => presetsStore.team)
const totalCount = computed(() => personal.value.length + team.value.length)

// ── Save ──────────────────────────────────────────────────────────────────
const saveName       = ref('')
const saveAsPersonal = ref(true)   // checked = personal, unchecked = team
const saving         = ref(false)
const nameExists     = ref(false)
const saveError      = ref(null)

// Produce a stable string from a filter object so {b:1,a:2} === {a:2,b:1}.
function _canonicalise(obj) {
  try {
    const plain = typeof obj === 'string' ? JSON.parse(obj) : obj
    return JSON.stringify(
      Object.fromEntries(Object.entries(plain ?? {}).sort(([a], [b]) => a.localeCompare(b)))
    )
  } catch {
    return ''
  }
}

async function handleSave() {
  const name = saveName.value.trim()
  if (!name || saving.value) return

  nameExists.value = false
  saveError.value  = null

  // ── Duplicate-configuration check ──────────────────────────────────────
  const currentCanon = _canonicalise(props.currentFilters)
  const allPresets   = [...presetsStore.personal, ...presetsStore.team]
  const duplicate    = allPresets.find(p => _canonicalise(p.json_field) === currentCanon)

  if (duplicate) {
    const { isConfirmed } = await Swal.fire({
      title: 'Duplicate Filter Configuration',
      text:  `This filter configuration is already saved as "${duplicate.filter_name}". Do you still want to save it with a different name?`,
      icon:  'warning',
      showCancelButton:   true,
      confirmButtonText:  'Yes, save anyway',
      cancelButtonText:   'Cancel',
      confirmButtonColor: 'var(--primary, #15a982)',
    })
    if (!isConfirmed) return
  }

  saving.value = true
  try {
    const result = await presetsStore.create({
      filter_name: name,
      json_field:  JSON.stringify(props.currentFilters),
      is_personal: saveAsPersonal.value ? 1 : 0,
    })

    if (result.exists) {
      nameExists.value = true
    } else {
      close()
    }
  } catch (err) {
    saveError.value = err?.data?.detail || 'Failed to save preset.'
  } finally {
    saving.value = false
  }
}

// ── Apply ─────────────────────────────────────────────────────────────────
async function handleApply(preset) {
  let parsed
  try {
    parsed = typeof preset.json_field === 'string'
      ? JSON.parse(preset.json_field)
      : preset.json_field
  } catch {
    parsed = {}
  }
  emit('apply', parsed)
  presetsStore.recordUse(preset.id)
  close()
}

// ── Delete ────────────────────────────────────────────────────────────────
const pendingDelete = ref(null)
const deleting      = ref(false)

async function handleDelete() {
  if (!pendingDelete.value || deleting.value) return
  deleting.value = true
  try {
    await presetsStore.remove(pendingDelete.value.id)
    pendingDelete.value = null
  } catch {
    // Error visible via presetsStore.error
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.fp-wrapper {
  position: relative;
  display: inline-block;
}

/* ── Trigger ────────────────────────────────────────────────────────────── */
.fp-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fp-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--primary);
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.fp-caret {
  font-size: 10px;
  color: var(--text-muted);
}

/* ── Panel ──────────────────────────────────────────────────────────────── */
.fp-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 200;
  width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  overflow: hidden;
  animation: fp-fade-in 0.1s ease;
}

@keyframes fp-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fp-divider {
  height: 1px;
  background: var(--border);
  margin: 0;
}

/* ── Sections ───────────────────────────────────────────────────────────── */
.fp-section {
  padding: 12px 14px;
}

.fp-section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.fp-empty {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

/* ── Save row ───────────────────────────────────────────────────────────── */
.fp-save-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.fp-name-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--bg-page);
  color: var(--text-default);
  outline: none;
  transition: border-color 0.15s;
}

.fp-name-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.fp-team-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  cursor: pointer;
}

/* ── Preset item row ────────────────────────────────────────────────────── */
.fp-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.fp-item--confirm {
  background: #fef2f2;
  border-radius: 5px;
  padding: 4px 8px;
  margin: 0 -8px;
}

.fp-item-name {
  flex: 1;
  text-align: left;
  padding: 4px 6px;
  font-size: 13px;
  color: var(--primary);
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fp-item-name:hover {
  background: var(--primary-light);
}

.fp-item-delete {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 15px;
  cursor: pointer;
  line-height: 1;
  transition: background 0.1s, color 0.1s;
}

.fp-item-delete:hover {
  background: #fee2e2;
  color: var(--danger);
}

/* ── Inline delete confirm ──────────────────────────────────────────────── */
.fp-confirm-text {
  flex: 1;
  font-size: 12px;
  color: var(--text-default);
}

.fp-confirm-yes {
  margin-left: auto;
}

/* ── Errors ─────────────────────────────────────────────────────────────── */
.fp-inline-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--danger);
}
</style>
