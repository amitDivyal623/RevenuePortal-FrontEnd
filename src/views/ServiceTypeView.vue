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
            <tr v-if="pagedRows.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-state-icon">🚆</div>
                  <p class="empty-state-title">No service types found</p>
                  <p class="empty-state-desc" style="color:#6b7280;font-size:0.875rem;">
                    {{ activeFilterName || activeFilterStatus !== '' ? 'Try adjusting your filters.' : 'Add a service type to get started.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="row in pagedRows" :key="row.service_id">
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
          <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="page--">‹ Prev</button>
          <span class="btn btn-secondary btn-sm" style="cursor:default;pointer-events:none;">
            {{ page }} / {{ totalPages }}
          </span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="page++">Next ›</button>
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
      <!-- Loading indicator while fetching record by ID -->
      <div v-if="modalLoading" style="text-align:center;padding:1rem 0;color:#6b7280;">
        Loading…
      </div>

      <template v-if="!modalLoading">
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

        <!-- Status: hidden in Add mode (sent as Active by default); shown in Edit/View modes -->
        <div v-if="modalMode !== 'add'" class="form-group inline-row">
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
      </template>

      <!-- Footer slot: disable Save while loading -->
      <template #footer>
        <template v-if="modalMode === 'view'">
          <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
        </template>
        <template v-else>
          <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="modalLoading">Save</button>
        </template>
      </template>
    </AdminModal>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { useServiceTypesStore } from '@/store/service-types.store.js'
import { swal } from '@/utils/swal.js'

const store = useServiceTypesStore()

// ── State ─────────────────────────────────────────────────────────────────────
const allRows  = computed(() => store.rows)
const loading  = computed(() => store.loading)
const apiError = computed(() => store.error)

const page     = ref(1)
const pageSize = ref(25)

// Filter inputs (typed by user — only applied on Search click)
const filterName   = ref('')
const filterStatus = ref('')

// Active filters (committed on Search click)
const activeFilterName   = ref('')
const activeFilterStatus = ref('')

// Client-side filter + pagination (list endpoint returns full array)
const filteredRows = computed(() => {
  let r = allRows.value
  if (activeFilterName.value)
    r = r.filter(x => x.name.toLowerCase().includes(activeFilterName.value.toLowerCase()))
  if (activeFilterStatus.value !== '')
    r = r.filter(x => String(x.service_status) === activeFilterStatus.value)
  return r
})

const total      = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageStart  = computed(() => (page.value - 1) * pageSize.value + 1)
const pageEnd    = computed(() => Math.min(page.value * pageSize.value, total.value))
const pagedRows  = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const modalOpen    = ref(false)
const modalMode    = ref('add')
const modalError   = ref('')
const modalLoading = ref(false)

const blank = () => ({ service_id: '', name: '', short_code: '', service_status: 1 })
const form   = reactive(blank())
const errors = reactive({})

// ── Computed ──────────────────────────────────────────────────────────────────
const modalTitle = computed(() => ({
  add:  'Add Service Type',
  edit: 'Edit Service Type',
  view: 'View Service Type',
})[modalMode.value] ?? 'Service Type')

// ── Fetch ─────────────────────────────────────────────────────────────────────
function fetchAll() {
  store.fetchAll()
}

// Search runs client-side — no re-fetch needed
function doSearch() {
  activeFilterName.value   = filterName.value
  activeFilterStatus.value = filterStatus.value
  page.value = 1
}

function clearFilters() {
  filterName.value         = ''
  filterStatus.value       = ''
  activeFilterName.value   = ''
  activeFilterStatus.value = ''
  page.value = 1
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value   = ''
  modalLoading.value = false
}

function openAdd() {
  reset()
  modalMode.value = 'add'
  modalOpen.value = true
}

async function openEdit(row) {
  reset()
  Object.assign(form, { ...row })
  modalMode.value    = 'edit'
  modalLoading.value = true
  modalOpen.value    = true
  try {
    const fresh = await store.fetchById(row.service_id)
    Object.assign(form, { ...fresh })
  } catch {
    // keep list data if individual fetch fails
  } finally {
    modalLoading.value = false
  }
}

function openView(row)   { reset(); Object.assign(form, { ...row }); modalMode.value = 'view'; modalOpen.value = true }
function closeModal()    { modalOpen.value = false; reset() }
// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.name)       { errors.name       = 'Name is required';       ok = false }
  if (!form.short_code) { errors.short_code = 'Short code is required'; ok = false }
  return ok
}

watch(() => form.name, v => { if (errors.name && v?.trim()) delete errors.name })
watch(() => form.short_code, v => { if (errors.short_code && v?.trim()) delete errors.short_code })

// ── Save (create / update) ────────────────────────────────────────────────────
async function saveType() {
  if (!validate()) return
  modalError.value = ''

  const isAdd = modalMode.value === 'add'
  const payload = {
    service_name:   form.name,                            // backend expects service_name
    short_code:     form.short_code.toUpperCase(),
    service_status: isAdd ? 1 : form.service_status,
  }

  try {
    if (isAdd) {
      await store.createServiceType(payload)
    } else {
      await store.updateServiceType(form.service_id, payload)
    }
    fetchAll()
    closeModal()
    await swal.success(isAdd ? 'Service type created successfully.' : 'Service type updated successfully.')
  } catch (err) {
    const data = err?.data
    modalError.value = data?.detail || (data && Object.values(data).flat()[0]) || err?.message || 'Save failed.'
  }
}

onMounted(fetchAll)
</script>
