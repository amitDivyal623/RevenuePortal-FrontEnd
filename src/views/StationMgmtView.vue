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

    <!-- Unsaved Changes Banner -->
    <div v-if="hasPendingChanges" class="pending-banner mb-md">
      <span style="font-size:0.875rem;font-weight:500;">
        ⚠ You have unsaved case type changes — save or discard before continuing.
      </span>
      <button class="btn btn-secondary btn-sm" @click="discardAllChanges">Discard All</button>
    </div>

    <!-- Filters Card -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>

      <!-- Row 1: main text/select filters -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Station Name</label>
          <input v-model.trim="filterName" type="text" placeholder="Search by name…" @keyup.enter="doSearch" :disabled="hasPendingChanges" />
        </div>
        <div class="form-group">
          <label class="form-label">CRS Code</label>
          <input v-model.trim="filterCrs" type="text" placeholder="e.g. KGX" maxlength="4" @keyup.enter="doSearch" :disabled="hasPendingChanges" />
        </div>
        <div class="form-group">
          <label class="form-label">NLC Code</label>
          <input v-model.trim="filterNlc" type="text" placeholder="e.g. 1072" @keyup.enter="doSearch" :disabled="hasPendingChanges" />
        </div>
        <div class="form-group">
          <label class="form-label">Service Type</label>
          <select v-model="filterServiceType" :disabled="hasPendingChanges">
            <option value="">All</option>
            <option v-for="s in serviceTypes" :key="s.service_id" :value="s.service_id">{{ s.name }}</option>
          </select>
        </div>
      </div>

      <!-- Row 2: per-case-type YES/NO/ANY + Not Entry -->
      <div v-if="caseTypes.length" class="form-row mt-sm">
        <div class="form-group" v-for="ct in caseTypes" :key="ct.case_type_id">
          <label class="form-label">{{ ct.case_type_code }}</label>
          <select v-model="caseTypeFilters[ct.case_type_id]" :disabled="hasPendingChanges">
            <option value="any">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Not Entry</label>
          <select v-model="filterNotEntry" :disabled="hasPendingChanges">
            <option value="">Any</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>

      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch" :disabled="hasPendingChanges">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters" :disabled="hasPendingChanges">Clear Filters</button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Stations
          <span v-if="!loading" class="text-muted" style="font-weight:400;font-size:0.875rem;">({{ total }})</span>
        </div>
        <div class="flex gap-sm">
          <!-- Column Visibility dropdown -->
          <div class="col-vis-wrapper" ref="colVisRef">
            <button class="btn btn-secondary btn-sm" @click="colDropdownOpen = !colDropdownOpen">
              Columns <span style="font-size:10px;margin-left:2px;">▾</span>
            </button>
            <div v-if="colDropdownOpen" class="col-vis-panel">
              <label v-for="col in COLUMN_DEFS" :key="col.key" class="col-vis-row">
                <input type="checkbox" v-model="columnVisibility[col.key]" @change="scheduleColumnSave" />
                <span>{{ col.label }}</span>
              </label>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" @click="openAdd" :disabled="hasPendingChanges">+ Add Station</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center" style="padding:2rem 0;color:#6b7280;">Loading…</div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-if="columnVisibility.order" style="width:60px">Order</th>
              <th v-if="columnVisibility.station_name">Station Name</th>
              <th v-if="columnVisibility.crs_code">CRS</th>
              <th v-if="columnVisibility.nlc_code">NLC</th>
              <th v-if="columnVisibility.short_code">Service</th>
              <th v-if="columnVisibility.is_logon">Logon</th>
              <!-- Dynamic case type checkbox columns -->
              <template v-if="columnVisibility.case_types">
                <th
                  v-for="ct in caseTypes"
                  :key="ct.case_type_id"
                  style="text-align:center;min-width:55px;white-space:nowrap;"
                >{{ ct.case_type_code }}</th>
              </template>
              <th v-if="columnVisibility.is_active">Status</th>
              <th v-if="columnVisibility.created_by">Owner</th>
              <th style="text-align:right;min-width:160px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td :colspan="visibleColCount + 1">
                <div class="empty-state">
                  <div class="empty-state-icon">🚉</div>
                  <p class="empty-state-title">No stations found</p>
                  <p class="empty-state-desc" style="color:#6b7280;font-size:0.875rem;">
                    {{ hasFilters ? 'Try adjusting your filters.' : 'Add a station to get started.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr
              v-for="row in rows"
              :key="row.station_id"
              :class="{ 'row-dirty': isRowDirty(row.station_id) }"
            >
              <td v-if="columnVisibility.order">{{ row.order }}</td>
              <td v-if="columnVisibility.station_name"><strong>{{ row.station_name }}</strong></td>
              <td v-if="columnVisibility.crs_code">
                <span class="badge badge-primary">{{ row.crs_code }}</span>
              </td>
              <td v-if="columnVisibility.nlc_code">{{ row.nlc_code }}</td>
              <td v-if="columnVisibility.short_code" class="text-muted">{{ row.short_code || '—' }}</td>
              <td v-if="columnVisibility.is_logon">
                <span :class="row.is_logon ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ row.is_logon ? 'Yes' : 'No' }}
                </span>
              </td>
              <!-- Case type checkboxes (one per case type column) -->
              <template v-if="columnVisibility.case_types">
                <td
                  v-for="ct in caseTypes"
                  :key="ct.case_type_id"
                  style="text-align:center"
                >
                  <input
                    type="checkbox"
                    :checked="isCtChecked(row.station_id, ct.case_type_id)"
                    :disabled="hasPendingChanges && !isRowDirty(row.station_id)"
                    @change="e => onCtChange(row.station_id, ct.case_type_id, e.target.checked)"
                    style="cursor:pointer;width:15px;height:15px;"
                  />
                </td>
              </template>
              <td v-if="columnVisibility.is_active">
                <span :class="row.is_active ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td v-if="columnVisibility.created_by" class="text-muted" style="font-size:0.8125rem;">
                {{ row.created_by || '—' }}
              </td>
              <!-- Actions: Discard/Save for dirty rows; View/Edit for clean rows -->
              <td style="text-align:right">
                <div v-if="isRowDirty(row.station_id)" class="flex gap-xs" style="justify-content:flex-end;align-items:center;">
                  <span v-if="rowSaveError[row.station_id]" style="font-size:0.75rem;color:#b91c1c;">
                    {{ rowSaveError[row.station_id] }}
                  </span>
                  <button
                    class="btn btn-secondary btn-sm"
                    :disabled="rowSaving[row.station_id]"
                    @click="discardRowChanges(row.station_id)"
                  >Discard</button>
                  <button
                    class="btn btn-primary btn-sm"
                    :disabled="rowSaving[row.station_id]"
                    @click="saveRowCaseTypes(row)"
                  >{{ rowSaving[row.station_id] ? 'Saving…' : 'Save' }}</button>
                </div>
                <div v-else class="flex gap-xs" style="justify-content:flex-end">
                  <button class="btn btn-secondary btn-sm" :disabled="hasPendingChanges" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-sm" :disabled="hasPendingChanges" @click="openEdit(row)">Edit</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-between items-center mt-md" style="font-size:0.875rem;">
        <span style="color:#6b7280;">Showing {{ pageStart }}–{{ pageEnd }} of {{ total }}</span>
        <div class="flex gap-xs">
          <button class="btn btn-secondary btn-sm" :disabled="page === 1 || hasPendingChanges" @click="changePage(page - 1)">‹ Prev</button>
          <span class="btn btn-secondary btn-sm" style="cursor:default;pointer-events:none;">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages || hasPendingChanges" @click="changePage(page + 1)">Next ›</button>
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
      <div v-if="detailLoading" style="text-align:center;padding:2rem 0;color:#6b7280;font-size:0.875rem;">
        Loading station details…
      </div>

      <div v-show="!detailLoading" style="display:flex;flex-direction:column;gap:16px;">

        <!-- Row 1: Station Name | CRS Code | NLC Code -->
        <div class="grid-3">
          <div class="form-group station-name-group">
            <label class="form-label">Station Name <span class="req">*</span></label>
            <input
              v-model="form.station_name"
              :disabled="modalMode === 'view'"
              maxlength="50"
              placeholder="Name or CRS code, e.g. CBG"
              autocomplete="off"
              @input="onStationNameInput"
              @keydown="onSuggestKey"
              @focus="onStationNameFocus"
              @blur="onStationNameBlur"
            />
            <ul v-if="modalMode === 'add' && suggestOpen && suggestions.length" class="autocomplete-dropdown">
              <li
                v-for="(s, i) in suggestions"
                :key="s.station_id"
                :class="['autocomplete-item', { active: i === suggestActive }]"
                @mousedown.prevent="pickSuggestion(s)"
                @mouseenter="suggestActive = i"
              >{{ suggestLabel(s) }}</li>
            </ul>
            <div v-else-if="modalMode === 'add' && suggestLoading" class="autocomplete-hint">Searching…</div>
            <span v-if="errors.station_name" class="form-error">{{ errors.station_name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">CRS Code <span class="req">*</span></label>
            <input v-model.trim="form.crs_code" :disabled="modalMode === 'view'" maxlength="4" placeholder="e.g. KGX" style="text-transform:uppercase" @input="form.crs_code = form.crs_code.toUpperCase()" />
            <span v-if="errors.crs_code" class="form-error">{{ errors.crs_code }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">NLC Code <span class="req">*</span></label>
            <input v-model.trim="form.nlc_code" :disabled="modalMode === 'view'" maxlength="50" placeholder="e.g. 1072" />
            <span v-if="errors.nlc_code" class="form-error">{{ errors.nlc_code }}</span>
          </div>
        </div>

        <!-- Row 2: Order | Service Type -->
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Order</label>
            <input type="number" v-model.number="form.order" :disabled="modalMode === 'view'" min="1" placeholder="Display order" />
          </div>

          <div class="form-group">
            <label class="form-label">Service Type</label>
            <select v-model="form.service_id" :disabled="modalMode === 'view'">
              <option value="">— None —</option>
              <option v-for="s in serviceTypes" :key="s.service_id" :value="s.service_id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <!-- Row 3: Latitude | Longitude -->
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Latitude</label>
            <input v-model.trim="form.latitude" :disabled="modalMode === 'view'" placeholder="e.g. 51.5074" />
          </div>

          <div class="form-group">
            <label class="form-label">Longitude</label>
            <input v-model.trim="form.longitude" :disabled="modalMode === 'view'" placeholder="e.g. -0.1278" />
          </div>
        </div>

        <!-- Row 4: Z-A X Coordinate | Z-A Y Coordinate -->
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Zone X Coordinate</label>
            <input v-model.trim="form.z_ax_cord" :disabled="modalMode === 'view'" />
          </div>

          <div class="form-group">
            <label class="form-label">Zone Y Coordinate</label>
            <input v-model.trim="form.z_ay_cord" :disabled="modalMode === 'view'" />
          </div>
        </div>

        <!-- Row 5: Case Types -->
        <div class="form-group">
          <label class="form-label">Case Types</label>
          <div v-if="caseTypes.length > 0" class="checkbox-list">
            <label v-for="ct in caseTypes" :key="ct.case_type_id" class="checkbox-row">
              <input type="checkbox" :value="ct.case_type_id" v-model="form.case_type_ids" :disabled="modalMode === 'view'" />
              <span>{{ ct.case_type_code }} — {{ ct.case_type_description }}</span>
            </label>
          </div>
          <p v-else style="color:#6b7280;font-size:0.875rem;margin:4px 0 0;">No case types configured for this TOC.</p>
        </div>

        <!-- Row 6: Is Active -->
        <div class="form-group inline-row">
          <label class="form-label">Is Active</label>
          <label class="toggle">
            <input type="checkbox" v-model="form.is_active" :true-value="true" :false-value="false" :disabled="modalMode === 'view'" />
            <span class="toggle-track"></span>
          </label>
          <span style="margin-left:0.5rem;font-size:0.875rem;color:#6b7280;">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
        </div>

        <div v-if="modalError" style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;color:#b91c1c;font-size:0.875rem;">
          {{ modalError }}
        </div>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { stationsService } from '@/services/stations.service.js'
import { swal } from '@/utils/swal.js'

// ── Column definitions ────────────────────────────────────────────────────────
const COLUMN_DEFS = [
  { key: 'order',        label: 'Order' },
  { key: 'station_name', label: 'Station Name' },
  { key: 'crs_code',     label: 'CRS' },
  { key: 'nlc_code',     label: 'NLC' },
  { key: 'short_code',   label: 'Service' },
  { key: 'is_logon',     label: 'Logon' },
  { key: 'case_types',   label: 'Case Types' },   // controls all dynamic CT columns
  { key: 'is_active',    label: 'Status' },
  { key: 'created_by',   label: 'Owner' },
]

const columnVisibility = reactive(
  Object.fromEntries(COLUMN_DEFS.map(c => [c.key, true]))
)
const colDropdownOpen = ref(false)
const colVisRef       = ref(null)
let colSaveTimer      = null

// ── Core state ────────────────────────────────────────────────────────────────
const rows     = ref([])
const total    = ref(0)
const page     = ref(1)
const pageSize = ref(25)

const loading       = ref(false)
const detailLoading = ref(false)
const apiError      = ref('')
const modalOpen     = ref(false)
const modalMode     = ref('add')
const modalError    = ref('')

const serviceTypes = ref([])
const caseTypes    = ref([])
const nextOrder    = ref(1)

// Filters
const filterName        = ref('')
const filterCrs         = ref('')
const filterNlc         = ref('')
const filterServiceType = ref('')
const filterNotEntry    = ref('')
const caseTypeFilters   = ref({})

// ── Inline Case Type Editing ──────────────────────────────────────────────────
// rowEdits: { [stationId]: { original: string[], current: string[] } }
const rowEdits    = reactive({})
const rowSaving   = reactive({})
const rowSaveError = reactive({})

function initRowEdits(rowList) {
  rowList.forEach(row => {
    rowEdits[row.station_id] = {
      original: [...(row.case_types_assigned ?? [])],
      current:  [...(row.case_types_assigned ?? [])],
    }
  })
}

function isCtChecked(stationId, caseTypeId) {
  return rowEdits[stationId]?.current.includes(caseTypeId) ?? false
}

function isRowDirty(stationId) {
  const edits = rowEdits[stationId]
  if (!edits) return false
  if (edits.original.length !== edits.current.length) return true
  const origSet = new Set(edits.original)
  return edits.current.some(id => !origSet.has(id))
}

function onCtChange(stationId, caseTypeId, checked) {
  const edits = rowEdits[stationId]
  if (!edits) return
  const next = edits.current.filter(id => id !== caseTypeId)
  if (checked) next.push(caseTypeId)
  edits.current = next
}

function discardRowChanges(stationId) {
  const edits = rowEdits[stationId]
  if (edits) edits.current = [...edits.original]
  rowSaveError[stationId] = ''
}

function discardAllChanges() {
  Object.keys(rowEdits).forEach(id => discardRowChanges(id))
}

async function saveRowCaseTypes(row) {
  rowSaving[row.station_id]    = true
  rowSaveError[row.station_id] = ''
  try {
    const currentIds = rowEdits[row.station_id].current
    const payload = {
      station_name: row.station_name,
      crs_code:     row.crs_code  || null,
      nlc_code:     row.nlc_code  || null,
      is_active:    row.is_active,
      order:        row.order     || null,
      latitude:     row.latitude  || null,
      longitude:    row.longitude || null,
      z_ax_cord:    row.z_ax_cord || null,
      z_ay_cord:    row.z_ay_cord || null,
      case_type:    currentIds.join(','),
    }
    await stationsService.update(row.station_id, payload)

    // Sync junction table — table display reads from RevpStationCasetypeMapping
    const ctUpdates = caseTypes.value.map(ct => ({
      station_id:      row.station_id,
      casetype_id:     ct.case_type_id,
      casetype_name:   ct.case_type_code,
      casetype_status: currentIds.includes(ct.case_type_id),
    }))
    await stationsService.updateCaseTypes(row.station_id, ctUpdates)

    await fetchAll()
    await swal.success('Case types saved.')
  } catch (err) {
    rowSaveError[row.station_id] = err?.data?.detail || err?.message || 'Save failed.'
  } finally {
    rowSaving[row.station_id] = false
  }
}

// ── Computed ──────────────────────────────────────────────────────────────────
const hasPendingChanges = computed(() =>
  rows.value.some(row => isRowDirty(row.station_id))
)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageStart  = computed(() => (page.value - 1) * pageSize.value + 1)
const pageEnd    = computed(() => Math.min(page.value * pageSize.value, total.value))

// case_types expands to N columns (one per case type), not 1
const visibleColCount = computed(() => {
  const staticCount = COLUMN_DEFS
    .filter(c => c.key !== 'case_types' && columnVisibility[c.key])
    .length
  const ctCount = columnVisibility.case_types ? caseTypes.value.length : 0
  return staticCount + ctCount
})

const hasFilters = computed(() =>
  !!(filterName.value || filterCrs.value || filterNlc.value ||
     filterServiceType.value || filterNotEntry.value ||
     Object.values(caseTypeFilters.value).some(v => v !== 'any'))
)

const modalTitle = computed(() => ({
  add: 'Add Station', edit: 'Edit Station', view: 'View Station',
})[modalMode.value] ?? 'Station')

function caseTypeLabel(id) {
  const ct = caseTypes.value.find(c => c.case_type_id === id)
  return ct ? ct.case_type_code : id
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value  = true
  apiError.value = ''
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filterName.value)        params.station_name = filterName.value
    if (filterCrs.value)         params.crs_code     = filterCrs.value
    if (filterNlc.value)         params.nlc_code     = filterNlc.value
    if (filterServiceType.value) params.service_id   = filterServiceType.value
    if (filterNotEntry.value)    params.not_entry    = filterNotEntry.value

    const yesIds = Object.entries(caseTypeFilters.value).filter(([, v]) => v === 'yes').map(([k]) => k)
    const noIds  = Object.entries(caseTypeFilters.value).filter(([, v]) => v === 'no').map(([k]) => k)
    if (yesIds.length) params.casetype_yes = yesIds.join(',')
    if (noIds.length)  params.casetype_no  = noIds.join(',')

    const json  = await stationsService.list(params)
    rows.value  = json.data         ?? []
    total.value = json.recordsTotal ?? 0
    initRowEdits(rows.value)
  } catch (err) {
    apiError.value = err?.data?.detail || err?.message || 'Failed to load stations. Please try again.'
    rows.value  = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchModalData() {
  try {
    const data = await stationsService.modalData()
    serviceTypes.value = data.service_types ?? []
    caseTypes.value    = data.case_types    ?? []
    nextOrder.value    = data.next_order    ?? 1
    const filters = {}
    caseTypes.value.forEach(ct => { filters[ct.case_type_id] = 'any' })
    caseTypeFilters.value = filters
  } catch { /* ignore */ }
}

async function fetchStationDetail(stationId) {
  detailLoading.value = true
  try {
    return await stationsService.get(stationId)
  } catch (err) {
    modalError.value = err?.data?.detail || err?.message || 'Failed to load station details.'
    return null
  } finally {
    detailLoading.value = false
  }
}

// ── Column visibility ─────────────────────────────────────────────────────────
async function loadColumnOrder() {
  try {
    const data = await stationsService.getColumnOrder()
    if (data?.station_column_visibility) {
      const saved = JSON.parse(data.station_column_visibility)
      if (saved && typeof saved === 'object') {
        Object.keys(saved).forEach(k => {
          if (k in columnVisibility) columnVisibility[k] = !!saved[k]
        })
      }
    }
  } catch { /* use defaults */ }
}

function scheduleColumnSave() {
  if (colSaveTimer) clearTimeout(colSaveTimer)
  colSaveTimer = setTimeout(saveColumnOrder, 1000)
}

async function saveColumnOrder() {
  try {
    await stationsService.saveColumnOrder(
      JSON.stringify(COLUMN_DEFS.map((_, i) => i)),
      JSON.stringify(Object.fromEntries(COLUMN_DEFS.map(c => [c.key, columnVisibility[c.key]])))
    )
  } catch { /* best-effort */ }
}

function handleClickOutside(e) {
  if (colVisRef.value && !colVisRef.value.contains(e.target)) colDropdownOpen.value = false
}

// ── Unsaved changes guard ─────────────────────────────────────────────────────
function handleBeforeUnload(e) {
  if (hasPendingChanges.value) { e.preventDefault(); e.returnValue = '' }
}

onBeforeRouteLeave((to, from, next) => {
  if (!hasPendingChanges.value) { next(); return }
  const confirmed = window.confirm(
    'You have unsaved case type changes. Leave without saving?'
  )
  next(confirmed)
})

// ── Filters ───────────────────────────────────────────────────────────────────
function doSearch()    { page.value = 1; fetchAll() }
function changePage(n) { page.value = n; fetchAll() }

function clearFilters() {
  filterName.value        = ''
  filterCrs.value         = ''
  filterNlc.value         = ''
  filterServiceType.value = ''
  filterNotEntry.value    = ''
  Object.keys(caseTypeFilters.value).forEach(k => { caseTypeFilters.value[k] = 'any' })
  page.value = 1
  fetchAll()
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
const blank = () => ({
  station_id: '', station_name: '', crs_code: '', nlc_code: '',
  is_active: true, order: null, service_id: '', case_type_ids: [],
  latitude: '', longitude: '', z_ax_cord: '', z_ay_cord: '',
})
const form   = reactive(blank())
const errors = reactive({})

// Autocomplete
const suggestions    = ref([])
const suggestOpen    = ref(false)
const suggestLoading = ref(false)
const suggestActive  = ref(-1)
let suggestTimer = null
let suggestSeq   = 0

function closeSuggest() { suggestOpen.value = false; suggestActive.value = -1 }

function onStationNameInput() {
  if (modalMode.value !== 'add') return
  const term = (form.station_name || '').trim()
  if (suggestTimer) clearTimeout(suggestTimer)
  if (term.length < 2) { suggestions.value = []; closeSuggest(); return }
  suggestTimer = setTimeout(async () => {
    const mySeq = ++suggestSeq
    suggestLoading.value = true
    try {
      const res = await stationsService.autocomplete(term, 15)
      if (mySeq !== suggestSeq) return
      suggestions.value   = res?.results ?? []
      suggestOpen.value   = suggestions.value.length > 0
      suggestActive.value = -1
    } catch {
      if (mySeq !== suggestSeq) return
      suggestions.value = []; closeSuggest()
    } finally {
      if (mySeq === suggestSeq) suggestLoading.value = false
    }
  }, 250)
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
  if (!suggestOpen.value || !suggestions.value.length) return
  if (e.key === 'ArrowDown')  { e.preventDefault(); suggestActive.value = (suggestActive.value + 1) % suggestions.value.length }
  else if (e.key === 'ArrowUp') { e.preventDefault(); suggestActive.value = (suggestActive.value - 1 + suggestions.value.length) % suggestions.value.length }
  else if (e.key === 'Enter' && suggestActive.value >= 0) { e.preventDefault(); pickSuggestion(suggestions.value[suggestActive.value]) }
  else if (e.key === 'Escape') closeSuggest()
}
function onStationNameFocus() { if (modalMode.value === 'add' && suggestions.value.length) suggestOpen.value = true }
function onStationNameBlur()  { setTimeout(closeSuggest, 150) }
function suggestLabel(s) {
  const name = (s.station_name || '').toUpperCase()
  const crs  = (s.crs_code || '').toUpperCase()
  return crs ? `${name} - ${crs}` : name
}

function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value     = ''
  detailLoading.value  = false
  suggestions.value    = []
  suggestOpen.value    = false
  suggestActive.value  = -1
  suggestLoading.value = false
  if (suggestTimer) { clearTimeout(suggestTimer); suggestTimer = null }
  suggestSeq++
}

function parseCaseTypeIds(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

function populateFormFromDetail(detail) {
  Object.assign(form, {
    station_id:    detail.station_id,
    station_name:  detail.station_name,
    crs_code:      detail.crs_code        ?? '',
    nlc_code:      detail.nlc_code        ?? '',
    is_active:     detail.is_active,
    order:         detail.order,
    service_id:    detail.service_type_id ?? '',
    case_type_ids: parseCaseTypeIds(detail.case_type),
    latitude:      detail.latitude        ?? '',
    longitude:     detail.longitude       ?? '',
    z_ax_cord:     detail.z_ax_cord       ?? '',
    z_ay_cord:     detail.z_ay_cord       ?? '',
  })
}

function openAdd() {
  reset(); form.order = nextOrder.value; modalMode.value = 'add'; modalOpen.value = true
}

async function openEdit(row) {
  reset(); modalMode.value = 'edit'; modalOpen.value = true
  const detail = await fetchStationDetail(row.station_id)
  if (detail) populateFormFromDetail(detail)
}

async function openView(row) {
  reset(); modalMode.value = 'view'; modalOpen.value = true
  const detail = await fetchStationDetail(row.station_id)
  if (detail) populateFormFromDetail(detail)
}

function closeModal() { modalOpen.value = false; reset() }

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.station_name) { errors.station_name = 'Station name is required'; ok = false }
  if (!form.crs_code)     { errors.crs_code     = 'CRS code is required';     ok = false }
  if (!form.nlc_code)     { errors.nlc_code     = 'NLC code is required';     ok = false }
  return ok
}

watch(() => form.station_name, v => { if (errors.station_name && v?.trim()) delete errors.station_name })
watch(() => form.crs_code,     v => { if (errors.crs_code && v?.trim()) delete errors.crs_code })
watch(() => form.nlc_code,     v => { if (errors.nlc_code && v?.trim()) delete errors.nlc_code })

// ── Save station (create / update) ────────────────────────────────────────────
async function saveStation() {
  if (!validate()) return
  modalError.value = ''
  const isAdd = modalMode.value === 'add'

  const payload = {
    station_name: form.station_name,
    crs_code:     form.crs_code ? form.crs_code.toUpperCase() : null,
    nlc_code:     form.nlc_code  || null,
    is_active:    form.is_active,
    order:        form.order     || null,
    case_type:    form.case_type_ids.join(','),
    latitude:     form.latitude  || null,
    longitude:    form.longitude || null,
    z_ax_cord:    form.z_ax_cord || null,
    z_ay_cord:    form.z_ay_cord || null,
  }

  try {
    let stationId
    if (isAdd) {
      const created = await stationsService.create(payload)
      stationId = created.station_id
    } else {
      await stationsService.update(form.station_id, payload)
      stationId = form.station_id
    }
    if (form.service_id) {
      await stationsService.assignServiceType(stationId, form.service_id)
    } else if (!isAdd) {
      try { await stationsService.removeServiceType(stationId) } catch { /* no mapping */ }
    }

    // Sync case type junction table — table display reads from RevpStationCasetypeMapping
    if (caseTypes.value.length) {
      const ctUpdates = caseTypes.value.map(ct => ({
        station_id:      stationId,
        casetype_id:     ct.case_type_id,
        casetype_name:   ct.case_type_code,
        casetype_status: form.case_type_ids.includes(ct.case_type_id),
      }))
      await stationsService.updateCaseTypes(stationId, ctUpdates)
    }

    await fetchAll()
    closeModal()
    await swal.success(isAdd ? 'Station created successfully.' : 'Station updated successfully.')
  } catch (err) {
    const data = err?.data
    modalError.value =
      data?.detail ||
      (data && typeof data === 'object' && Object.values(data).flat()[0]) ||
      err?.message || 'Save failed.'
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchAll()
  fetchModalData()
  loadColumnOrder()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (colSaveTimer) clearTimeout(colSaveTimer)
})
</script>

<style scoped>
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 16px;
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

/* Station name autocomplete */
.station-name-group { position: relative; }
.autocomplete-dropdown {
  position: absolute;
  top: 100%; left: 0; right: 0;
  margin: 2px 0 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
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
  top: 100%; left: 0;
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
  padding: 4px 8px;
}

/* Column visibility dropdown */
.col-vis-wrapper { position: relative; }
.col-vis-panel {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  padding: 8px 0;
  z-index: 50;
}
.col-vis-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.col-vis-row:hover { background: #f3f4f6; }
.col-vis-row input[type="checkbox"] { cursor: pointer; }

/* Dirty row highlight */
.row-dirty { background: #fffbeb !important; }
.row-dirty td { border-top: 1px solid #fde68a; border-bottom: 1px solid #fde68a; }

/* Unsaved changes banner */
.pending-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #92400e;
}

@media (max-width: 720px) {
  .grid-2,
  .grid-3 { grid-template-columns: 1fr; }
  .checkbox-list { grid-template-columns: 1fr; }
}
</style>
