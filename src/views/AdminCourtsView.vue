<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Courts</h1></div>
      <div class="page-actions">
        <div class="breadcrumb">
          <a href="#" @click.prevent>Home</a> /
          <a href="#" @click.prevent>{{ parentLabel }}</a> /
          <span class="breadcrumb-active">Courts</span>
        </div>
        <button class="btn-add" @click="openAddModal">ADD COURT</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Court Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input v-model="filters.name" type="text" placeholder="Court name" maxlength="200" />
        </div>
        <div class="form-group">
          <label class="form-label">Code</label>
          <input v-model="filters.code" type="text" placeholder="Code" maxlength="50" />
        </div>
        <div class="form-group">
          <label class="form-label">Area</label>
          <input v-model="filters.area" type="text" placeholder="Area" maxlength="50" />
        </div>
      </div>
      <div class="flex gap-sm" style="justify-content: flex-end; margin-top: 14px">
        <button class="btn-search" @click="applyFilters">SEARCH</button>
        <button class="btn-reset" @click="resetFilters">RESET</button>
      </div>
    </div>

    <!-- List error banner -->
    <div v-if="store.error" class="error-banner">{{ store.error }}</div>

    <!-- Courts table -->
    <div class="card card-padded">
      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('name')" class="sortable">Name {{ sortIcon('name') }}</th>
              <th @click="sort('code')" class="sortable">Code {{ sortIcon('code') }}</th>
              <th @click="sort('area')" class="sortable">Area {{ sortIcon('area') }}</th>
              <th>Active</th>
              <th style="text-align: right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in courts" :key="row.court_id">
              <td>{{ row.name }}</td>
              <td><span class="badge badge-primary">{{ row.code }}</span></td>
              <td>{{ row.area }}</td>
              <td>
                <span :class="`badge badge-${row.active ? 'success' : 'neutral'}`">
                  {{ row.active ? 'Yes' : 'No' }}
                </span>
              </td>
              <td style="text-align: right">
                <div class="flex gap-xs" style="justify-content: flex-end">
                  <button class="edit-link" @click="openEditModal(row.court_id)">Edit</button>
                  <button class="delete-link" @click="openDeleteModal(row)">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="courts.length === 0">
              <td colspan="5">
                <div class="empty-state">
                  <div class="empty-state-icon">⚖️</div>
                  <p class="empty-state-title">No courts found</p>
                  <p class="empty-state-desc">Try adjusting your filters or click ADD COURT.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-meta">
          Showing {{ rangeStart }} to {{ rangeEnd }} of {{ totalRecords.toLocaleString() }} entries
        </span>
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Previous</button>
        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
      </div>
    </div>

    <!-- Add / Edit court modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card modal-card-wide" role="dialog" aria-labelledby="courtModalTitle">
        <div class="modal-header">
          <h2 id="courtModalTitle" class="modal-title">
            {{ modalMode === 'edit' ? 'Edit Court' : 'Add Court' }}
          </h2>
          <button class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <!-- Court Info -->
          <fieldset class="legend-group">
            <legend>Court Info</legend>
            <div class="modal-grid">
              <div class="field">
                <label>Name <span class="req">*</span></label>
                <input v-model="form.name" type="text" maxlength="200" />
              </div>
              <div class="field">
                <label>Code <span class="req">*</span></label>
                <input v-model="form.code" type="text" maxlength="50" />
              </div>
              <div class="field">
                <label>Area <span class="req">*</span></label>
                <input v-model="form.area" type="text" maxlength="50" />
              </div>
              <div class="field field-inline">
                <label class="check-row">
                  <input type="checkbox" v-model="form.active" />
                  <span>Active</span>
                </label>
                <label class="check-row">
                  <input type="checkbox" v-model="form.is_hide_filter_lists" />
                  <span>Hide from filter lists</span>
                </label>
              </div>
              <div class="field field-span">
                <label class="check-row">
                  <input type="checkbox" v-model="form.address_for_admin" />
                  <span>Use Court Address for Admin</span>
                </label>
              </div>
            </div>
          </fieldset>

          <!-- Court Address -->
          <fieldset class="legend-group">
            <legend>Court Address</legend>
            <div class="modal-grid">
              <div class="field">
                <label>Postcode <span class="req">*</span></label>
                <input v-model="form.court_address.postcode" type="text" maxlength="10" />
              </div>
              <div class="field">
                <label>House Name</label>
                <input v-model="form.court_address.house_name" type="text" maxlength="30" />
              </div>
              <div class="field">
                <label>House Number</label>
                <input v-model="form.court_address.house_no" type="text" maxlength="30" />
              </div>
              <div class="field">
                <label>Street <span class="req">*</span></label>
                <input v-model="form.court_address.street" type="text" maxlength="30" />
              </div>
              <div class="field">
                <label>Locality <span class="req">*</span></label>
                <input v-model="form.court_address.locality" type="text" maxlength="30" />
              </div>
              <div class="field">
                <label>Town <span class="req">*</span></label>
                <input v-model="form.court_address.town" type="text" maxlength="30" />
              </div>
              <div class="field field-span">
                <label>Country <span class="req">*</span></label>
                <input v-model="form.court_address.country_name" type="text" maxlength="40" />
              </div>
            </div>
            <p class="hint">Either House Name or House Number must be filled.</p>
          </fieldset>

          <!-- Admin Address (disabled when "Use Court Address for Admin" is ticked) -->
          <fieldset class="legend-group" :class="{ disabled: form.address_for_admin }">
            <legend>Admin Address</legend>
            <div class="modal-grid">
              <div class="field">
                <label>Postcode <span class="req" v-if="!form.address_for_admin">*</span></label>
                <input v-model="form.admin_address.postcode" type="text" maxlength="10" :disabled="form.address_for_admin" />
              </div>
              <div class="field">
                <label>House Name</label>
                <input v-model="form.admin_address.house_name" type="text" maxlength="30" :disabled="form.address_for_admin" />
              </div>
              <div class="field">
                <label>House Number</label>
                <input v-model="form.admin_address.house_no" type="text" maxlength="30" :disabled="form.address_for_admin" />
              </div>
              <div class="field">
                <label>Street <span class="req" v-if="!form.address_for_admin">*</span></label>
                <input v-model="form.admin_address.street" type="text" maxlength="30" :disabled="form.address_for_admin" />
              </div>
              <div class="field">
                <label>Locality <span class="req" v-if="!form.address_for_admin">*</span></label>
                <input v-model="form.admin_address.locality" type="text" maxlength="30" :disabled="form.address_for_admin" />
              </div>
              <div class="field">
                <label>Town <span class="req" v-if="!form.address_for_admin">*</span></label>
                <input v-model="form.admin_address.town" type="text" maxlength="30" :disabled="form.address_for_admin" />
              </div>
              <div class="field field-span">
                <label>Country <span class="req" v-if="!form.address_for_admin">*</span></label>
                <input v-model="form.admin_address.country_name" type="text" maxlength="40" :disabled="form.address_for_admin" />
              </div>
            </div>
            <p v-if="form.address_for_admin" class="hint">Admin address will be copied from Court Address on save.</p>
          </fieldset>

          <p v-if="saveError" class="form-error">{{ saveError }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="saving">CANCEL</button>
          <button class="btn-save" @click="saveCourt" :disabled="saving">
            {{ saving ? 'SAVING…' : 'SAVE' }}
          </button>
        </div>
      </div>
    </div>
    <!-- Delete confirmation modal -->
    <div v-if="deleteOpen" class="modal-backdrop" @click.self="deleteOpen = false">
      <div class="modal-card" role="dialog">
        <div class="modal-header">
          <h2 class="modal-title">Delete Court Details</h2>
          <button class="modal-close" @click="deleteOpen = false" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <strong>Do you want to remove this data permanently?</strong>
          <p style="margin-top: 8px; font-size: 13px; color: var(--text-muted)">
            "{{ deleteTarget?.name }}" ({{ deleteTarget?.code }})
          </p>
          <p v-if="deleteError" class="form-error">{{ deleteError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="deleteOpen = false" :disabled="deleting">CANCEL</button>
          <button class="btn-save" style="background: var(--danger)" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'DELETING…' : 'YES, DELETE' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAdminCourtsStore } from '@/store/admin-courts.store.js'

const store = useAdminCourtsStore()

const parentLabel = 'Revenue Protection Admin'

// Filters / paging / sort state
const filters = reactive({ name: '', code: '', area: '' })
const applied = reactive({ ...filters })
const perPage = ref(10)
const currentPage = ref(1)
const sortKey = ref('code')
const sortDir = ref('asc')

// Table data
const courts       = computed(() => store.courts)
const totalRecords = computed(() => store.totalRecords)

const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / perPage.value)))
const rangeStart = computed(() => totalRecords.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(currentPage.value * perPage.value, totalRecords.value))

const pageNumbers = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) pages.push(i)
  }
  return pages.slice(0, 7)
})

function buildListParams() {
  const params = {
    page: String(currentPage.value),
    page_size: String(perPage.value),
    order_by: sortKey.value,
    direction: sortDir.value,
  }
  if (applied.name) params.name = applied.name
  if (applied.code) params.code = applied.code
  if (applied.area) params.area = applied.area
  return params
}

function loadCourts() {
  store.fetchCourts(buildListParams())
}

onMounted(loadCourts)
watch([currentPage, perPage, sortKey, sortDir], loadCourts)

function applyFilters() {
  Object.assign(applied, { ...filters })
  currentPage.value = 1
  loadCourts()
}
function resetFilters() {
  Object.assign(filters, { name: '', code: '', area: '' })
  Object.assign(applied, { name: '', code: '', area: '' })
  currentPage.value = 1
  loadCourts()
}

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

// Add / Edit modal
const showModal = ref(false)
const modalMode = ref('add')
const editingCourtId = ref(null)
const saving = ref(false)
const saveError = ref('')

const emptyAddress = () => ({
  postcode: '', house_name: '', house_no: '',
  street: '', locality: '', town: '', country_name: ''
})

const form = reactive({
  name: '',
  code: '',
  area: '',
  active: true,
  is_hide_filter_lists: false,
  address_for_admin: false,
  court_address: emptyAddress(),
  admin_address: emptyAddress()
})

function resetForm() {
  form.name = ''
  form.code = ''
  form.area = ''
  form.active = true
  form.is_hide_filter_lists = false
  form.address_for_admin = false
  Object.assign(form.court_address, emptyAddress())
  Object.assign(form.admin_address, emptyAddress())
  saveError.value = ''
}

function openAddModal() {
  modalMode.value = 'add'
  editingCourtId.value = null
  resetForm()
  showModal.value = true
}

async function openEditModal(courtId) {
  modalMode.value = 'edit'
  editingCourtId.value = courtId
  resetForm()
  showModal.value = true
  try {
    const data = await store.fetchCourtById(courtId)
    form.name = data.name ?? ''
    form.code = data.code ?? ''
    form.area = data.area ?? ''
    form.active = !!data.active
    form.is_hide_filter_lists = !!data.is_hide_filter_lists
    form.address_for_admin = !!data.address_for_admin
    const ca = data.court_address || {}
    const aa = data.admin_address || {}
    Object.assign(form.court_address, {
      postcode: ca.postcode || '', house_name: ca.house_name || '',
      house_no: ca.house_no || '', street: ca.street || '',
      locality: ca.locality || '', town: ca.town || '', country_name: ca.country_name || ''
    })
    Object.assign(form.admin_address, {
      postcode: aa.postcode || '', house_name: aa.house_name || '',
      house_no: aa.house_no || '', street: aa.street || '',
      locality: aa.locality || '', town: aa.town || '', country_name: aa.country_name || ''
    })
  } catch (err) {
    saveError.value = 'Could not load court — please close and try again.'
  }
}

function closeModal() {
  if (saving.value) return
  showModal.value = false
}

function buildPayload() {
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    area: form.area.trim(),
    active: form.active ? 1 : 0,
    is_hide_filter_lists: form.is_hide_filter_lists ? 1 : 0,
    address_for_admin: form.address_for_admin ? 1 : 0,
    court_address: { ...form.court_address },
  }
  if (!form.address_for_admin) {
    payload.admin_address = { ...form.admin_address }
  }
  return payload
}

function extractErrorMessage(err) {
  const data = err?.data
  if (!data) return err?.message || 'Please try again.'
  if (typeof data === 'string') return data
  const msgs = Object.entries(data).map(([k, v]) => {
    const text = Array.isArray(v) ? v.join(', ') : String(v)
    return k === 'detail' ? text : `${k}: ${text}`
  })
  return msgs.join(' | ')
}

async function saveCourt() {
  saveError.value = ''
  saving.value = true
  try {
    const payload = buildPayload()
    if (modalMode.value === 'edit' && editingCourtId.value) {
      await store.updateCourt(editingCourtId.value, payload)
    } else {
      await store.createCourt(payload)
    }
    showModal.value = false
    loadCourts()
  } catch (err) {
    saveError.value = extractErrorMessage(err)
  } finally {
    saving.value = false
  }
}

// Delete state
const deleteOpen   = ref(false)
const deleteTarget = ref(null)
const deleting     = ref(false)
const deleteError  = ref('')

function openDeleteModal(row) {
  deleteTarget.value = row
  deleteError.value  = ''
  deleteOpen.value   = true
}

async function confirmDelete() {
  const id = deleteTarget.value?.court_id
  if (!id) return
  deleting.value    = true
  deleteError.value = ''
  try {
    await store.removeCourt(id)
    deleteOpen.value = false
    deleteTarget.value = null
    if (courts.value.length === 1 && currentPage.value > 1) currentPage.value--
    loadCourts()
  } catch (err) {
    deleteError.value = extractErrorMessage(err)
  } finally {
    deleting.value = false
  }
}

function onEscKey(e) {
  if (e.key === 'Escape' && showModal.value && !saving.value) closeModal()
}
watch(showModal, (open) => {
  if (open) document.addEventListener('keydown', onEscKey)
  else document.removeEventListener('keydown', onEscKey)
})
onUnmounted(() => document.removeEventListener('keydown', onEscKey))
</script>

<style scoped>
.error-banner {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-add {
  padding: 8px 18px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-add:hover { background: #128968; }

.btn-search {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-search:hover { background: #128968; }

.btn-reset {
  padding: 8px 22px;
  background: var(--danger);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-reset:hover { background: #dc2626; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }

.edit-link {
  color: var(--primary);
  font-weight: 500;
  font-size: 12px;
  background: none;
  padding: 0;
}
.edit-link:hover { text-decoration: underline; }

.delete-link {
  color: var(--danger);
  font-weight: 500;
  font-size: 12px;
  background: none;
  padding: 0;
}
.delete-link:hover { text-decoration: underline; }

.gap-xs { gap: 10px; }

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30, 34, 54, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-card {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  max-width: 520px;
  box-shadow: 0 12px 40px rgba(30, 34, 54, 0.2);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}
.modal-card-wide { max-width: 760px; }
@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: none; opacity: 1; }
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 600; color: var(--text-strong); }
.modal-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: var(--text-light);
  border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-strong); }

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.legend-group {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px 14px;
}
.legend-group.disabled { opacity: 0.65; background: var(--bg-page); }
.legend-group legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 12px; color: var(--text-default); font-weight: 500; }
.field-span { grid-column: 1 / -1; }
.field-inline {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.check-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-default);
}

.req { color: var(--danger); margin-left: 2px; }

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-light);
}

.form-error {
  color: var(--danger);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 22px;
  background: var(--danger);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-cancel:hover:not(:disabled) { background: #dc2626; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-save {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-save:hover:not(:disabled) { background: #128968; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 720px) {
  .modal-grid { grid-template-columns: 1fr; }
}
</style>
