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
          <select v-model="filterType">
            <option value="">All</option>
            <option v-for="t in lookupTypes" :key="t.lookup_type_id" :value="t.lookup_type_id">{{ t.name }}</option>
          </select>
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
              <td><strong>{{ row.value }}</strong></td>
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
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { useAuthStore } from '@/store/auth.js'

// ── Config ──────────────────────────────────────────────────────────────────
const LOOKUP_TYPES_API = '/api/revp/lookup/types/'
const LOOKUP_DATA_API  = '/api/revp/lookup/data/'
const PAGE_SIZE        = 25

const authStore = useAuthStore()

// ── State ────────────────────────────────────────────────────────────────────
const lookupTypes = ref([])
const rows        = ref([])
const total       = ref(0)
const page        = ref(1)

const loading    = ref(false)
const apiError   = ref('')
const modalOpen  = ref(false)
const modalMode  = ref('add')
const modalError = ref('')
const deleteOpen   = ref(false)
const deleteTarget = ref(null)
const filterType   = ref('')

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

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchLookupTypes() {
  try {
    const res = await fetch(LOOKUP_TYPES_API, { headers: { ...authStore.getAuthHeaders() } })
    if (!res.ok) return
    const json = await res.json()
    lookupTypes.value = json.results ?? []
  } catch {
    // non-critical — table filter just won't populate
  }
}

async function fetchLookupData() {
  loading.value = true
  apiError.value = ''
  try {
    const params = new URLSearchParams({ page: page.value, page_size: PAGE_SIZE })
    if (filterType.value) params.set('type_id', filterType.value)

    const res = await fetch(`${LOOKUP_DATA_API}?${params}`, {
      headers: { ...authStore.getAuthHeaders() },
    })
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
    const json = await res.json()
    rows.value  = json.results ?? []
    total.value = json.total   ?? 0
  } catch {
    apiError.value = 'Failed to load lookup values. Please try again.'
    rows.value  = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ── Search / pagination ───────────────────────────────────────────────────────
function doSearch()    { page.value = 1; fetchLookupData() }
function changePage(n) { page.value = n; fetchLookupData() }
function clearFilters() { filterType.value = ''; page.value = 1; fetchLookupData() }

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
    value:          row.value,
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
    value:          row.value,
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

// ── Save (create / update) ────────────────────────────────────────────────────
async function saveValue() {
  if (!validate()) return
  modalError.value = ''

  const isAdd = modalMode.value === 'add'

  const payload = isAdd
    ? { lookup_type_id: form.lookup_type_id, value: form.value }
    : { value: form.value, active: form.active }

  const url    = isAdd ? LOOKUP_DATA_API : `${LOOKUP_DATA_API}${form.lookup_data_id}/`
  const method = isAdd ? 'POST' : 'PUT'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      // Surface the first field error or generic detail
      const firstError = json.value || json.lookup_type_id || json.detail
        || Object.values(json).flat()[0] || 'Save failed.'
      modalError.value = String(firstError)
      return
    }

    await fetchLookupData()
    closeModal()
  } catch {
    modalError.value = 'Network error. Please try again.'
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function confirmDelete() {
  apiError.value = ''
  try {
    const res = await fetch(`${LOOKUP_DATA_API}${deleteTarget.value.lookup_data_id}/`, {
      method: 'DELETE',
      headers: { ...authStore.getAuthHeaders() },
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      apiError.value = json.detail || 'Delete failed.'
      deleteOpen.value = false
      return
    }
    await fetchLookupData()
  } catch {
    apiError.value = 'Delete failed. Please try again.'
  } finally {
    deleteOpen.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchLookupTypes()
  fetchLookupData()
})
</script>
