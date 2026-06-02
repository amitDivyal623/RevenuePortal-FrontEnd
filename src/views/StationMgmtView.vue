<template>
  <AppLayout>
    <!-- Page Header -->
    <div class="page-header">
      <div><h1 class="page-title">Station Management</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Station Management</span>
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
          <label class="form-label">Station Name</label>
          <input v-model.trim="filterName" type="text" placeholder="Search by name…" @keyup.enter="doSearch" />
        </div>
        <div class="form-group">
          <label class="form-label">CRS Code</label>
          <input v-model.trim="filterCrs" type="text" placeholder="e.g. KGX" maxlength="4" @keyup.enter="doSearch" />
        </div>
        <div class="form-group">
          <label class="form-label">NLC Code</label>
          <input v-model.trim="filterNlc" type="text" placeholder="e.g. 1072" @keyup.enter="doSearch" />
        </div>
        <div class="form-group">
          <label class="form-label">Service Type</label>
          <select v-model="filterServiceType">
            <option value="">All</option>
            <option v-for="s in serviceTypes" :key="s.service_id" :value="s.service_id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select v-model="filterCaseType">
            <option value="">All</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">
              {{ ct.case_type_code }} — {{ ct.case_type_description }}
            </option>
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
          Stations
          <span v-if="!loading" class="text-muted" style="font-weight:400;font-size:0.875rem;">({{ total }})</span>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Station</button>
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
              <th style="width:60px">Order</th>
              <th>Station Name</th>
              <th>CRS</th>
              <th>NLC</th>
              <th>Service</th>
              <th>Case Types</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-state-icon">🚉</div>
                  <p class="empty-state-title">No stations found</p>
                  <p class="empty-state-desc" style="color:#6b7280;font-size:0.875rem;">
                    {{ hasFilters ? 'Try adjusting your filters.' : 'Add a station to get started.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.station_id">
              <td>{{ row.order }}</td>
              <td><strong>{{ row.station_name }}</strong></td>
              <td><span class="badge badge-primary">{{ row.crs_code }}</span></td>
              <td>{{ row.nlc_code }}</td>
              <td class="text-muted">{{ row.short_code || '—' }}</td>
              <td>
                <div class="flex gap-xs flex-wrap">
                  <span
                    v-for="ctId in (row.case_types_assigned || [])"
                    :key="ctId"
                    class="badge badge-neutral"
                    style="font-size:0.7rem;padding:2px 6px;"
                  >
                    {{ caseTypeLabel(ctId) }}
                  </span>
                  <span v-if="!row.case_types_assigned || row.case_types_assigned.length === 0" class="text-muted">—</span>
                </div>
              </td>
              <td>
                <span :class="row.is_active ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
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
      size="lg"
      :mode="modalMode"
      @close="closeModal"
      @save="saveStation"
    >
      <!-- Detail fetch loading indicator -->
      <div v-if="detailLoading" style="text-align:center;padding:2rem 0;color:#6b7280;font-size:0.875rem;">
        Loading station details…
      </div>

      <!-- Form content — hidden while detail is being fetched -->
      <div v-show="!detailLoading">
        <div class="grid-2">
          <div class="form-group station-name-group">
            <label class="form-label">Station Name <span class="req">*</span></label>
            <input
              v-model="form.station_name"
              :disabled="modalMode === 'view'"
              maxlength="50"
              placeholder="Type station name or 3-letter CRS code, e.g. CBG"
              autocomplete="off"
              @input="onStationNameInput"
              @keydown="onSuggestKey"
              @focus="onStationNameFocus"
              @blur="onStationNameBlur"
            />
            <ul
              v-if="modalMode === 'add' && suggestOpen && suggestions.length"
              class="autocomplete-dropdown"
            >
              <li
                v-for="(s, i) in suggestions"
                :key="s.station_id"
                :class="['autocomplete-item', { active: i === suggestActive }]"
                @mousedown.prevent="pickSuggestion(s)"
                @mouseenter="suggestActive = i"
              >
                {{ suggestLabel(s) }}
              </li>
            </ul>
            <div
              v-else-if="modalMode === 'add' && suggestLoading"
              class="autocomplete-hint"
            >Searching…</div>
            <span v-if="errors.station_name" class="form-error">{{ errors.station_name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">CRS Code <span class="req">*</span></label>
            <input
              v-model.trim="form.crs_code"
              :disabled="modalMode === 'view'"
              maxlength="4"
              placeholder="e.g. KGX"
              style="text-transform:uppercase"
              @input="form.crs_code = form.crs_code.toUpperCase()"
            />
            <span v-if="errors.crs_code" class="form-error">{{ errors.crs_code }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">NLC Code <span class="req">*</span></label>
            <input
              v-model.trim="form.nlc_code"
              :disabled="modalMode === 'view'"
              maxlength="50"
              placeholder="e.g. 1072"
            />
            <span v-if="errors.nlc_code" class="form-error">{{ errors.nlc_code }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Order</label>
            <input
              type="number"
              v-model.number="form.order"
              :disabled="modalMode === 'view'"
              min="1"
              placeholder="Display order"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Latitude</label>
            <input v-model.trim="form.latitude" :disabled="modalMode === 'view'" placeholder="e.g. 51.5074" />
          </div>

          <div class="form-group">
            <label class="form-label">Longitude</label>
            <input v-model.trim="form.longitude" :disabled="modalMode === 'view'" placeholder="e.g. -0.1278" />
          </div>

          <div class="form-group">
            <label class="form-label">Z-A X Coordinate</label>
            <input v-model.trim="form.z_ax_cord" :disabled="modalMode === 'view'" />
          </div>

          <div class="form-group">
            <label class="form-label">Z-A Y Coordinate</label>
            <input v-model.trim="form.z_ay_cord" :disabled="modalMode === 'view'" />
          </div>

          <div class="form-group inline-row" style="align-self:end;padding-bottom:4px;">
            <label class="form-label">Is Active</label>
            <label class="toggle">
              <input
                type="checkbox"
                v-model="form.is_active"
                :true-value="true"
                :false-value="false"
                :disabled="modalMode === 'view'"
              />
              <span class="toggle-track"></span>
            </label>
            <span style="margin-left:0.5rem;font-size:0.875rem;color:#6b7280;">
              {{ form.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <!-- Case Types -->
        <div class="form-group" style="margin-top:8px;">
          <label class="form-label">Case Types</label>
          <div v-if="caseTypes.length > 0" class="checkbox-list">
            <label v-for="ct in caseTypes" :key="ct.case_type_id" class="checkbox-row">
              <input
                type="checkbox"
                :value="ct.case_type_id"
                v-model="form.case_type_ids"
                :disabled="modalMode === 'view'"
              />
              <span>{{ ct.case_type_code }} — {{ ct.case_type_description }}</span>
            </label>
          </div>
          <p v-else style="color:#6b7280;font-size:0.875rem;margin:4px 0 0;">
            No case types configured for this TOC.
          </p>
        </div>

        <!-- Modal-level error -->
        <div v-if="modalError" style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;color:#b91c1c;font-size:0.875rem;">
          {{ modalError }}
        </div>
      </div>
    </AdminModal>

    <!-- Delete Confirmation -->
    <ConfirmDelete
      v-if="deleteOpen"
      title="Delete Station"
      :detail="deleteTarget?.station_name"
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
import { api } from '@/services/api.js'
import { stationsService } from '@/services/stations.service.js'

// ── Config ──────────────────────────────────────────────────────────────────
// api.get/post/put/delete already prepend the global '/api' from api.js,
// so this prefix must NOT include '/api' — otherwise every call goes to
// /api/api/revp/stations/... and 404s.
const STATIONS_API = '/revp/stations'

// ── State ──────────────────────────────────────────────────────────────────
const rows     = ref([])
const total    = ref(0)
const page     = ref(1)
const pageSize = ref(25)

const loading       = ref(false)
const detailLoading = ref(false)
const apiError   = ref('')
const modalOpen  = ref(false)
const modalMode  = ref('add')
const modalError = ref('')
const deleteOpen   = ref(false)
const deleteTarget = ref(null)

const serviceTypes = ref([])
const caseTypes    = ref([])

const filterName        = ref('')
const filterCrs         = ref('')
const filterNlc         = ref('')
const filterServiceType = ref('')
const filterCaseType    = ref('')

const blank = () => ({
  station_id:   '',
  station_name: '',
  crs_code:     '',
  nlc_code:     '',
  is_active:    true,
  order:        null,
  case_type_ids: [],
  latitude:     '',
  longitude:    '',
  z_ax_cord:    '',
  z_ay_cord:    '',
})
const form   = reactive(blank())
const errors = reactive({})

// ── Add-Station auto-fill (typeahead on Station Name) ──────────────────────
const AUTO_FILL_DEBOUNCE_MS = 250
const AUTO_FILL_MIN_QUERY   = 2
const AUTO_FILL_LIMIT       = 15
const suggestions    = ref([])
const suggestOpen    = ref(false)
const suggestLoading = ref(false)
const suggestActive  = ref(-1)
let suggestTimer = null
let suggestSeq   = 0

function closeSuggest() {
  suggestOpen.value  = false
  suggestActive.value = -1
}

function onStationNameInput() {
  if (modalMode.value !== 'add') return
  const term = (form.station_name || '').trim()
  if (suggestTimer) clearTimeout(suggestTimer)
  if (term.length < AUTO_FILL_MIN_QUERY) {
    suggestions.value = []
    closeSuggest()
    return
  }
  suggestTimer = setTimeout(async () => {
    const mySeq = ++suggestSeq
    suggestLoading.value = true
    try {
      const res = await stationsService.autocomplete(term, AUTO_FILL_LIMIT)
      if (mySeq !== suggestSeq) return
      suggestions.value  = res?.results ?? []
      suggestOpen.value  = suggestions.value.length > 0
      suggestActive.value = -1
    } catch {
      if (mySeq !== suggestSeq) return
      suggestions.value = []
      closeSuggest()
    } finally {
      if (mySeq === suggestSeq) suggestLoading.value = false
    }
  }, AUTO_FILL_DEBOUNCE_MS)
}

function pickSuggestion(s) {
  form.station_name = s.station_name ?? ''
  form.crs_code     = (s.crs_code ?? '').toUpperCase()
  form.nlc_code     = s.nlc_code  ?? ''
  form.latitude     = s.latitude  ?? ''
  form.longitude    = s.longitude ?? ''
  form.z_ax_cord    = s.z_ax_cord ?? ''
  form.z_ay_cord    = s.z_ay_cord ?? ''
  if (s.order != null) form.order = s.order
  closeSuggest()
}

function onSuggestKey(e) {
  if (!suggestOpen.value || suggestions.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    suggestActive.value = (suggestActive.value + 1) % suggestions.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    suggestActive.value =
      (suggestActive.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (e.key === 'Enter' && suggestActive.value >= 0) {
    e.preventDefault()
    pickSuggestion(suggestions.value[suggestActive.value])
  } else if (e.key === 'Escape') {
    closeSuggest()
  }
}

function onStationNameFocus() {
  if (modalMode.value === 'add' && suggestions.value.length > 0) {
    suggestOpen.value = true
  }
}

function onStationNameBlur() {
  setTimeout(closeSuggest, 150)
}

function suggestLabel(s) {
  const name = (s.station_name || '').toUpperCase()
  const crs  = (s.crs_code || '').toUpperCase()
  return crs ? `${name} - ${crs}` : name
}

// ── Computed ─────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageStart  = computed(() => (page.value - 1) * pageSize.value + 1)
const pageEnd    = computed(() => Math.min(page.value * pageSize.value, total.value))
const hasFilters = computed(() =>
  !!(filterName.value || filterCrs.value || filterNlc.value || filterServiceType.value || filterCaseType.value)
)
const modalTitle = computed(() => ({
  add:  'Add Station',
  edit: 'Edit Station',
  view: 'View Station',
})[modalMode.value] ?? 'Station')

// Look up a case type's display label by its ID
function caseTypeLabel(id) {
  const ct = caseTypes.value.find(c => c.case_type_id === id)
  return ct ? ct.case_type_code : id
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value  = true
  apiError.value = ''
  try {
    const params = new URLSearchParams({
      page:      page.value,
      page_size: pageSize.value,
    })
    if (filterName.value)        params.set('station_name', filterName.value)
    if (filterCrs.value)         params.set('crs_code',     filterCrs.value)
    if (filterNlc.value)         params.set('nlc_code',     filterNlc.value)
    if (filterServiceType.value) params.set('service_id',   filterServiceType.value)
    if (filterCaseType.value)    params.set('casetype_yes', filterCaseType.value)

    const json  = await api.get(`${STATIONS_API}/datatable/?${params}`)
    rows.value  = json.data          ?? []
    total.value = json.recordsTotal  ?? 0
  } catch (err) {
    apiError.value = err?.message || 'Failed to load stations. Please try again.'
    rows.value  = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchServiceTypes() {
  try {
    const json = await api.get(`${STATIONS_API}/service-types/`)
    serviceTypes.value = Array.isArray(json) ? json : (json.results ?? [])
  } catch {
    console.error('Failed to load service types.')
  }
}

async function fetchCaseTypes() {
  try {
    const json = await api.get(`${STATIONS_API}/case-types/`)
    caseTypes.value = Array.isArray(json) ? json : (json.results ?? [])
  } catch {
    console.error('Failed to load case types.')
  }
}

async function fetchStationDetail(stationId) {
  detailLoading.value = true
  try {
    return await api.get(`${STATIONS_API}/${stationId}/`)
  } catch (err) {
    modalError.value = err?.message || 'Failed to load station details. Please try again.'
    return null
  } finally {
    detailLoading.value = false
  }
}

function doSearch()    { page.value = 1; fetchAll() }
function changePage(n) { page.value = n; fetchAll() }

function clearFilters() {
  filterName.value        = ''
  filterCrs.value         = ''
  filterNlc.value         = ''
  filterServiceType.value = ''
  filterCaseType.value    = ''
  page.value = 1
  fetchAll()
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value    = ''
  detailLoading.value = false
  suggestions.value   = []
  suggestOpen.value   = false
  suggestActive.value = -1
  suggestLoading.value = false
  if (suggestTimer) { clearTimeout(suggestTimer); suggestTimer = null }
  suggestSeq++
}

// Parse the backend's comma-separated case_type string into an array of IDs
function parseCaseTypeIds(caseTypeStr) {
  if (!caseTypeStr) return []
  return caseTypeStr.split(',').map(s => s.trim()).filter(Boolean)
}

function openAdd() {
  reset()
  modalMode.value = 'add'
  modalOpen.value = true
}

async function openEdit(row) {
  reset()
  modalMode.value = 'edit'
  modalOpen.value = true
  const detail = await fetchStationDetail(row.station_id)
  if (detail) {
    Object.assign(form, {
      station_id:    detail.station_id,
      station_name:  detail.station_name,
      crs_code:      detail.crs_code      ?? '',
      nlc_code:      detail.nlc_code      ?? '',
      is_active:     detail.is_active,
      order:         detail.order,
      case_type_ids: parseCaseTypeIds(detail.case_type),
      latitude:      detail.latitude      ?? '',
      longitude:     detail.longitude     ?? '',
      z_ax_cord:     detail.z_ax_cord     ?? '',
      z_ay_cord:     detail.z_ay_cord     ?? '',
    })
  }
}

async function openView(row) {
  reset()
  modalMode.value = 'view'
  modalOpen.value = true
  const detail = await fetchStationDetail(row.station_id)
  if (detail) {
    Object.assign(form, {
      station_id:    detail.station_id,
      station_name:  detail.station_name,
      crs_code:      detail.crs_code      ?? '',
      nlc_code:      detail.nlc_code      ?? '',
      is_active:     detail.is_active,
      order:         detail.order,
      case_type_ids: parseCaseTypeIds(detail.case_type),
      latitude:      detail.latitude      ?? '',
      longitude:     detail.longitude     ?? '',
      z_ax_cord:     detail.z_ax_cord     ?? '',
      z_ay_cord:     detail.z_ay_cord     ?? '',
    })
  }
}

function closeModal()    { modalOpen.value = false; reset() }
function openDelete(row) { deleteTarget.value = row; deleteOpen.value = true }

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.station_name) { errors.station_name = 'Station name is required'; ok = false }
  if (!form.crs_code)     { errors.crs_code     = 'CRS code is required';     ok = false }
  if (!form.nlc_code)     { errors.nlc_code     = 'NLC code is required';     ok = false }
  return ok
}

// ── Save (create / update) ────────────────────────────────────────────────────
async function saveStation() {
  if (!validate()) return
  modalError.value = ''

  // The backend stores case types as a comma-separated string on the station row
  // and syncs the RevpStationCasetypeMapping table in the service layer.
  const payload = {
    station_name: form.station_name,
    crs_code:     form.crs_code.toUpperCase(),
    nlc_code:     form.nlc_code,
    is_active:    form.is_active,
    order:        form.order   || null,
    case_type:    form.case_type_ids.join(','),
    latitude:     form.latitude  || null,
    longitude:    form.longitude || null,
    z_ax_cord:    form.z_ax_cord || null,
    z_ay_cord:    form.z_ay_cord || null,
  }

  try {
    if (modalMode.value === 'add') {
      await api.post(`${STATIONS_API}/create/`, payload)
    } else {
      await api.put(`${STATIONS_API}/${form.station_id}/`, payload)
    }
    await fetchAll()
    closeModal()
  } catch (err) {
    const data = err?.data
    const firstError =
      (data && typeof data === 'object' && data.detail) ||
      (data && typeof data === 'object' && Object.values(data).flat()[0]) ||
      err?.message ||
      'Save failed.'
    modalError.value = String(firstError)
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function confirmDelete() {
  apiError.value = ''
  try {
    await api.delete(`${STATIONS_API}/${deleteTarget.value.station_id}/`)
    const idx = rows.value.findIndex(r => r.station_id === deleteTarget.value.station_id)
    if (idx !== -1) {
      rows.value.splice(idx, 1)
      total.value = Math.max(0, total.value - 1)
    }
    if (rows.value.length === 0 && page.value > 1) {
      page.value--
      await fetchAll()
    }
  } catch (err) {
    apiError.value = err?.message || 'Delete failed. Please try again.'
  } finally {
    deleteOpen.value = false
  }
}

onMounted(() => {
  fetchAll()
  fetchServiceTypes()
  fetchCaseTypes()
})
</script>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.checkbox-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}
.flex-wrap { flex-wrap: wrap; }
.station-name-group { position: relative; }
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 2px 0 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  max-height: 260px;
  overflow-y: auto;
  z-index: 30;
}
.autocomplete-item {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}
.autocomplete-item.active,
.autocomplete-item:hover { background: #f3f4f6; }
.autocomplete-hint {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
  padding: 4px 8px;
}
@media (max-width: 720px) {
  .grid-2 { grid-template-columns: 1fr; }
  .checkbox-list { grid-template-columns: 1fr; }
}
</style>
