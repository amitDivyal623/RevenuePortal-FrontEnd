<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Car Park Locations</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Car Park Locations</span>
      </div>
    </div>

    <!-- API Error Banner -->
    <div v-if="store.error" class="alert alert-danger mb-md" style="padding:0.75rem 1rem;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
      {{ store.error }}
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Station</label>
          <div class="searchable-wrap">
            <input
              ref="filterInputRef"
              type="text"
              v-model="filterSearch"
              placeholder="Search stations…"
              autocomplete="off"
              @focus="openFilterDropdown"
              @input="openFilterDropdown"
              @blur="onFilterBlur"
            />
            <Teleport to="body">
              <div v-if="filterOpen" class="searchable-dropdown-teleport" :style="filterDropdownStyle">
                <div class="searchable-option searchable-option--clear" @mousedown.prevent="clearFilterStation">
                  All stations
                </div>
                <div v-if="filterOptions.length === 0" class="searchable-empty">No stations found</div>
                <div
                  v-for="s in filterOptions"
                  :key="s.station_id"
                  class="searchable-option"
                  :class="{ selected: filterStation === s.station_id }"
                  @mousedown.prevent="pickFilterStation(s)"
                >{{ s.station_name }}</div>
              </div>
            </Teleport>
          </div>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear Filters</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Car Park Locations
          <span v-if="!store.loading" class="text-muted" style="font-weight:400;font-size:0.875rem;">({{ store.carParks.length }})</span>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Car Park</button>
      </div>

      <div v-if="store.loading" class="text-center" style="padding:2rem 0;color:#6b7280;">Loading…</div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Car Park Location</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.carParks.length === 0">
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-state-icon">🅿️</div>
                  <p class="empty-state-title">No car park locations found</p>
                  <p class="empty-state-desc" style="color:#6b7280;font-size:0.875rem;">
                    {{ filterStation ? 'Try adjusting your filters.' : 'Add a car park location to get started.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="row in store.carParks" :key="row.carpark_location_id">
              <td><strong>{{ stationName(row.station_id) }}</strong></td>
              <td>{{ row.location_name }}</td>
              <td>
                <span :class="row.is_enabled === '1' ? 'badge badge-success' : 'badge badge-neutral'">
                  {{ row.is_enabled === '1' ? 'Active' : 'Disabled' }}
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
    </div>

    <!-- Add / Edit / View Modal -->
    <AdminModal
      v-if="modalOpen"
      :title="modalTitle"
      size="md"
      :mode="modalMode"
      @close="closeModal"
      @save="saveCp"
    >
      <div class="form-group">
        <label class="form-label">Car Park Location <span class="req">*</span></label>
        <input
          v-model.trim="form.location_name"
          :disabled="modalMode === 'view'"
          placeholder="e.g. North Car Park"
          maxlength="30"
        />
        <span v-if="errors.location_name" class="form-error">{{ errors.location_name }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Station <span class="req">*</span></label>
        <div class="searchable-wrap">
          <input
            ref="modalInputRef"
            type="text"
            v-model="modalSearch"
            :disabled="modalMode === 'view'"
            :placeholder="modalMode === 'view' ? (stationName(form.station_id) || '—') : 'Search stations…'"
            autocomplete="off"
            @focus="openModalDropdown"
            @input="openModalDropdown"
            @blur="onModalBlur"
          />
          <Teleport to="body">
            <div v-if="modalSelectOpen && modalMode !== 'view'" class="searchable-dropdown-teleport" :style="modalDropdownStyle">
              <div v-if="modalOptions.length === 0" class="searchable-empty">No stations found</div>
              <div
                v-for="s in modalOptions"
                :key="s.station_id"
                class="searchable-option"
                :class="{ selected: form.station_id === s.station_id }"
                @mousedown.prevent="pickModalStation(s)"
              >{{ s.station_name }}</div>
            </div>
          </Teleport>
        </div>
        <span v-if="errors.station_id" class="form-error">{{ errors.station_id }}</span>
      </div>

      <!-- Status: hidden in Add mode (defaults Active); shown in Edit / View -->
      <div v-if="modalMode !== 'add'" class="form-group inline-row">
        <label class="form-label">Status</label>
        <label class="toggle">
          <input
            type="checkbox"
            v-model="form.is_enabled"
            true-value="1"
            false-value="0"
            :disabled="modalMode === 'view'"
          />
          <span class="toggle-track"></span>
        </label>
        <span style="margin-left:0.5rem;font-size:0.875rem;color:#6b7280;">
          {{ form.is_enabled === '1' ? 'Active' : 'Disabled' }}
        </span>
      </div>

      <div v-if="modalError" style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;color:#b91c1c;font-size:0.875rem;">
        {{ modalError }}
      </div>
    </AdminModal>

    <!-- Delete Confirmation -->
    <ConfirmDelete
      v-if="deleteOpen"
      title="Delete Car Park Location"
      :detail="deleteTarget?.location_name"
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
import { useCarParksStore } from '@/store/car-parks.store.js'
import { swal } from '@/utils/swal.js'

const store    = useCarParksStore()
const stations = computed(() => store.stations)

// ── Filter searchable dropdown ────────────────────────────────────────────────
const filterStation      = ref('')
const filterSearch       = ref('')
const filterOpen         = ref(false)
const filterInputRef     = ref(null)
const filterDropdownStyle = ref({})

const filterOptions = computed(() => {
  const q = filterSearch.value.trim().toLowerCase()
  return q
    ? stations.value.filter(s => s.station_name.toLowerCase().includes(q))
    : stations.value
})

function calcStyle(inputEl) {
  if (!inputEl) return {}
  const r = inputEl.getBoundingClientRect()
  return { top: `${r.bottom + 2}px`, left: `${r.left}px`, width: `${r.width}px` }
}

function openFilterDropdown() {
  filterDropdownStyle.value = calcStyle(filterInputRef.value)
  filterOpen.value = true
}

function pickFilterStation(s) {
  filterStation.value = s.station_id
  filterSearch.value  = s.station_name
  filterOpen.value    = false
}

function clearFilterStation() {
  filterStation.value = ''
  filterSearch.value  = ''
  filterOpen.value    = false
}

function onFilterBlur() {
  setTimeout(() => {
    filterOpen.value = false
    // Restore input to show selected name (or empty for "All")
    filterSearch.value = filterStation.value
      ? (stations.value.find(s => s.station_id === filterStation.value)?.station_name ?? '')
      : ''
  }, 150)
}

// ── Modal searchable dropdown ─────────────────────────────────────────────────
const modalSelectOpen      = ref(false)
const modalSearch          = ref('')
const modalInputRef        = ref(null)
const modalDropdownStyle   = ref({})

const modalOptions = computed(() => {
  const q = modalSearch.value.trim().toLowerCase()
  return q
    ? stations.value.filter(s => s.station_name.toLowerCase().includes(q))
    : stations.value
})

function openModalDropdown() {
  modalDropdownStyle.value = calcStyle(modalInputRef.value)
  modalSelectOpen.value = true
}

function pickModalStation(s) {
  form.station_id       = s.station_id
  modalSearch.value     = s.station_name
  modalSelectOpen.value = false
}

function onModalBlur() {
  setTimeout(() => {
    modalSelectOpen.value = false
    // Restore input to show selected name
    modalSearch.value = form.station_id
      ? (stations.value.find(s => s.station_id === form.station_id)?.station_name ?? '')
      : ''
  }, 150)
}

// ── Filters ───────────────────────────────────────────────────────────────────
function doSearch() { store.fetchAll(filterStation.value) }

function clearFilters() {
  clearFilterStation()
  store.fetchAll()
}

// ── Modal state ───────────────────────────────────────────────────────────────
const modalOpen    = ref(false)
const modalMode    = ref('add')
const modalError   = ref('')
const deleteOpen   = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ carpark_location_id: '', station_id: '', location_name: '', is_enabled: '1' })
const form   = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => ({
  add: 'Add Car Park Location', edit: 'Edit Car Park Location', view: 'View Car Park Location',
})[modalMode.value])

function stationName(id) {
  return stations.value.find(s => s.station_id === id)?.station_name ?? ''
}

function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value      = ''
  modalSearch.value     = ''
  modalSelectOpen.value = false
}

function openAdd() {
  reset(); modalMode.value = 'add'; modalOpen.value = true
}

function openEdit(row) {
  reset()
  Object.assign(form, { ...row })
  modalSearch.value = stationName(form.station_id)
  modalMode.value   = 'edit'
  modalOpen.value   = true
}

function openView(row) {
  reset()
  Object.assign(form, { ...row })
  modalSearch.value = stationName(form.station_id)
  modalMode.value   = 'view'
  modalOpen.value   = true
}

function closeModal()    { modalOpen.value = false; reset() }
function openDelete(row) { deleteTarget.value = row; deleteOpen.value = true }

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.location_name) { errors.location_name = 'Car park location name is required'; ok = false }
  if (!form.station_id)    { errors.station_id    = 'Please select a station';            ok = false }
  return ok
}

watch(() => form.location_name, v => { if (errors.location_name && v?.trim()) delete errors.location_name })
watch(() => form.station_id,    v => { if (errors.station_id && v) delete errors.station_id })

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveCp() {
  if (!validate()) return
  modalError.value = ''
  const isAdd = modalMode.value === 'add'

  const payload = {
    location_name: form.location_name,
    station_id:    form.station_id,
    is_enabled:    isAdd ? '1' : form.is_enabled,
  }

  try {
    if (isAdd) {
      await store.createCarPark(payload)
    } else {
      await store.updateCarPark(form.carpark_location_id, payload)
    }
    await store.fetchAll(filterStation.value)
    closeModal()
    await swal.success(isAdd ? 'Car park location created successfully.' : 'Car park location updated successfully.')
  } catch (err) {
    const data = err?.data
    modalError.value = data?.detail || (data && Object.values(data).flat()[0]) || err?.message || 'Save failed.'
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function confirmDelete() {
  try {
    await store.removeCarPark(deleteTarget.value.carpark_location_id)
    deleteOpen.value   = false
    deleteTarget.value = null
    await store.fetchAll(filterStation.value)
    await swal.success('Car park location deleted successfully.')
  } catch (err) {
    deleteOpen.value   = false
    deleteTarget.value = null
    store.error = err?.data?.detail || err?.message || 'Delete failed. Please try again.'
  }
}

onMounted(() => store.init())
</script>

<style scoped>
.searchable-wrap { position: relative; }
</style>

<!-- Teleported dropdown — rendered at <body> level to escape modal overflow -->
<style>
.searchable-dropdown-teleport {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  max-height: 220px;
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
.searchable-option.selected   { background: #f3f4f6; }
.searchable-option--clear     { color: #6b7280; font-style: italic; }
.searchable-empty             { padding: 8px 12px; font-size: 13px; color: #9ca3af; }
</style>
