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
          <label class="form-label" for="filterCode">Code</label>
          <input id="filterCode" v-model.trim="filterCode" type="text" placeholder="Search by code" maxlength="50" />
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
          Matching Courts ({{ filteredCourts.length }})
        </div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ filteredCourts.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">+ Add Court</button>
        </div>
      </div>

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
            <tr v-if="pagedRows.length === 0">
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
                <span v-if="row.active === 1" class="badge badge-neutral">Disabled</span>
                <span v-else class="badge badge-success">Active</span>
                <span v-if="row.isHideFilterLists === 1" class="badge badge-warning" style="margin-left:6px">Hidden in filters</span>
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
        <button class="page-btn" :disabled="page === 1" @click="page--">‹ Prev</button>
        <button
          v-for="p in totalPages" :key="p"
          class="page-btn" :class="{ active: p === page }"
          @click="page = p"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ filteredCourts.length }} total</span>
      </div>
    </div>

    <!-- Add / Edit / View modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveCourt" novalidate>
          <!-- Disable / Hide toggles (edit + view only — matches legacy `disable EQ 'disabled'` branch) -->
          <div v-if="modalMode !== 'add'" class="toggle-row mb-md">
            <label class="toggle-cell">
              <input type="checkbox" v-model="form.disabledFlag" :disabled="modalMode==='view'" />
              <span>Disabled</span>
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
              <input id="m-name" v-model.trim="form.name" type="text" placeholder="Court Name" :disabled="modalMode==='view'" maxlength="100" />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="m-code">Code <span class="req">*</span></label>
              <input id="m-code" v-model.trim="form.code" type="text" placeholder="Court Code" :disabled="modalMode==='view'" maxlength="20" />
              <span v-if="errors.code" class="form-error">{{ errors.code }}</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="m-area">Area</label>
              <input id="m-area" v-model.trim="form.area" type="text" placeholder="Court Area" :disabled="modalMode==='view'" maxlength="100" />
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
                  <input v-model.trim="form.courtAddr.postcode" type="text" placeholder="postcode" :disabled="modalMode==='view'" maxlength="10" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Name</label>
                  <input v-model.trim="form.courtAddr.houseName" type="text" placeholder="House Name" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Number</label>
                  <input v-model.trim="form.courtAddr.houseNo" type="text" placeholder="House Number" :disabled="modalMode==='view'" maxlength="20" />
                </div>
                <div class="form-group">
                  <label class="form-label">Street</label>
                  <input v-model.trim="form.courtAddr.street" type="text" placeholder="Street" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Locality</label>
                  <input v-model.trim="form.courtAddr.locality" type="text" placeholder="Locality" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Town</label>
                  <input v-model.trim="form.courtAddr.town" type="text" placeholder="Town" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">County</label>
                  <input v-model.trim="form.courtAddr.countryName" type="text" placeholder="County" :disabled="modalMode==='view'" maxlength="100" />
                </div>
              </div>
            </fieldset>

            <fieldset v-if="!form.addressForAdminFlag" class="addr-box">
              <legend>Admin Address</legend>
              <div class="addr-grid-inner">
                <div class="form-group">
                  <label class="form-label">Post Code</label>
                  <input v-model.trim="form.adminAddr.postcode" type="text" placeholder="postcode" :disabled="modalMode==='view'" maxlength="10" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Name</label>
                  <input v-model.trim="form.adminAddr.houseName" type="text" placeholder="House Name" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">House Number</label>
                  <input v-model.trim="form.adminAddr.houseNo" type="text" placeholder="House Number" :disabled="modalMode==='view'" maxlength="20" />
                </div>
                <div class="form-group">
                  <label class="form-label">Street</label>
                  <input v-model.trim="form.adminAddr.street" type="text" placeholder="Street" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Locality</label>
                  <input v-model.trim="form.adminAddr.locality" type="text" placeholder="Locality" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Town</label>
                  <input v-model.trim="form.adminAddr.town" type="text" placeholder="Town" :disabled="modalMode==='view'" maxlength="100" />
                </div>
                <div class="form-group form-group-full">
                  <label class="form-label">County</label>
                  <input v-model.trim="form.adminAddr.countryName" type="text" placeholder="County" :disabled="modalMode==='view'" maxlength="100" />
                </div>
              </div>
            </fieldset>
          </div>

          <div class="modal-footer">
            <p v-if="formError" class="form-error" role="alert" style="flex:1">{{ formError }}</p>
            <button v-if="modalMode==='view'" type="button" class="btn btn-secondary" @click="closeModal">Close</button>
            <template v-else>
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </template>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteOpen" class="modal-overlay" @click.self="deleteOpen=false" role="dialog" aria-modal="true">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2 class="modal-title">Delete Court Details</h2>
          <button type="button" class="modal-close" @click="deleteOpen=false" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <strong>Do you want to remove this data permanently?</strong>
          <p class="text-muted" style="margin-top:8px;font-size:13px">
            "{{ deleteTarget?.name }}" ({{ deleteTarget?.code }}) — this will permanently delete the court and its address records.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success" @click="deleteOpen=false">Cancel</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  courts as seedCourts,
  addresses as seedAddresses,
  blankAddress
} from '@/mock/courtsData.js'

/* ════════════════════════════════════════════════════════════════════════
   State — mirrors the data shape returned by the legacy
   RevpConfig.searchcourt / getcourtdata / GetCourtdetailsByid / addcourt /
   updatecourt / deletecourt endpoints so future axios integration is a
   drop-in swap.
   ════════════════════════════════════════════════════════════════════════ */
const courts    = reactive([...seedCourts])
const addresses = reactive([...seedAddresses])

const filterName = ref('')
const filterCode = ref('')

const page = ref(1)
const perPage = ref(10)
const sortKey = ref('name')
const sortDir = ref('asc')

const modalOpen = ref(false)
const modalMode = ref('add') // 'add' | 'edit' | 'view'
const formError = ref('')

const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blankForm = () => ({
  court_id: '',
  name: '',
  code: '',
  area: '',
  // checkbox proxies (booleans). Save converts to legacy 0/1.
  disabledFlag: false,        // active = 0 active, 1 disabled
  hideFilterFlag: false,      // isHideFilterLists
  addressForAdminFlag: false, // addressForAdmin = 1 means "mirror court address"
  courtAddress: '',
  adminAddress: '',
  courtAddr: blankAddress(),
  adminAddr: { ...blankAddress(), address_type: 'admin' }
})

const form = reactive(blankForm())
const errors = reactive({})

const modalTitle = computed(() =>
  modalMode.value === 'add'  ? 'Add Court'  :
  modalMode.value === 'edit' ? 'Edit Court' :
                               'View Court'
)

/* ───────────── Filtering / sorting / paging ───────────── */
const filteredCourts = computed(() => {
  const n = filterName.value.toLowerCase()
  const c = filterCode.value.toLowerCase()
  return courts.filter(co =>
    (!n || co.name.toLowerCase().includes(n)) &&
    (!c || co.code.toLowerCase().includes(c))
  )
})

const sortedCourts = computed(() => {
  const mul = sortDir.value === 'asc' ? 1 : -1
  return [...filteredCourts.value].sort((a, b) =>
    String(a[sortKey.value] ?? '').localeCompare(String(b[sortKey.value] ?? '')) * mul
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedCourts.value.length / perPage.value)))
const pagedRows  = computed(() => sortedCourts.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch(filteredCourts, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function search() { page.value = 1 }
function clearFilters() {
  filterName.value = ''
  filterCode.value = ''
  page.value = 1
}

/* ───────────── Address helpers ───────────── */
function findAddress(id) {
  return addresses.find(a => a.address_id === id)
}

/* ───────────── Modal handlers ───────────── */
function resetForm() {
  Object.assign(form, blankForm())
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
}

function openAdd() {
  resetForm()
  modalMode.value = 'add'
  modalOpen.value = true
}

function loadIntoForm(row) {
  const courtAddr = findAddress(row.courtAddress) ?? blankAddress()
  const adminAddr = findAddress(row.adminAddress) ?? { ...blankAddress(), address_type: 'admin' }
  Object.assign(form, blankForm(), {
    court_id: row.court_id,
    name: row.name,
    code: row.code,
    area: row.area ?? '',
    disabledFlag: row.active === 1,
    hideFilterFlag: row.isHideFilterLists === 1,
    addressForAdminFlag: row.addressForAdmin === 1,
    courtAddress: row.courtAddress,
    adminAddress: row.adminAddress,
    courtAddr: { ...courtAddr },
    adminAddr: { ...adminAddr }
  })
}

function openEdit(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'edit'
  modalOpen.value = true
}

function openView(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'view'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  resetForm()
}

function openDelete(row) {
  deleteTarget.value = row
  deleteOpen.value = true
}

function confirmDelete() {
  const id = deleteTarget.value?.court_id
  if (!id) return
  const target = courts.find(c => c.court_id === id)
  if (target) {
    // Mirror legacy deleteCourtById: hard-delete court + both address rows
    const courtAddrId = target.courtAddress
    const adminAddrId = target.adminAddress
    const idx = courts.findIndex(c => c.court_id === id)
    if (idx !== -1) courts.splice(idx, 1)
    const cIdx = addresses.findIndex(a => a.address_id === courtAddrId)
    if (cIdx !== -1) addresses.splice(cIdx, 1)
    const aIdx = addresses.findIndex(a => a.address_id === adminAddrId)
    if (aIdx !== -1) addresses.splice(aIdx, 1)
  }
  deleteOpen.value = false
  deleteTarget.value = null
}

/* When "Use Court Address for Admin" toggles ON, copy court → admin */
function onMirrorChange() {
  if (form.addressForAdminFlag) {
    form.adminAddr = { ...form.courtAddr, address_type: 'admin', address_id: form.adminAddr.address_id }
  }
}

/* ───────────── Validation + save ───────────── */
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
  let ok = true
  if (!form.name?.trim()) { errors.name = 'Please enter Name'; ok = false }
  if (!form.code?.trim()) { errors.code = 'Please enter Code'; ok = false }
  // duplicate code check within the in-memory list
  const dup = courts.find(c =>
    c.code.toLowerCase() === form.code.toLowerCase() && c.court_id !== form.court_id
  )
  if (dup) { errors.code = 'Code already exists'; ok = false }
  if (!ok) formError.value = 'Please correct the highlighted fields'
  return ok
}

function uuid() {
  return (crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2))
}

function saveCourt() {
  if (!validate()) return

  if (modalMode.value === 'add') {
    // Mirror legacy addcourt: create court + 2 address rows
    const courtAddrId = uuid()
    const adminAddrId = uuid()
    addresses.push({
      ...form.courtAddr,
      address_id: courtAddrId,
      address_type: 'court'
    })
    addresses.push({
      ...(form.addressForAdminFlag ? form.courtAddr : form.adminAddr),
      address_id: adminAddrId,
      address_type: 'admin'
    })
    courts.push({
      court_id: uuid(),
      name: form.name.trim(),
      code: form.code.trim(),
      area: form.area?.trim() ?? '',
      active: 0,
      addressForAdmin: form.addressForAdminFlag ? 1 : 0,
      courtAddress: courtAddrId,
      adminAddress: adminAddrId,
      isHideFilterLists: 0
    })
  } else if (modalMode.value === 'edit') {
    // Mirror legacy updatecourt: update court + both address rows in place
    const courtRow = courts.find(c => c.court_id === form.court_id)
    if (courtRow) {
      Object.assign(courtRow, {
        name: form.name.trim(),
        code: form.code.trim(),
        area: form.area?.trim() ?? '',
        active: form.disabledFlag ? 1 : 0,
        addressForAdmin: form.addressForAdminFlag ? 1 : 0,
        isHideFilterLists: form.hideFilterFlag ? 1 : 0
      })
    }
    const courtAddrRow = findAddress(form.courtAddress)
    if (courtAddrRow) Object.assign(courtAddrRow, form.courtAddr, { address_type: 'court' })
    const adminAddrRow = findAddress(form.adminAddress)
    if (adminAddrRow) {
      const src = form.addressForAdminFlag ? form.courtAddr : form.adminAddr
      Object.assign(adminAddrRow, src, { address_type: 'admin' })
    }
  }
  closeModal()
}
</script>

<style scoped>
.req { color: var(--danger); margin-left: 2px; }

/* Toggle row (Disabled / Hide / Use court address) */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 14px;
  background: var(--primary-tint);
  border-radius: var(--radius);
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
