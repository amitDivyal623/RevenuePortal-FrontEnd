<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Intelligence Report</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Intelligence Report</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Intelligence Report Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Reporter</label>
          <input v-model="filters.reporter" type="text" placeholder="Reporter" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Date From</label>
          <input v-model="filters.dateFrom" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input v-model="filters.dateTo" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <select v-model="filters.location">
            <option value="">Select Location</option>
            <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm" style="justify-content: flex-end; margin-top: 14px">
        <button class="btn-search" @click="applyFilters">SEARCH</button>
        <button class="btn-reset" @click="resetFilters">RESET</button>
      </div>
    </div>

    <!-- Intelligence Report table -->
    <div class="card card-padded">
      <div class="card-title">Intelligence Report</div>

      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-icon">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected"
                  @change="toggleAll"
                  aria-label="Select all"
                />
              </th>
              <th @click="sort('name')" class="sortable">Reporter {{ sortIcon('name') }}</th>
              <th @click="sort('dateTimeOfReport')" class="sortable">Date / Time {{ sortIcon('dateTimeOfReport') }}</th>
              <th @click="sort('location')" class="sortable">Location {{ sortIcon('location') }}</th>
              <th @click="sort('headcode')" class="sortable">Headcode {{ sortIcon('headcode') }}</th>
              <th @click="sort('optPoliceRef')" class="sortable">Police Reference Number {{ sortIcon('optPoliceRef') }}</th>
              <th class="col-preview">Report Preview</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.ID" :class="{ 'row-selected': selectedIds.includes(row.ID) }">
              <td class="col-icon">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.ID)"
                  @change="toggleRow(row.ID)"
                  :aria-label="`Select report ${row.ID}`"
                />
              </td>
              <td>{{ row.name }}</td>
              <td>{{ row.dateTimeOfReport }}</td>
              <td>{{ row.location }}</td>
              <td>{{ row.headcode }}</td>
              <td>{{ row.optPoliceRef }}</td>
              <td class="col-preview"><div class="report-preview">{{ row.report }}</div></td>
              <td>
                <button class="action-btn-green" @click="viewReport(row)">VIEW</button>
              </td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-state-icon">📋</div>
                  <p class="empty-state-title">No reports found</p>
                  <p class="empty-state-desc">Try adjusting your filters or click RESET.</p>
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

    <!-- View Intelligence Report modal -->
    <div v-if="showViewModal" class="modal-backdrop" @click.self="closeViewModal">
      <div class="modal-card modal-card-wide" role="dialog" aria-labelledby="viewReportTitle">
        <div class="modal-header">
          <h2 id="viewReportTitle" class="modal-title">View Intelligence Report</h2>
          <button class="modal-close" @click="closeViewModal" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-form-row">
            <label class="modal-label">Reference Number</label>
            <input :value="viewRow?.referenceNumber" type="text" readonly class="field-readonly" />
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Reporter</label>
            <input :value="viewRow?.name" type="text" readonly class="field-readonly" />
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Location</label>
            <input :value="viewRow?.location" type="text" readonly class="field-readonly" />
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Date/Time</label>
            <input :value="viewRow?.dateTimeOfReport" type="text" readonly class="field-readonly" />
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Headcode</label>
            <input :value="viewRow?.headcode" type="text" readonly class="field-readonly" />
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Police Reference Number</label>
            <input :value="viewRow?.optPoliceRef" type="text" readonly placeholder="Police Reference Number" class="field-readonly" />
          </div>
          <div class="modal-form-row modal-form-row-top">
            <label class="modal-label">Report</label>
            <textarea :value="viewRow?.report" readonly rows="4" class="field-readonly"></textarea>
          </div>
          <div class="modal-form-row">
            <label class="modal-label">Attachments</label>
            <span class="attachment-text">No Attachment Available</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeViewModal">CANCEL</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive, watch, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'

const locations = ['Aberdour', 'Aberdeen', 'Aberdare', 'Beton Station', 'Bristol', 'Cardiff', 'Edinburgh', 'Glasgow']
const reporters = ['Developer Testing', 'J. Smith', 'A. Ansari', 'R. Patel', 'M. Khan']
const headcodes = ['1D11', '1D22', '1G11', '2A14', '1B05', '']

const filters = reactive({ reporter: '', dateFrom: '', dateTo: '', location: '' })
const applied = reactive({ ...filters })

const perPage = ref(25)
const currentPage = ref(1)
const sortKey = ref('name')
const sortDir = ref('asc')
const selectedIds = ref([])

const allRows = ref(Array.from({ length: 87 }, (_, i) => {
  const dd = String((i % 28) + 1).padStart(2, '0')
  const mm = String(((i % 12) + 1)).padStart(2, '0')
  const yyyy = 2022 + (i % 3)
  const hh = String((i % 24)).padStart(2, '0')
  const mn = String((i * 7) % 60).padStart(2, '0')
  const blank = i === 0
  return {
    ID: 5000 + i,
    referenceNumber: `EMR/XZ/${String(2000 + i).padStart(6, '0')}`,
    name: blank ? '' : reporters[i % reporters.length],
    dateTimeOfReport: `${dd}/${mm}/${yyyy} ${hh}:${mn}`,
    location: locations[i % locations.length],
    headcode: blank ? '' : headcodes[i % headcodes.length],
    optPoliceRef: i % 7 === 0 ? `PR-${1000 + i}` : '',
    report: blank ? 'test' : ['hshshshsh', 'bsndndnxjx', 'dnndbd', 'jxjsmdmsms', 'yhgvn', 'hxjdjdjd', 'Suspicious activity reported near platform 3', 'Unverified intel - check CCTV', 'Repeat fare evasion suspect spotted'][i % 9]
  }
}))

const filteredRows = computed(() => {
  return allRows.value.filter(r => {
    if (applied.reporter && !r.name.toLowerCase().includes(applied.reporter.toLowerCase())) return false
    if (applied.location && r.location !== applied.location) return false
    if (applied.dateFrom || applied.dateTo) {
      const [d, m, y] = r.dateTimeOfReport.split(' ')[0].split('/')
      const iso = `${y}-${m}-${d}`
      if (applied.dateFrom && iso < applied.dateFrom) return false
      if (applied.dateTo   && iso > applied.dateTo)   return false
    }
    return true
  }).sort((a, b) => {
    const mul = sortDir.value === 'asc' ? 1 : -1
    const av = a[sortKey.value] ?? ''
    const bv = b[sortKey.value] ?? ''
    return av > bv ? mul : -mul
  })
})

const totalRecords = computed(() => filteredRows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / perPage.value)))
const rangeStart = computed(() => totalRecords.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd = computed(() => Math.min(currentPage.value * perPage.value, totalRecords.value))
const pagedRows = computed(() => filteredRows.value.slice(rangeStart.value - 1, rangeEnd.value))

const pageNumbers = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) pages.push(i)
  }
  return pages.slice(0, 7)
})

function applyFilters() {
  Object.assign(applied, {
    reporter: sanitizeString(filters.reporter),
    dateFrom: filters.dateFrom,
    dateTo:   filters.dateTo,
    location: filters.location
  })
  currentPage.value = 1
  selectedIds.value = []
}
function resetFilters() {
  Object.assign(filters, { reporter: '', dateFrom: '', dateTo: '', location: '' })
  Object.assign(applied, { reporter: '', dateFrom: '', dateTo: '', location: '' })
  currentPage.value = 1
  selectedIds.value = []
}

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function toggleRow(id) {
  const idx = selectedIds.value.indexOf(id)
  idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1)
}
function toggleAll() {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = pagedRows.value.map(r => r.ID)
}
const allSelected = computed(() => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedIds.value.includes(r.ID)))
const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value)

const showViewModal = ref(false)
const viewRow = ref(null)

function viewReport(row) {
  viewRow.value = row
  showViewModal.value = true
}
function closeViewModal() { showViewModal.value = false }

function onEscKey(e) {
  if (e.key === 'Escape' && showViewModal.value) closeViewModal()
}
watch(showViewModal, (open) => {
  if (open) document.addEventListener('keydown', onEscKey)
  else document.removeEventListener('keydown', onEscKey)
})
onUnmounted(() => document.removeEventListener('keydown', onEscKey))
</script>

<style scoped>
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

.btn-reset {
  padding: 8px 22px;
  background: var(--danger);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-reset:hover { background: #dc2626; }

.action-btn-green {
  padding: 5px 14px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.action-btn-green:hover { background: #128968; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.rows-select { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }

.col-preview { min-width: 220px; max-width: 320px; }
.report-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
  color: var(--text-default);
}

.row-selected { background: var(--primary-light) !important; }

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
.modal-card-wide { max-width: 660px; }
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
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.modal-form-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 12px;
}
.modal-form-row-top { align-items: start; }
.modal-label { font-size: 13px; color: var(--text-default); font-weight: 500; }

.field-readonly {
  background: var(--bg-page);
  border-color: var(--border);
  color: var(--text-strong);
  cursor: default;
  resize: vertical;
}
.field-readonly:focus, .field-readonly:hover { border-color: var(--border); box-shadow: none; }

.attachment-text { font-size: 13px; color: var(--text-muted); }

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

@media (max-width: 600px) {
  .modal-form-row { grid-template-columns: 1fr; }
  .modal-label { margin-bottom: -4px; }
}
</style>
