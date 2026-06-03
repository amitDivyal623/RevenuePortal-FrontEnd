<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Remove Case Completely</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Remove Case Completely</span>
      </div>
    </div>

    <!-- Permanent warning -->
    <div class="alert alert-danger mb-lg" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;margin-top:1px;">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <strong>Destructive operation — this cannot be undone.</strong>
        Removing a case permanently hard-deletes the case and all linked records
        (actions, payments, letters, attachments, audit log, offences, journey details).
        Use only for purging incorrectly issued or test cases.
      </div>
    </div>

    <!-- Step 1 — searchable case picker -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Find case to remove</div>
      <div class="form-row">
        <div class="form-group" style="position:relative;">
          <label class="form-label">Search by case number, offender name, or vehicle reg <span class="req">*</span></label>
          <input
            ref="searchInputRef"
            v-model="searchTerm"
            type="text"
            placeholder="e.g. UFN/000000123 or John Doe"
            autocomplete="off"
            :disabled="!!pendingRef"
            @input="onSearchInput"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
            @keydown.escape="closeDropdown"
          />

          <!-- Teleported dropdown — escapes card overflow -->
          <Teleport to="body">
            <div v-if="dropdownOpen" class="case-dropdown" :style="dropdownStyle">
              <div v-if="searchLoading" class="case-dropdown-hint">Searching…</div>
              <div v-else-if="searchResults.length === 0 && searchTerm.length >= 2" class="case-dropdown-hint">
                No cases found
              </div>
              <div
                v-for="c in searchResults"
                :key="c.case_id"
                class="case-option"
                @mousedown.prevent="pickCase(c)"
              >
                <div class="case-option-top">
                  <span class="case-option-ref">{{ c.case_num }}</span>
                  <span class="case-option-badge">{{ c.case_type_code }}</span>
                  <span class="case-option-status">{{ c.case_status_desc }}</span>
                </div>
                <div class="case-option-sub">
                  {{ [c.title, c.first_name, c.surname].filter(Boolean).join(' ') || '—' }}
                  <template v-if="c.post_code"> · {{ c.post_code }}</template>
                  <template v-if="c.reg_num"> · {{ c.reg_num }}</template>
                </div>
              </div>
            </div>
          </Teleport>

          <span v-if="searchError" class="form-error">{{ searchError }}</span>
        </div>
      </div>

      <!-- Selected case preview -->
      <div v-if="selectedCase" class="selected-case-row mt-md">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="color:#15803d;flex-shrink:0;">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>
          <strong>{{ selectedCase.case_num }}</strong>
          — {{ selectedCase.case_type_code }}
          · {{ [selectedCase.title, selectedCase.first_name, selectedCase.surname].filter(Boolean).join(' ') || 'No offender' }}
          · <em>{{ selectedCase.case_status_desc }}</em>
        </span>
        <button class="btn-link" @click="reset" title="Clear selection">✕</button>
      </div>

    </div>

    <!-- Step 2 — confirm removal -->
    <div v-if="pendingRef" class="card card-padded mb-lg">
      <div class="card-title" style="color:var(--danger)">Confirm permanent removal</div>

      <div class="confirm-banner">
        <strong>Case {{ pendingRef }}</strong> and all its associated records will be permanently deleted.
        This action is irreversible. Once deleted the case will not be recoverable.
      </div>

      <div class="form-group mt-md">
        <label class="form-label">
          Type <strong>{{ pendingRef }}</strong> to confirm <span class="req">*</span>
        </label>
        <input
          v-model.trim="typedConfirm"
          type="text"
          :placeholder="pendingRef"
          autocomplete="off"
          @keyup.enter="confirmRemove"
        />
      </div>

      <div v-if="removeError" class="alert alert-danger mt-md" role="alert">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ removeError }}</span>
      </div>

      <div class="flex gap-sm mt-md" style="justify-content:flex-end">
        <button class="btn btn-secondary" @click="reset" :disabled="removing">Cancel</button>
        <button
          class="btn btn-danger"
          :disabled="typedConfirm !== pendingRef || removing"
          @click="confirmRemove"
        >
          {{ removing ? 'Removing…' : 'Remove Case Permanently' }}
        </button>
      </div>
    </div>

    <!-- Step 3 — success summary -->
    <div v-if="result" class="card card-padded">
      <div class="alert alert-success" role="alert" style="margin-bottom:1rem">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <strong>Case {{ result.case_ref_no }} has been permanently removed.</strong>
      </div>

      <div class="card-title" style="font-size:0.875rem;margin-bottom:0.5rem;">Deleted records</div>
      <div class="deleted-grid">
        <div v-for="(count, table) in result.deleted" :key="table" v-show="count > 0" class="deleted-row">
          <span class="deleted-label">{{ formatTable(table) }}</span>
          <span class="badge badge-neutral">{{ count }}</span>
        </div>
      </div>

      <div class="mt-md">
        <button class="btn btn-primary btn-sm" @click="reset">Remove another case</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { casesService } from '@/services/cases.service.js'

const DEBOUNCE_MS  = 300
const MIN_QUERY    = 2

// ── Search state ──────────────────────────────────────────────────────────────
const searchInputRef  = ref(null)
const searchTerm      = ref('')
const searchResults   = ref([])
const searchLoading   = ref(false)
const searchError     = ref('')
const dropdownOpen    = ref(false)
const dropdownStyle   = ref({})
const selectedCase    = ref(null)
let debounceTimer     = null
let searchSeq         = 0

// ── Confirmation state ────────────────────────────────────────────────────────
const pendingRef   = ref('')
const typedConfirm = ref('')
const removeError  = ref('')
const removing     = ref(false)
const result       = ref(null)

// ── Search logic ──────────────────────────────────────────────────────────────
function calcDropdownStyle() {
  const el = searchInputRef.value
  if (!el) return {}
  const r = el.getBoundingClientRect()
  return { top: `${r.bottom + 2}px`, left: `${r.left}px`, width: `${r.width}px` }
}

function openDropdown() {
  dropdownStyle.value = calcDropdownStyle()
  dropdownOpen.value  = true
}

function closeDropdown() {
  dropdownOpen.value = false
}

function onSearchFocus() {
  if (searchTerm.value.length >= MIN_QUERY || searchResults.value.length) {
    openDropdown()
  }
}

function onSearchBlur() {
  // Delay so mousedown on an option can fire first
  setTimeout(closeDropdown, 180)
}

function onSearchInput() {
  selectedCase.value = null
  searchError.value  = ''

  const term = searchTerm.value.trim()
  if (term.length < MIN_QUERY) {
    searchResults.value = []
    closeDropdown()
    clearTimeout(debounceTimer)
    return
  }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => doSearch(term), DEBOUNCE_MS)
}

async function doSearch(term) {
  const seq = ++searchSeq
  searchLoading.value = true
  openDropdown()
  try {
    const data = await casesService.quickSearch({ term, page: 1, pageSize: 10 })
    if (seq !== searchSeq) return
    searchResults.value = data.results ?? []
    openDropdown()
  } catch {
    if (seq !== searchSeq) return
    searchResults.value = []
  } finally {
    if (seq === searchSeq) searchLoading.value = false
  }
}

function pickCase(c) {
  selectedCase.value  = c
  searchTerm.value    = c.case_num
  searchResults.value = []
  searchError.value   = ''
  closeDropdown()
  proceedToConfirm()
}

// ── Step 1 → Step 2 ───────────────────────────────────────────────────────────
function proceedToConfirm() {
  if (!selectedCase.value) {
    searchError.value = 'Please search for and select a case first.'
    return
  }
  pendingRef.value   = selectedCase.value.case_num
  typedConfirm.value = ''
  removeError.value  = ''
}

// ── Step 2: confirm & delete ──────────────────────────────────────────────────
async function confirmRemove() {
  if (typedConfirm.value !== pendingRef.value || removing.value) return

  removing.value    = true
  removeError.value = ''

  try {
    const data = await casesService.removeByRef(pendingRef.value)
    result.value = data
    // Clear all search/confirm state — keep result visible
    searchTerm.value   = ''
    selectedCase.value = null
    pendingRef.value   = ''
    typedConfirm.value = ''
  } catch (err) {
    const status = err?.status ?? err?.response?.status
    removeError.value = status === 404
      ? 'Case not found for this reference number. It may have already been removed.'
      : (err?.data?.detail || err?.message || 'An error occurred. Please try again.')
  } finally {
    removing.value = false
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function reset() {
  clearTimeout(debounceTimer)
  searchTerm.value    = ''
  searchResults.value = []
  searchLoading.value = false
  searchError.value   = ''
  selectedCase.value  = null
  dropdownOpen.value  = false
  pendingRef.value    = ''
  typedConfirm.value  = ''
  removeError.value   = ''
  removing.value      = false
  result.value        = null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TABLE_LABELS = {
  offences: 'Offences', audit_history: 'Audit history', attachments: 'Attachments',
  notes: 'Notes', print: 'Print records', actions: 'Actions',
  journey_details: 'Journey details', comm_data: 'Communication data',
  payments: 'Payments', case: 'Case record', case_reference: 'Case reference',
  vehicle_details: 'Vehicle details', customer_desc: 'Customer description',
  session_audit: 'Session audit history', customer: 'Customer record',
}

function formatTable(key) {
  return TABLE_LABELS[key] ?? key.replace(/_/g, ' ')
}
</script>

<style scoped>
.alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 16px; border-radius: var(--radius); font-size: 13px; border: 1px solid;
}
.alert-danger  { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.alert-success { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }

.confirm-banner {
  padding: 10px 14px; background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: var(--radius); color: #9a3412; font-size: 0.875rem; line-height: 1.5;
}

.selected-case-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: var(--radius); font-size: 0.875rem; color: #15803d;
}
.selected-case-row .btn-link {
  margin-left: auto; background: none; border: none;
  cursor: pointer; color: #6b7280; font-size: 14px; line-height: 1;
  padding: 0 4px;
}
.selected-case-row .btn-link:hover { color: #b91c1c; }

.deleted-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px 16px;
}
.deleted-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 8px; background: #f9fafb; border-radius: 4px; font-size: 0.8125rem;
}
.deleted-label { color: #374151; }
.req { color: var(--danger); margin-left: 2px; }
</style>

<!-- Teleported dropdown — unscoped so it renders correctly outside this component's DOM -->
<style>
.case-dropdown {
  position: fixed; z-index: 9999;
  background: #fff; border: 1px solid var(--border, #d1d5db);
  border-radius: 6px; box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  max-height: 280px; overflow-y: auto; padding: 4px 0;
}
.case-dropdown-hint {
  padding: 10px 14px; font-size: 13px; color: #9ca3af;
}
.case-option {
  padding: 8px 14px; cursor: pointer; border-bottom: 1px solid #f3f4f6;
}
.case-option:last-child { border-bottom: none; }
.case-option:hover { background: #f3f4f6; }
.case-option-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
}
.case-option-ref  { font-weight: 600; font-size: 13px; color: #111827; }
.case-option-badge {
  font-size: 11px; padding: 1px 6px; background: #e0e7ff; color: #3730a3;
  border-radius: 4px; font-weight: 500;
}
.case-option-status { font-size: 12px; color: #6b7280; margin-left: auto; }
.case-option-sub { font-size: 12px; color: #6b7280; }
</style>
