<template>
  <AppLayout>
    <!-- Page Header -->
    <div class="page-header">
      <div><h1 class="page-title">Service Type Management</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <a href="#" @click.prevent>Station Management</a> /
        <span class="breadcrumb-active">Service Type Management</span>
      </div>
    </div>

    <!-- API Error Banner -->
    <div v-if="apiError" class="alert alert-danger mb-md" style="padding:0.75rem 1rem;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
      {{ apiError }}
    </div>

    <!-- Filters Card -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Service Type Name</label>
          <input v-model.trim="filterName" type="text" placeholder="Search by name…" @keyup.enter="doSearch" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="filterStatus">
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Disabled</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear Filters</button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Service Types
          <span v-if="!loading" class="text-muted" style="font-weight:400;font-size:0.875rem;">({{ total }})</span>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Service Type</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center" style="padding:2rem 0;color:#6b7280;">
        Loading…
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Short Code</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-state-icon">🚆</div>
                  <p class="empty-state-title">No service types found</p>
                  <p class="empty-state-desc" style="color:#6b7280;font-size:0.875rem;">
                    {{ filterName || filterStatus !== '' ? 'Try adjusting your filters.' : 'Add a service type to get started.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.service_id">
              <td><strong>{{ row.name }}</strong></td>
              <td><span class="badge badge-primary">{{ row.short_code }}</span></td>
              <td>
                <span :class="row.service_status === 1 ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ row.service_status === 1 ? 'Active' : 'Disabled' }}
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
      <div v-if="totalPages > 1" class="flex justify-between items-center mt-md" style="font-size:0.875rem;">
        <span style="color:#6b7280;">
          Showing {{ pageStart }}–{{ pageEnd }} of {{ total }}
        </span>
        <div class="flex gap-xs">
          <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="changePage(page - 1)">‹ Prev</button>
          <span class="btn btn-secondary btn-sm" style="cursor:default;pointer-events:none;">
            {{ page }} / {{ totalPages }}
          </span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="changePage(page + 1)">Next ›</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit / View Modal -->
    <AdminModal
      v-if="modalOpen"
      :title="modalTitle"
      size="md"
      :mode="modalMode"
      @close="closeModal"
      @save="saveType"
    >
      <div class="form-group">
        <label class="form-label">Name <span class="req">*</span></label>
        <input
          v-model.trim="form.name"
          :disabled="modalMode === 'view'"
          placeholder="e.g. Intercity"
          maxlength="240"
        />
        <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Short Code <span class="req">*</span></label>
        <input
          v-model.trim="form.short_code"
          :disabled="modalMode === 'view'"
          placeholder="e.g. IC"
          maxlength="10"
          style="text-transform:uppercase"
          @input="form.short_code = form.short_code.toUpperCase()"
        />
        <span v-if="errors.short_code" class="form-error">{{ errors.short_code }}</span>
      </div>

      <div class="form-group inline-row">
        <label class="form-label">Status</label>
        <label class="toggle">
          <input
            type="checkbox"
            v-model="form.service_status"
            :true-value="1"
            :false-value="0"
            :disabled="modalMode === 'view'"
          />
          <span class="toggle-track"></span>
        </label>
        <span style="margin-left:0.5rem;font-size:0.875rem;color:#6b7280;">
          {{ form.service_status === 1 ? 'Active' : 'Disabled' }}
        </span>
      </div>

      <!-- Modal-level error -->
      <div v-if="modalError" style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;color:#b91c1c;font-size:0.875rem;">
        {{ modalError }}
      </div>
    </AdminModal>

    <!-- Delete Confirmation -->
    <ConfirmDelete
      v-if="deleteOpen"
      title="Delete Service Type"
      :detail="deleteTarget?.name"
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

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = '/api/v1/revp/service-types'
const DEFAULT_TOC_ID = '7EM3E7A8-1FC4-47F5-A6207F47F44746E7'

const authStore = useAuthStore()

/** Returns the active TOC ID from the auth store, falling back to default. */
function getTocId() {
  return authStore.user?.toc_id || DEFAULT_TOC_ID
}

// ── State ─────────────────────────────────────────────────────────────────────
const rows     = ref([])
const total    = ref(0)
const page     = ref(1)
const pageSize = ref(25)

const filterName   = ref('')
const filterStatus = ref('')

const loading    = ref(false)
const apiError   = ref('')
const modalOpen  = ref(false)
const modalMode  = ref('add')
const modalError = ref('')
const deleteOpen   = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ service_id: '', name: '', short_code: '', service_status: 1 })
const form   = reactive(blank())
const errors = reactive({})

// ── Computed ──────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageStart  = computed(() => (page.value - 1) * pageSize.value + 1)
const pageEnd    = computed(() => Math.min(page.value * pageSize.value, total.value))

const modalTitle = computed(() => ({
  add:  'Add Service Type',
  edit: 'Edit Service Type',
  view: 'View Service Type',
})[modalMode.value] ?? 'Service Type')

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value = true
  apiError.value = ''
  try {
    const params = new URLSearchParams({
      toc_id:    getTocId(),
      page:      page.value,
      page_size: pageSize.value,
    })
    if (filterName.value)        params.set('name',   filterName.value)
    if (filterStatus.value !== '') params.set('status', filterStatus.value)

    const res = await fetch(`${API_BASE}/?${params}`)
    if (!res.ok) throw new Error(`Server returned ${res.status}`)

    const json = await res.json()
    rows.value  = json.results ?? []
    total.value = json.total   ?? 0
  } catch (e) {
    apiError.value = 'Failed to load service types. Please try again.'
    rows.value  = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function doSearch()    { page.value = 1; fetchAll() }
function changePage(n) { page.value = n; fetchAll() }

function clearFilters() {
  filterName.value   = ''
  filterStatus.value = ''
  page.value = 1
  fetchAll()
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value = ''
}

function openAdd()       { reset(); modalMode.value = 'add';  modalOpen.value = true }
function openEdit(row)   { reset(); Object.assign(form, { ...row }); modalMode.value = 'edit'; modalOpen.value = true }
function openView(row)   { reset(); Object.assign(form, { ...row }); modalMode.value = 'view'; modalOpen.value = true }
function closeModal()    { modalOpen.value = false; reset() }
function openDelete(row) { deleteTarget.value = row; deleteOpen.value = true }

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.name)       { errors.name       = 'Name is required';       ok = false }
  if (!form.short_code) { errors.short_code = 'Short code is required'; ok = false }
  return ok
}

// ── Save (create / update) ────────────────────────────────────────────────────
async function saveType() {
  if (!validate()) return
  modalError.value = ''

  const payload = {
    name:           form.name,
    short_code:     form.short_code.toUpperCase(),
    service_status: form.service_status,
    toc_id:         getTocId(),
  }

  try {
    const isAdd = modalMode.value === 'add'
    const url   = isAdd ? `${API_BASE}/` : `${API_BASE}/${form.service_id}/`
    const res   = await fetch(url, {
      method:  isAdd ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      // DRF returns field errors as objects or a `detail` string
      const firstError = json.detail || Object.values(json).flat()[0] || 'Save failed.'
      modalError.value = firstError
      return
    }

    await fetchAll()
    closeModal()
  } catch {
    modalError.value = 'Network error. Please try again.'
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function confirmDelete() {
  apiError.value = ''
  try {
    const res = await fetch(`${API_BASE}/${deleteTarget.value.service_id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      apiError.value = json.detail || 'Delete failed.'
      deleteOpen.value = false
      return
    }
    // Remove instantly from local list — no round-trip needed
    const idx = rows.value.findIndex(r => r.service_id === deleteTarget.value.service_id)
    if (idx !== -1) {
      rows.value.splice(idx, 1)
      total.value = Math.max(0, total.value - 1)
    }
    // If we emptied the current page and there are more pages, go back one
    if (rows.value.length === 0 && page.value > 1) {
      page.value--
      await fetchAll()
    }
  } catch {
    apiError.value = 'Delete failed. Please try again.'
  } finally {
    deleteOpen.value = false
  }
}

onMounted(fetchAll)
</script>
