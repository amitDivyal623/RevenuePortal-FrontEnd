<template>
  <AppLayout>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Courts</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Courts</span>
      </div>
    </div>

    <!-- Filters card -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Court Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="filterName">Name</label>
          <input id="filterName" v-model.trim="filterName" type="text" placeholder="Search by name" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label" for="filterActive">Status</label>
          <select id="filterActive" v-model="filterActive">
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button type="button" class="btn btn-primary btn-sm" @click="search">Search</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <!-- Data card -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Courts
          <span v-if="!loading" class="text-light" style="font-weight:400;font-size:13px">
            ({{ totalRecords }} total)
          </span>
        </div>
        <div class="flex items-center gap-sm">
          <select v-model.number="perPage" @change="onPerPageChange" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">+ Add Court</button>
        </div>
      </div>

      <div v-if="loadError" class="form-error mb-md" role="alert">{{ loadError }}</div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('code')" class="sortable">Code {{ sortIcon('code') }}</th>
              <th @click="sort('name')" class="sortable">Name {{ sortIcon('name') }}</th>
              <th @click="sort('area')" class="sortable">Area {{ sortIcon('area') }}</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" style="text-align:center;padding:24px;color:var(--text-light)">Loading…</td>
            </tr>
            <tr v-else-if="pagedRows.length === 0">
              <td colspan="5">
                <div class="empty-state">
                  <div class="empty-state-icon">⚖️</div>
                  <p class="empty-state-title">No courts found</p>
                  <p class="empty-state-desc">Try clearing filters or add a new court.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in pagedRows" :key="row.court_id">
              <td><span class="badge badge-primary">{{ row.code }}</span></td>
              <td><strong>{{ row.name }}</strong></td>
              <td class="text-muted">{{ row.area }}</td>
              <td>
                <span v-if="row.active === 1" class="badge badge-success">Active</span>
                <span v-else class="badge badge-neutral">Inactive</span>
                <span v-if="row.is_hide_filter_lists === 1" class="badge badge-warning" style="margin-left:6px">Hidden in filters</span>
              </td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button type="button" class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                  <button type="button" class="btn btn-danger btn-sm" @click="openDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--; loadCourts()">‹ Prev</button>
        <button
          v-for="p in visiblePages" :key="p"
          class="page-btn" :class="{ active: p === page }"
          @click="page = p; loadCourts()"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page === totalPages" @click="page++; loadCourts()">Next ›</button>
        <span class="page-meta">
          {{ rangeStart }}–{{ rangeEnd }} of {{ totalRecords }}
        </span>
      </div>
    </div>

    <!-- Add / Edit / View modal -->
    <div v-if="modalOpen" class="modal-overlay" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveCourt" novalidate>
          <!-- Flags row — edit/view only, hidden in add mode -->
          <div v-if="modalMode !== 'add'" class="toggle-row mb-md">
            <label class="toggle-cell">
              <input type="checkbox" v-model="form.active" :disabled="modalMode==='view'" />
              <span>Active</span>
            </label>
            <label class="toggle-cell">
              <input type="checkbox" v-model="form.hideFilterFlag" :disabled="modalMode==='view'" />
              <span>Hide From Filter Lists</span>
            </label>
          </div>

          <!-- Top row: Name, Code, Area -->
          <div class="form-row mb-md">
            <div class="form-group">
              <label class="form-label" for="m-name">Name <span class="req">*</span></label>
              <input id="m-name" v-model.trim="form.name" type="text" placeholder="Court Name" :disabled="modalMode==='view'" maxlength="200" />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="m-code">Code</label>
              <input id="m-code" v-model.trim="form.code" type="text" placeholder="Court Code" :disabled="modalMode==='view'" maxlength="50" />
            </div>
            <div class="form-group">
              <label class="form-label" for="m-area">Area</label>
              <input id="m-area" v-model.trim="form.area" type="text" placeholder="Court Area" :disabled="modalMode==='view'" maxlength="50" />
            </div>
          </div>

          <!-- Use Court Address for Admin -->
          <div class="toggle-row mb-md">
            <label class="toggle-cell">
              <input
                type="checkbox"
                v-model="form.addressForAdminFlag"
                :disabled="modalMode==='view'"
                @change="onMirrorChange"
              />
              <span>Use Court Address for Admin</span>
            </label>
          </div>

          <!-- Two-up address blocks -->
          <div class="addr-grid" :class="{ 'single-col': form.addressForAdminFlag }">
            <fieldset class="addr-box">
              <legend>Court Address</legend>
              <div class="addr-grid-inner">
                <div class="form-group">
                  <label class="form-label">Post Code</label>
                  <input v-model.trim="form.courtAddr.postcode" type="text" placeholder="Postcode" :disabled="modalMode==='view'" maxlength="10" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Name <span class="req">*</span></label>
                  <input v-model.trim="form.courtAddr.houseName" type="text" placeholder="House Name" :disabled="modalMode==='view'" maxlength="30" />
                  <span v-if="errors['court_address.house']" class="form-error">{{ errors['court_address.house'] }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">House Number</label>
                  <input v-model.trim="form.courtAddr.houseNo" type="text" placeholder="House Number" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Street</label>
                  <input v-model.trim="form.courtAddr.street" type="text" placeholder="Street" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Locality</label>
                  <input v-model.trim="form.courtAddr.locality" type="text" placeholder="Locality" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Town</label>
                  <input v-model.trim="form.courtAddr.town" type="text" placeholder="Town" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">Country</label>
                  <input v-model.trim="form.courtAddr.countryName" type="text" placeholder="Country" :disabled="modalMode==='view'" maxlength="40" />
                </div>
              </div>
            </fieldset>

            <fieldset v-if="!form.addressForAdminFlag" class="addr-box">
              <legend>Admin Address</legend>
              <div class="addr-grid-inner">
                <div class="form-group">
                  <label class="form-label">Post Code</label>
                  <input v-model.trim="form.adminAddr.postcode" type="text" placeholder="Postcode" :disabled="modalMode==='view'" maxlength="10" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Name <span class="req">*</span></label>
                  <input v-model.trim="form.adminAddr.houseName" type="text" placeholder="House Name" :disabled="modalMode==='view'" maxlength="30" />
                  <span v-if="errors['admin_address.house']" class="form-error">{{ errors['admin_address.house'] }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">House Number</label>
                  <input v-model.trim="form.adminAddr.houseNo" type="text" placeholder="House Number" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Street</label>
                  <input v-model.trim="form.adminAddr.street" type="text" placeholder="Street" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Locality</label>
                  <input v-model.trim="form.adminAddr.locality" type="text" placeholder="Locality" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">Town</label>
                  <input v-model.trim="form.adminAddr.town" type="text" placeholder="Town" :disabled="modalMode==='view'" maxlength="30" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">Country</label>
                  <input v-model.trim="form.adminAddr.countryName" type="text" placeholder="Country" :disabled="modalMode==='view'" maxlength="40" />
                </div>
              </div>
            </fieldset>
          </div>

          <div class="modal-footer">
            <p v-if="formError" class="form-error" role="alert" style="flex:1">{{ formError }}</p>
            <div class="flex gap-sm" style="margin-left:auto">
              <button v-if="modalMode==='view'" type="button" class="btn btn-secondary" @click="closeModal">Close</button>
              <template v-else>
                <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="savePending">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="savePending">
                  {{ savePending ? 'Saving…' : 'Save' }}
                </button>
              </template>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteOpen" class="modal-overlay" @click.self="deleteOpen=false" role="dialog" aria-modal="true">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2 class="modal-title">Delete Court</h2>
          <button type="button" class="modal-close" @click="deleteOpen=false" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <strong>Are you sure you want to delete this court?</strong>
          <p class="text-muted" style="margin-top:8px;font-size:13px">
            "{{ deleteTarget?.name }}" ({{ deleteTarget?.code }}) will be marked inactive and removed from active lists.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="deleteOpen=false">Cancel</button>
          <button type="button" class="btn btn-danger" :disabled="deletePending" @click="confirmDelete">
            {{ deletePending ? 'Deleting…' : 'Yes, delete' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useCourtsStore } from '@/store/courts.store.js'
import { swal } from '@/utils/swal.js'

const store = useCourtsStore()

/* ─────────────── Filter / paging / sort ─────────────── */
const filterName   = ref('')
const filterActive = ref('')
const appliedName   = ref('')
const appliedActive = ref('')

const page    = ref(1)
const perPage = ref(10)
const sortKey = ref('name')
const sortDir = ref('asc')

/* ─────────────── Table data ─────────────── */
const courts       = computed(() => store.courts)
const totalRecords = computed(() => store.totalRecords)
const loading      = computed(() => store.loading)
const loadError    = computed(() => store.error)

const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / perPage.value)))
const rangeStart = computed(() => totalRecords.value === 0 ? 0 : (page.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(page.value * perPage.value, totalRecords.value))

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur   = page.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) pages.push(i)
  }
  return pages.slice(0, 7)
})

const pagedRows = computed(() => {
  const mul = sortDir.value === 'asc' ? 1 : -1
  return [...courts.value].sort((a, b) =>
    String(a[sortKey.value] ?? '').localeCompare(String(b[sortKey.value] ?? '')) * mul
  )
})

function buildParams() {
  const params = { page: String(page.value), page_size: String(perPage.value) }
  if (appliedName.value) params.search = appliedName.value
  if (appliedActive.value !== '') params.active = appliedActive.value
  return params
}

function loadCourts() {
  store.fetchCourts(buildParams())
}

function search() {
  appliedName.value   = filterName.value
  appliedActive.value = filterActive.value
  page.value = 1
  loadCourts()
}
function clearFilters() {
  filterName.value    = ''
  filterActive.value  = ''
  appliedName.value   = ''
  appliedActive.value = ''
  page.value = 1
  loadCourts()
}
function onPerPageChange() {
  page.value = 1
  loadCourts()
}

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

// Initial load
loadCourts()

/* ─────────────── Modal state ─────────────── */
const modalOpen = ref(false)
const modalMode = ref('add')  // 'add' | 'edit' | 'view'
const formError = ref('')
const savePending   = ref(false)
const hasValidated  = ref(false)

const deleteOpen    = ref(false)
const deleteTarget  = ref(null)
const deletePending = ref(false)

const modalTitle = computed(() =>
  modalMode.value === 'add'  ? 'Add Court'  :
  modalMode.value === 'edit' ? 'Edit Court' :
                               'View Court'
)

/* ─────────────── Form ─────────────── */
const blankAddr = () => ({
  postcode: '', houseName: '', houseNo: '',
  street: '', locality: '', town: '', countryName: ''
})

const blankForm = () => ({
  court_id:          '',
  name:              '',
  code:              '',
  area:              '',
  active:            true,
  hideFilterFlag:    false,
  addressForAdminFlag: false,
  courtAddr: blankAddr(),
  adminAddr: blankAddr(),
})

const form   = reactive(blankForm())
const errors = reactive({})

function resetForm() {
  hasValidated.value = false
  form.court_id           = ''
  form.name               = ''
  form.code               = ''
  form.area               = ''
  form.active             = true
  form.hideFilterFlag     = false
  form.addressForAdminFlag = false
  Object.assign(form.courtAddr, blankAddr())
  Object.assign(form.adminAddr, blankAddr())
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
}

function addrToForm(addr) {
  if (!addr) return blankAddr()
  return {
    postcode:    addr.postcode    || '',
    houseName:   addr.house_name  || '',
    houseNo:     addr.house_no    || '',
    street:      addr.street      || '',
    locality:    addr.locality    || '',
    town:        addr.town        || '',
    countryName: addr.country_name || '',
  }
}

function formAddrToPayload(fa) {
  return {
    postcode:     fa.postcode    || null,
    house_name:   fa.houseName   || null,
    house_no:     fa.houseNo     || null,
    street:       fa.street      || null,
    locality:     fa.locality    || null,
    town:         fa.town        || null,
    country_name: fa.countryName || null,
  }
}

function loadIntoForm(row) {
  // Update scalar fields in-place so reactive watchers on nested addr objects
  // don't lose their dependency tracking when the sub-object reference changes.
  form.court_id           = row.court_id
  form.name               = row.name ?? ''
  form.code               = row.code ?? ''
  form.area               = row.area ?? ''
  form.active             = row.active === 1
  form.hideFilterFlag     = row.is_hide_filter_lists === 1
  form.addressForAdminFlag = row.address_for_admin === 1

  const ca = addrToForm(row.court_address)
  form.courtAddr.postcode    = ca.postcode
  form.courtAddr.houseName   = ca.houseName
  form.courtAddr.houseNo     = ca.houseNo
  form.courtAddr.street      = ca.street
  form.courtAddr.locality    = ca.locality
  form.courtAddr.town        = ca.town
  form.courtAddr.countryName = ca.countryName

  const aa = addrToForm(row.admin_address)
  form.adminAddr.postcode    = aa.postcode
  form.adminAddr.houseName   = aa.houseName
  form.adminAddr.houseNo     = aa.houseNo
  form.adminAddr.street      = aa.street
  form.adminAddr.locality    = aa.locality
  form.adminAddr.town        = aa.town
  form.adminAddr.countryName = aa.countryName
}

/* ─────────────── Modal handlers ─────────────── */
function openAdd() {
  resetForm()
  modalMode.value = 'add'
  modalOpen.value = true
}

async function openEdit(row) {
  resetForm()
  modalMode.value = 'edit'
  modalOpen.value = true
  try {
    const data = await store.fetchCourtById(row.court_id)
    // Suppress watchers during data population so they can't fire against a
    // partially-blank form. nextTick lets Vue flush any pending watcher queue
    // before re-enabling live validation.
    hasValidated.value = false
    loadIntoForm(data)
    await nextTick()
    // hasValidated stays false — real-time sync only activates after first save attempt
  } catch (err) {
    formError.value = 'Could not load court details — please close and try again.'
  }
}

function openView(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'view'
  modalOpen.value = true
}

function closeModal() {
  if (savePending.value) return
  modalOpen.value = false
  resetForm()
}

function openDelete(row) {
  deleteTarget.value = row
  deleteOpen.value   = true
}

/* When "Use Court Address for Admin" is ticked, mirror court → admin */
function onMirrorChange() {
  if (form.addressForAdminFlag) {
    Object.assign(form.adminAddr, { ...form.courtAddr })
  }
}

/* ─────────────── Validation ─────────────── */
function syncFormError() {
  formError.value = Object.keys(errors).length > 0 ? 'Please correct the highlighted fields' : ''
}

function validate() {
  hasValidated.value = true
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
  let ok = true

  if (!form.name?.trim()) {
    errors.name = 'Please enter a court name'
    ok = false
  }

  if (!form.courtAddr.houseName) {
    errors['court_address.house'] = 'House Name is required'
    ok = false
  }

  if (!form.addressForAdminFlag && !form.adminAddr.houseName) {
    errors['admin_address.house'] = 'House Name is required'
    ok = false
  }

  if (!ok) formError.value = 'Please correct the highlighted fields'
  return ok
}

/* Live sync — only fires after first submit attempt */
watch(() => form.name, () => {
  if (!hasValidated.value) return
  if (!form.name?.trim()) errors.name = 'Please enter a court name'
  else delete errors.name
  syncFormError()
})

function _syncCourtHouse() {
  if (!hasValidated.value) return
  if (!form.courtAddr.houseName)
    errors['court_address.house'] = 'House Name is required'
  else
    delete errors['court_address.house']
  syncFormError()
}
watch(() => form.courtAddr.houseName, _syncCourtHouse)

function _syncAdminHouse() {
  if (!hasValidated.value) return
  if (!form.addressForAdminFlag && !form.adminAddr.houseName)
    errors['admin_address.house'] = 'House Name is required'
  else
    delete errors['admin_address.house']
  syncFormError()
}
watch(() => form.adminAddr.houseName,   _syncAdminHouse)
watch(() => form.addressForAdminFlag,   _syncAdminHouse)

/* ─────────────── Save ─────────────── */
async function saveCourt() {
  if (!validate()) return
  savePending.value = true
  formError.value   = ''

  const payload = {
    name:                form.name.trim(),
    code:                form.code.trim() || null,
    area:                form.area.trim() || null,
    active:              form.active ? 1 : 0,
    is_hide_filter_lists: form.hideFilterFlag ? 1 : 0,
    address_for_admin:   form.addressForAdminFlag ? 1 : 0,
    court_address:       formAddrToPayload(form.courtAddr),
  }

  if (!form.addressForAdminFlag) {
    payload.admin_address = formAddrToPayload(form.adminAddr)
  }

  try {
    const isEdit = modalMode.value === 'edit'
    if (isEdit) {
      await store.updateCourt(form.court_id, payload)
    } else {
      await store.createCourt(payload)
    }
    modalOpen.value = false
    resetForm()
    loadCourts()
    swal.success(isEdit ? 'Court updated successfully' : 'Court added successfully')
  } catch (err) {
    const data = err?.data
    if (data && typeof data === 'object') {
      // Surface field-level errors from the backend
      Object.entries(data).forEach(([k, v]) => {
        if (k !== 'detail') errors[k] = Array.isArray(v) ? v.join('; ') : String(v)
      })
      formError.value = data.detail || 'Save failed — please check the highlighted fields.'
    } else {
      formError.value = err?.message || 'Save failed. Please try again.'
    }
  } finally {
    savePending.value = false
  }
}

/* ─────────────── Delete ─────────────── */
async function confirmDelete() {
  const id = deleteTarget.value?.court_id
  if (!id) return
  deletePending.value = true
  try {
    await store.removeCourt(id)
    deleteOpen.value   = false
    deleteTarget.value = null
    if (courts.value.length === 1 && page.value > 1) page.value--
    loadCourts()
  } catch (err) {
    console.error('[Courts] Delete failed:', err)
  } finally {
    deletePending.value = false
  }
}
</script>

<style scoped>
.req { color: var(--danger); margin-left: 2px; }

/* Toggle row */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 14px;
  background: var(--primary-tint);
  border-radius: var(--radius);
  flex-wrap: wrap;
}
.toggle-cell {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--text-default);
  cursor: pointer;
}

.form-group-full { grid-column: 1 / -1; }

/* Address block */
.addr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.addr-grid.single-col { grid-template-columns: 1fr; }
.addr-box {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px 4px;
  background: #fff;
}
.addr-box legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.addr-grid-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 34, 54, 0.42);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
  padding: 24px;
  animation: fadeIn 120ms ease-out;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.modal {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  box-shadow: 0 20px 60px rgba(30, 34, 54, 0.25);
  overflow: hidden;
  display: flex; flex-direction: column;
  max-height: 90vh;
}
.modal-sm { max-width: 440px; }
.modal-lg { max-width: 920px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: var(--primary);
  color: #fff;
}
.modal-title { font-size: 15px; font-weight: 600; }
.modal-close {
  background: transparent; color: #fff;
  font-size: 22px; line-height: 1;
  padding: 0 6px;
  border-radius: 4px;
}
.modal-close:hover { background: rgba(255,255,255,0.15); }
.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-page);
  align-items: center;
}

@media (max-width: 720px) {
  .addr-grid { grid-template-columns: 1fr; }
  .addr-grid-inner { grid-template-columns: 1fr; }
}
</style>
