<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Lookup Values</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Lookup Values</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Lookup Type</label>
          <div class="searchable-wrap">
            <input
              ref="typeInputRef"
              type="text"
              v-model="typeSearch"
              placeholder="Search types…"
              autocomplete="off"
              @focus="openTypeDropdown"
              @input="openTypeDropdown"
              @blur="onTypeBlur"
            />
            <Teleport to="body">
              <div v-if="typeDropdownOpen" class="searchable-dropdown-teleport" :style="typeDropdownStyle">
                <div class="searchable-option searchable-option--clear" @mousedown.prevent="clearTypeFilter">
                  All types
                </div>
                <div v-if="typeOptions.length === 0" class="searchable-empty">No types found</div>
                <div
                  v-for="t in typeOptions"
                  :key="t.lookup_type_id"
                  class="searchable-option"
                  :class="{ selected: filterType === t.lookup_type_id }"
                  @mousedown.prevent="pickType(t)"
                >{{ t.name }}</div>
              </div>
            </Teleport>
          </div>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <!-- API error banner -->
    <div v-if="apiError" class="alert alert-danger mb-md">{{ apiError }}</div>

    <!-- Table -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Lookup Values <span v-if="!loading">({{ total }})</span>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Lookup Value</button>
      </div>

      <div v-if="loading" class="empty-state">
        <p class="empty-state-title">Loading…</p>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name (Lookup Type)</th>
              <th>Lookup Data Value</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-state-icon">🗂️</div>
                  <p class="empty-state-title">No lookup values found</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.lookup_data_id">
              <td><span class="badge badge-primary">{{ row.lookup_type_name }}</span></td>
              <td><strong>{{ row.lookup_data_value }}</strong></td>
              <td>
                <span :class="`badge badge-${row.active ? 'success' : 'neutral'}`">
                  {{ row.active ? 'Enabled' : 'Disabled' }}
                </span>
              </td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                  <button class="btn btn-danger btn-sm" @click="openDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-between items-center mt-md">
        <span class="text-sm text-muted">
          Showing {{ pageStart }}–{{ pageEnd }} of {{ total }}
        </span>
        <div class="flex gap-xs">
          <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="changePage(page - 1)">Prev</button>
          <span class="btn btn-secondary btn-sm" style="cursor:default">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="page === totalPages" @click="changePage(page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit / View modal -->
    <AdminModal
      v-if="modalOpen"
      :title="modalTitle"
      size="md"
      :mode="modalMode"
      @close="closeModal"
      @save="saveValue"
    >
      <div v-if="modalError" class="alert alert-danger mb-md">{{ modalError }}</div>

      <div class="form-group">
        <label class="form-label">Lookup Type <span class="req">*</span></label>
        <select v-model="form.lookup_type_id" :disabled="modalMode !== 'add'">
          <option value="">Please Select</option>
          <option v-for="t in lookupTypes" :key="t.lookup_type_id" :value="t.lookup_type_id">{{ t.name }}</option>
        </select>
        <span v-if="errors.lookup_type_id" class="form-error">{{ errors.lookup_type_id }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Lookup Value <span class="req">*</span></label>
        <input
          v-model.trim="form.value"
          :disabled="modalMode === 'view'"
          placeholder="Lookup Value"
          maxlength="200"
        />
        <span v-if="errors.value" class="form-error">{{ errors.value }}</span>
      </div>

      <!-- Active toggle: shown only in edit/view — status is auto-set to Active on creation -->
      <div v-if="modalMode !== 'add'" class="form-group inline-row">
        <label class="form-label">Active</label>
        <label class="toggle">
          <input
            type="checkbox"
            v-model="form.active"
            :true-value="true"
            :false-value="false"
            :disabled="modalMode === 'view'"
          />
          <span class="toggle-track"></span>
        </label>
      </div>
    </AdminModal>

    <!-- Delete confirmation -->
    <ConfirmDelete
      v-if="deleteOpen"
      title="Delete lookup value"
      :detail="deleteTarget?.value"
      @cancel="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { useLookupValuesStore } from '@/store/lookup-values.store.js'
import { swal } from '@/utils/swal.js'

const store = useLookupValuesStore()

// ── State ────────────────────────────────────────────────────────────────────
const lookupTypes = computed(() => store.lookupTypes)
const rows        = computed(() => store.rows)
const total       = computed(() => store.total)
const loading     = computed(() => store.loading)
const apiError    = computed(() => store.error)
const PAGE_SIZE   = store.pageSize

const typeOptions = computed(() => {
  const q = typeSearch.value.trim().toLowerCase()
  return q
    ? lookupTypes.value.filter(t => t.name.toLowerCase().includes(q))
    : lookupTypes.value
})

const page        = ref(1)
const filterType  = ref('')

// ── Filter searchable dropdown ────────────────────────────────────────────────
const typeSearch        = ref('')
const typeDropdownOpen  = ref(false)
const typeInputRef      = ref(null)
const typeDropdownStyle = ref({})

const modalOpen   = ref(false)
const modalMode   = ref('add')
const modalError  = ref('')
const deleteOpen   = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ lookup_data_id: '', lookup_type_id: '', value: '', active: true })
const form   = reactive(blank())
const errors = reactive({})

// ── Computed ─────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const pageStart  = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const pageEnd    = computed(() => Math.min(page.value * PAGE_SIZE, total.value))
const modalTitle = computed(() => ({
  add:  'Add Lookup Value',
  edit: 'Edit Lookup Value',
  view: 'View Lookup Value',
})[modalMode.value] ?? 'Lookup Value')

// ── Data loading ──────────────────────────────────────────────────────────────
function buildParams() {
  const params = { page: page.value }
  if (filterType.value) params.type_id = filterType.value
  return params
}

function fetchLookupData() {
  store.fetchAll(buildParams())
}

// ── Filter dropdown helpers ───────────────────────────────────────────────────
function calcDropdownStyle(el) {
  if (!el) return {}
  const r = el.getBoundingClientRect()
  return { top: `${r.bottom + 2}px`, left: `${r.left}px`, width: `${r.width}px` }
}

function openTypeDropdown() {
  typeDropdownStyle.value = calcDropdownStyle(typeInputRef.value)
  typeDropdownOpen.value  = true
}

function pickType(t) {
  filterType.value      = t.lookup_type_id
  typeSearch.value      = t.name
  typeDropdownOpen.value = false
}

function clearTypeFilter() {
  filterType.value      = ''
  typeSearch.value      = ''
  typeDropdownOpen.value = false
}

function onTypeBlur() {
  setTimeout(() => {
    typeDropdownOpen.value = false
    typeSearch.value = filterType.value
      ? (lookupTypes.value.find(t => t.lookup_type_id === filterType.value)?.name ?? '')
      : ''
  }, 150)
}

// ── Search / pagination ───────────────────────────────────────────────────────
function doSearch()    { page.value = 1; fetchLookupData() }
function changePage(n) { page.value = n; fetchLookupData() }
function clearFilters() { filterType.value = ''; typeSearch.value = ''; page.value = 1; fetchLookupData() }

// ── Modal helpers ─────────────────────────────────────────────────────────────
function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value = ''
}

function openAdd() {
  reset()
  modalMode.value = 'add'
  modalOpen.value = true
}

function openEdit(row) {
  reset()
  Object.assign(form, {
    lookup_data_id: row.lookup_data_id,
    lookup_type_id: row.lookup_type_id,
    value:          row.lookup_data_value,
    active:         row.active,
  })
  modalMode.value = 'edit'
  modalOpen.value = true
}

function openView(row) {
  reset()
  Object.assign(form, {
    lookup_data_id: row.lookup_data_id,
    lookup_type_id: row.lookup_type_id,
    value:          row.lookup_data_value,
    active:         row.active,
  })
  modalMode.value = 'view'
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false; reset() }

function openDelete(row) {
  deleteTarget.value = row
  deleteOpen.value   = true
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.lookup_type_id) { errors.lookup_type_id = 'Please select a type'; ok = false }
  if (!form.value)           { errors.value = 'Please enter a value'; ok = false }
  return ok
}

watch(() => form.lookup_type_id, v => { if (errors.lookup_type_id && v) delete errors.lookup_type_id })
watch(() => form.value,          v => { if (errors.value && v?.trim()) delete errors.value })

// ── Save (create / update) ────────────────────────────────────────────────────
async function saveValue() {
  if (!validate()) return
  modalError.value = ''

  const isAdd = modalMode.value === 'add'
  const payload = isAdd
    ? { lookup_type_id: form.lookup_type_id, value: form.value }
    : { value: form.value, active: form.active }

  try {
    if (isAdd) {
      await store.createValue(payload)
    } else {
      await store.updateValue(form.lookup_data_id, payload)
    }
    fetchLookupData()
    closeModal()
    await swal.success(isAdd ? 'Lookup value created successfully.' : 'Lookup value updated successfully.')
  } catch (err) {
    const data = err?.data
    const firstError = data?.value || data?.lookup_type_id || data?.detail
      || (data && Object.values(data).flat()[0]) || err?.message || 'Save failed.'
    modalError.value = String(firstError)
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function confirmDelete() {
  try {
    await store.removeValue(deleteTarget.value.lookup_data_id)
    fetchLookupData()
  } catch (err) {
    store.error = err?.data?.detail || 'Delete failed. Please try again.'
  } finally {
    deleteOpen.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchTypes()
  fetchLookupData()
})
</script>

<style scoped>
.searchable-wrap { position: relative; }
</style>

<style>
/* Teleported dropdown renders at <body> level — cannot be scoped */
.searchable-dropdown-teleport {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}
.searchable-option {
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
  color: #111827;
}
.searchable-option:hover,
.searchable-option.selected { background: #f3f4f6; }
.searchable-option--clear   { color: #6b7280; font-style: italic; }
.searchable-empty           { padding: 8px 12px; font-size: 13px; color: #9ca3af; }
</style>
