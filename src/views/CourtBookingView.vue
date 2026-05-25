<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Court Booking</h1></div>
      <div class="page-actions">
        <div class="breadcrumb">
          <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Court Booking</span>
        </div>
        <button class="btn-add" @click="openAddModal">ADD COURT BOOKING</button>
      </div>
    </div>

    <!-- Court filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Court Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Court</label>
          <select v-model="filterCourt">
            <option value="">Please select Court</option>
            <option v-for="c in courts" :key="c.court_id" :value="c.court_id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <div class="flex" style="justify-content: flex-end">
        <button class="btn-search" @click="applyFilter">SEARCH</button>
      </div>
    </div>

    <!-- Court booking table -->
    <div class="card card-padded">
      <div class="card-title">Court Booking</div>

      <div class="actions-section">
        <p class="actions-label">Actions</p>
        <div class="action-btns">
          <button class="action-btn-green" @click="printDiary">PRINT PROSECUTOR DIARY</button>
        </div>
      </div>

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
              <th @click="sort('court_name')" class="sortable">Court {{ sortIcon('court_name') }}</th>
              <th @click="sort('start_dt')" class="sortable">Start Date/Time {{ sortIcon('start_dt') }}</th>
              <th @click="sort('capacity')" class="sortable">Capacity {{ sortIcon('capacity') }}</th>
              <th @click="sort('duration')" class="sortable">Cases Assigned {{ sortIcon('duration') }}</th>
              <th @click="sort('prosecutor_name')" class="sortable">Prosecutor {{ sortIcon('prosecutor_name') }}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in bookings" :key="row.court_booking_id">
              <td>{{ row.court_name }}</td>
              <td>{{ formatStartDT(row.start_dt) }}</td>
              <td>{{ row.capacity }}</td>
              <td>
                <span v-if="row.duration > 0" class="link-cell">{{ row.duration }}</span>
                <span v-else>{{ row.duration }}</span>
              </td>
              <td>{{ row.prosecutor_name }}</td>
              <td>
                <button class="edit-link" @click="openEditModal(row)">Edit</button>
              </td>
            </tr>
            <tr v-if="bookings.length === 0">
              <td colspan="6">
                <div class="empty-state">
                  <div class="empty-state-icon">📅</div>
                  <p class="empty-state-title">No bookings found</p>
                  <p class="empty-state-desc">Try selecting a different court or clearing the filter.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-meta">Showing {{ rangeStart }} to {{ rangeEnd }} of {{ totalRecords.toLocaleString() }} entries</span>
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Previous</button>
        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
      </div>
    </div>

    <!-- Add / Edit booking modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card" role="dialog" aria-labelledby="bookingModalTitle">
        <div class="modal-header">
          <h2 id="bookingModalTitle" class="modal-title">
            {{ modalMode === 'edit' ? 'Edit Booking' : 'Add Booking' }}
          </h2>
          <button class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-row">
            <label class="modal-label">Court</label>
            <select v-model="modalForm.court">
              <option value="">Select Court</option>
              <option v-for="c in courts" :key="c.court_id" :value="c.court_id">{{ c.name }}</option>
            </select>
          </div>

          <div class="modal-form-row">
            <label class="modal-label">Start Date/Time</label>
            <div class="modal-datetime">
              <input v-model="modalForm.date" type="date" />
              <input v-model="modalForm.time" type="time" />
            </div>
          </div>

          <div class="modal-form-row">
            <label class="modal-label">Capacity</label>
            <input v-model.number="modalForm.capacity" type="number" placeholder="capacity" min="0" />
          </div>

          <div class="modal-form-row">
            <label class="modal-label">Prosecutor</label>
            <select v-model="modalForm.prosecutor">
              <option value="">Prosecutor</option>
              <option v-for="p in prosecutors" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">CANCEL</button>
          <button class="btn-save" @click="saveBooking">SAVE</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useCourtBookingStore } from '@/store/court-booking.store.js'

const store = useCourtBookingStore()

const prosecutors = ['Mr John Tester', 'Ms Brock', 'Ms Test Prosecutor', 'Mr A. Smith', 'Ms L. Chen']

const courts       = computed(() => store.courts)
const bookings     = computed(() => store.bookings)
const totalRecords = computed(() => store.totalRecords)
const loading      = computed(() => store.loading)

const filterCourt = ref('')
const perPage = ref(10)
const currentPage = ref(1)
const sortKey = ref('start_dt')
const sortDir = ref('asc')

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

function buildBookingParams() {
  const params = {
    page: String(currentPage.value),
    page_size: String(perPage.value),
    order_by: sortKey.value,
    direction: sortDir.value,
  }
  if (filterCourt.value) params.court_id = filterCourt.value
  return params
}

function loadBookings() {
  store.fetchBookings(buildBookingParams())
}

onMounted(() => {
  store.fetchCourts()
  loadBookings()
})
watch([currentPage, perPage, sortKey, sortDir], loadBookings)

function applyFilter() {
  currentPage.value = 1
  loadBookings()
}
function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function formatStartDT(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh   = String(d.getHours()).padStart(2, '0')
  const mn   = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mn}`
}

function printDiary() { /* hook to API */ }

const showModal = ref(false)
const modalMode = ref('add')
const modalForm = reactive({
  bookingId: null,
  court: '',
  date: '',
  time: '',
  capacity: null,
  prosecutor: ''
})

function resetModalForm() {
  Object.assign(modalForm, { bookingId: null, court: '', date: '', time: '', capacity: null, prosecutor: '' })
}

function openAddModal() {
  modalMode.value = 'add'
  resetModalForm()
  showModal.value = true
}

function openEditModal(row) {
  modalMode.value = 'edit'
  const d = new Date(row.start_dt)
  const isoDate = isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const isoTime = isNaN(d.getTime())
    ? ''
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  Object.assign(modalForm, {
    bookingId: row.court_booking_id,
    court: row.court_id,
    date: isoDate,
    time: isoTime,
    capacity: row.capacity,
    prosecutor: row.prosecutor_name || ''
  })
  showModal.value = true
}

function closeModal() { showModal.value = false }
function saveBooking() {
  closeModal()
}

function onEscKey(e) {
  if (e.key === 'Escape' && showModal.value) closeModal()
}
watch(showModal, (open) => {
  if (open) document.addEventListener('keydown', onEscKey)
  else document.removeEventListener('keydown', onEscKey)
})
onUnmounted(() => document.removeEventListener('keydown', onEscKey))
</script>

<style scoped>
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
  transition: background var(--transition);
}
.btn-search:hover { background: #128968; }

.action-btn-green {
  padding: 7px 16px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.action-btn-green:hover { background: #128968; }

.actions-section { margin-bottom: 14px; }
.actions-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.action-btns { display: flex; gap: 10px; flex-wrap: wrap; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
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
@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: none; opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  transition: all var(--transition);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-strong); }

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.modal-form-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 12px;
}
.modal-label { font-size: 13px; color: var(--text-default); font-weight: 500; }
.modal-datetime { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

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
  transition: background var(--transition);
}
.btn-cancel:hover { background: #dc2626; }

.btn-save {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-save:hover { background: #128968; }

@media (max-width: 600px) {
  .modal-form-row { grid-template-columns: 1fr; }
  .modal-label { margin-bottom: -4px; }
}
</style>
