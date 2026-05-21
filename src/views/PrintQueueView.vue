<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Print Queue</h1></div>
      <div class="breadcrumb"><a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Print Queue</span></div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Print Queue Filters</div>

      <div class="pq-filter-grid">
        <div class="form-group">
          <label class="form-label">Date From</label>
          <input v-model="filters.dateFrom" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input v-model="filters.dateTo" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Agent</label>
          <select v-model="filters.agent">
            <option value="">Select All</option>
            <option v-for="a in agents" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Case Ref</label>
          <input v-model="filters.caseRef" type="text" placeholder="case Ref Number" maxlength="50" />
        </div>
        <div class="form-group">
          <label class="form-label">Printed Date From</label>
          <input v-model="filters.printedFrom" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Printed Date To</label>
          <input v-model="filters.printedTo" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Doc Type</label>
          <select v-model="filters.docType">
            <option value="">Select All</option>
            <option v-for="d in docTypes" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Letter Status</label>
          <div class="chip-input">
            <span v-for="(chip, i) in filters.letterStatus" :key="chip" class="chip">
              <button type="button" class="chip-x" @click="removeStatus(i)" :aria-label="`Remove ${chip}`">×</button>
              {{ chip }}
            </span>
            <select v-if="availableStatuses.length" @change="addStatus($event.target.value)" class="chip-select">
              <option value="">+ Add</option>
              <option v-for="s in availableStatuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex" style="justify-content: flex-end">
        <button class="btn-search" @click="applyFilters">SEARCH</button>
      </div>
    </div>

    <!-- Print Queue Table -->
    <div class="card card-padded">
      <div class="card-title">Print Queue</div>

      <!-- Actions -->
      <div class="actions-section">
        <p class="actions-label">Actions</p>
        <div class="action-btns">
          <button class="action-btn" :disabled="!hasSelection" @click="printSelected">PRINT SELECTED</button>
          <button class="action-btn" :disabled="!hasSelection" @click="viewSelected">VIEW SELECTED</button>
          <button class="action-btn" :disabled="selectedRows.length !== 1" @click="openCase">OPEN CASE</button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="toolbar-text">records per page</span>
          <span class="toolbar-divider"></span>
          <button class="refresh-btn" @click="refresh" aria-label="Refresh">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span class="updated-time">updated at {{ lastUpdated }}</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-icon">
                <input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected" @change="toggleAll" aria-label="Select all" />
              </th>
              <th @click="sort('createdDate')" class="sortable">Created Date {{ sortIcon('createdDate') }}</th>
              <th @click="sort('customerName')" class="sortable">Customer Name {{ sortIcon('customerName') }}</th>
              <th @click="sort('letterTitle')" class="sortable">Letter Title {{ sortIcon('letterTitle') }}</th>
              <th @click="sort('caseRef')" class="sortable">Case Reference Number {{ sortIcon('caseRef') }}</th>
              <th @click="sort('caseType')" class="sortable">Case Type {{ sortIcon('caseType') }}</th>
              <th @click="sort('caseStatus')" class="sortable">Case Status {{ sortIcon('caseStatus') }}</th>
              <th @click="sort('letterStatus')" class="sortable">Letter Status {{ sortIcon('letterStatus') }}</th>
              <th>Document Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id" :class="{ 'row-selected': selectedRows.includes(row.id) }">
              <td class="col-icon">
                <input type="checkbox" :checked="selectedRows.includes(row.id)" @change="toggleRow(row.id)" :aria-label="`Select ${row.caseRef}`" />
              </td>
              <td class="text-light">{{ row.createdDate }}</td>
              <td>{{ row.customerName }}</td>
              <td>{{ row.letterTitle }}</td>
              <td><span class="link-cell">{{ row.caseRef }}</span></td>
              <td><span class="badge badge-neutral">{{ row.caseType }}</span></td>
              <td><span :class="`badge badge-${caseStatusColor(row.caseStatus)}`">{{ row.caseStatus }}</span></td>
              <td><span class="status-tag">{{ row.letterStatus }}</span></td>
              <td class="text-muted">{{ row.documentType }}</td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td colspan="9">
                <div class="empty-state">
                  <div class="empty-state-icon">🖨️</div>
                  <p class="empty-state-title">No items in print queue</p>
                  <p class="empty-state-desc">Try adjusting your filters or clearing them.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-meta">Showing {{ rangeStart }} to {{ rangeEnd }} of {{ filteredRows.length.toLocaleString() }} entries</span>
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Previous</button>
        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'

const agents = ['Asif Ansari', 'J. Smith', 'R. Patel', 'M. Khan', 'L. Chen']
const docTypes = ['Case Letter', 'Court Notice', 'Final Demand', 'Appeal Response', 'Warning Letter']
const allStatuses = ['IN_PRINT_QUEUE', 'PRINTED', 'FAILED', 'CANCELLED']

const filters = reactive({
  dateFrom: '',
  dateTo: '',
  agent: '',
  caseRef: '',
  printedFrom: '',
  printedTo: '',
  docType: '',
  letterStatus: ['IN_PRINT_QUEUE']
})

const availableStatuses = computed(() => allStatuses.filter(s => !filters.letterStatus.includes(s)))

function addStatus(val) {
  if (val && !filters.letterStatus.includes(val)) filters.letterStatus.push(val)
}
function removeStatus(idx) {
  filters.letterStatus.splice(idx, 1)
}

const perPage = ref(10)
const currentPage = ref(1)
const selectedRows = ref([])
const sortKey = ref('createdDate')
const sortDir = ref('asc')
const lastUpdated = ref(currentTime())

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
function refresh() {
  lastUpdated.value = currentTime()
  selectedRows.value = []
}

const customers = ['MS Rukhmani Chouhan','Master SJJS USHS','MISS NSJS SHSH','Master HSHS SYSHS','MS Sarah Wilson','Mr John Smith','Miss T. Master','Mr Teddy GR']
const letterTitles = ['Revp Case Create Letter','Revp case create letter (no email)','PFN Print Template','Court Notice Template','Final Demand Letter']
const caseTypes = ['UFN','PF','PFN','MG11','PCN','FT','MICS']
const caseStatuses = ['Open','Court Booked','Closed','Under Appeal','Court Queue']

const allRows = ref(Array.from({ length: 2187 }, (_, i) => {
  const dd = String((i % 28) + 1).padStart(2, '0')
  const mm = String(((i % 12) + 1)).padStart(2, '0')
  const hh = String((i % 24)).padStart(2, '0')
  const mn = String((i * 3) % 60).padStart(2, '0')
  const cType = caseTypes[i % caseTypes.length]
  return {
    id: i + 1,
    createdDate: `${dd}/${mm}/2023 ${hh}:${mn}`,
    customerName: customers[i % customers.length],
    letterTitle: letterTitles[i % letterTitles.length],
    caseRef: `EMR/${cType}/${String(584 + i).padStart(6, '0')}`,
    caseType: cType,
    caseStatus: caseStatuses[i % caseStatuses.length],
    letterStatus: 'IN_PRINT_QUEUE',
    documentType: 'Case Letter'
  }
}))

function applyFilters() {
  currentPage.value = 1
  selectedRows.value = []
}

const filteredRows = computed(() => {
  return allRows.value.filter(r => {
    if (filters.caseRef) {
      const q = sanitizeString(filters.caseRef).toLowerCase()
      if (q && !r.caseRef.toLowerCase().includes(q)) return false
    }
    if (filters.letterStatus.length && !filters.letterStatus.includes(r.letterStatus)) return false
    if (filters.docType && r.documentType !== filters.docType) return false
    return true
  }).sort((a, b) => {
    const mul = sortDir.value === 'asc' ? 1 : -1
    return a[sortKey.value] > b[sortKey.value] ? mul : -mul
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / perPage.value)))
const rangeStart = computed(() => filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd = computed(() => Math.min(currentPage.value * perPage.value, filteredRows.value.length))
const pagedRows = computed(() => filteredRows.value.slice(rangeStart.value - 1, rangeEnd.value))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }
  return pages.filter((p, i, arr) => p !== '…' || arr[i - 1] !== '…').slice(0, 7)
})

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function toggleRow(id) {
  const idx = selectedRows.value.indexOf(id)
  idx === -1 ? selectedRows.value.push(id) : selectedRows.value.splice(idx, 1)
}
function toggleAll() {
  if (allSelected.value) selectedRows.value = []
  else selectedRows.value = pagedRows.value.map(r => r.id)
}
const allSelected = computed(() => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedRows.value.includes(r.id)))
const someSelected = computed(() => selectedRows.value.length > 0 && !allSelected.value)
const hasSelection = computed(() => selectedRows.value.length > 0)

function caseStatusColor(s) {
  const map = {
    'Open':'info', 'Closed':'success', 'Court Queue':'warning',
    'Court Booked':'info', 'Under Appeal':'danger'
  }
  return map[s] ?? 'neutral'
}

function printSelected() { /* hook to API */ }
function viewSelected() { /* hook to API */ }
function openCase() { /* hook to router */ }
</script>

<style scoped>
.pq-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px 18px;
  margin-bottom: 14px;
}
@media (max-width: 1200px) { .pq-filter-grid { grid-template-columns: repeat(2, 1fr); } }

.chip-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  min-height: 34px;
  align-items: center;
}
.chip-input:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px 2px 4px;
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-strong);
}
.chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px;
  color: var(--text-light);
  font-size: 14px;
  line-height: 1;
  border-radius: 3px;
}
.chip-x:hover { background: var(--border); color: var(--text-strong); }
.chip-select {
  border: none;
  padding: 0 2px;
  font-size: 11px;
  color: var(--text-light);
  background: transparent;
  width: auto;
  flex: 1;
  min-width: 60px;
}
.chip-select:focus { box-shadow: none; }

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

.actions-section { margin-bottom: 14px; }
.actions-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.action-btns { display: flex; gap: 10px; flex-wrap: wrap; }
.action-btn {
  padding: 7px 16px;
  background: #d1ede0;
  color: #15a982;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}
.action-btn:hover:not(:disabled) { background: #15a982; color: #fff; }
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.rows-select { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }
.toolbar-divider { width: 1px; height: 16px; background: var(--border); margin: 0 4px; }
.refresh-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 12px;
  transition: all var(--transition);
}
.refresh-btn:hover { background: var(--bg-hover); color: var(--text-strong); }
.updated-time { color: var(--text-light); }

.row-selected { background: var(--primary-light) !important; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: 3px;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

:deep(table) { font-size: 12px; }
:deep(thead th) { padding: 10px 12px; }
:deep(tbody td) { padding: 11px 12px; }
</style>
