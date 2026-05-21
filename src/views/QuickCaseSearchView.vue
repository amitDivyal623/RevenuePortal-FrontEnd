<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Quick Case Search</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Quick Case Search</span>
      </div>
    </div>

    <!-- Search criteria -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Quick Case Search</div>
      <div class="form-group">
        <label class="form-label">Enter Search Term</label>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Case number, name, court ref or VRM"
          maxlength="100"
          @keyup.enter="applySearch"
        />
      </div>
      <div class="flex gap-sm" style="justify-content: flex-end; margin-top: 14px">
        <button class="btn-search" @click="applySearch">SEARCH</button>
        <button class="btn-open" :disabled="selectedIds.length === 0" @click="openSelected">OPEN SELECTED CASE</button>
      </div>
    </div>

    <!-- Results -->
    <div class="card card-padded">
      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
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
              <th @click="sort('caseNum')" class="sortable">Case Number {{ sortIcon('caseNum') }}</th>
              <th @click="sort('caseDT')" class="sortable">Offence Date {{ sortIcon('caseDT') }}</th>
              <th @click="sort('code')" class="sortable">Type {{ sortIcon('code') }}</th>
              <th @click="sort('statusDesc')" class="sortable">Status {{ sortIcon('statusDesc') }}</th>
              <th @click="sort('Surname')" class="sortable">Offender {{ sortIcon('Surname') }}</th>
              <th @click="sort('customer_age')" class="sortable">Age {{ sortIcon('customer_age') }}</th>
              <th @click="sort('PostCode')" class="sortable">Post Code {{ sortIcon('PostCode') }}</th>
              <th @click="sort('regNum')" class="sortable">Vehicle Registration {{ sortIcon('regNum') }}</th>
              <th @click="sortByOutstanding" class="sortable">Outstanding {{ sortIcon('outstanding') }}</th>
              <th @click="sort('reason')" class="sortable">Closure Reason {{ sortIcon('reason') }}</th>
              <th>Linked Cases</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRows"
              :key="row.case_id"
              :class="{ 'row-selected': selectedIds.includes(row.case_id) }"
            >
              <td class="col-icon">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(row.case_id)"
                  @change="toggleRow(row.case_id)"
                  :aria-label="`Select ${row.caseNum}`"
                />
              </td>
              <td>
                <span class="link-cell" :class="caseNumClass(row)" @click="goToCase(row.case_id)">{{ row.caseNum }}</span>
              </td>
              <td class="text-light">{{ row.caseDT }}</td>
              <td><span class="badge badge-neutral">{{ row.code }}</span></td>
              <td><span :class="statusColor(row.statusDesc)">{{ row.statusDesc }}</span></td>
              <td>{{ row.title }} {{ row.FirstName }} {{ row.Surname }}</td>
              <td :class="ageClass(row)">{{ row.customer_age || 0 }}</td>
              <td :class="ageClass(row)">{{ row.PostCode }}</td>
              <td>{{ row.regNum }}</td>
              <td :class="outstandingCellClass(row)">£ {{ formatOutstanding(row) }}</td>
              <td class="text-light">{{ row.reason }}</td>
              <td>
                <button
                  class="linked-pill"
                  :class="{ 'linked-pill-zero': row.linked_case_count === 0, 'linked-pill-active': row.linked_case_count > 0 }"
                  :disabled="row.linked_case_count === 0"
                  @click="openLinked(row)"
                >
                  {{ row.linked_case_count }}
                </button>
              </td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td colspan="12">
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <p class="empty-state-title">No matching cases</p>
                  <p class="empty-state-desc">Try a different search term — case number, name, court ref or VRM.</p>
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
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'

const router = useRouter()
function goToCase(caseid) {
  router.push({ name: 'case-details', params: { caseid } })
}

const surnames = ['DONNELLY', 'SMITH', 'PATEL', 'KHAN', 'CHEN', 'JOHNSON', 'WILLIAMS', 'BROWN']
const firstNames = ['SORAYA', 'JOHN', 'RAVI', 'AISHA', 'LEI', 'MARK', 'OLIVIA', 'ETHAN']
const titles = ['MISS', 'MR', 'MISS', 'MRS', 'MR', 'MR', 'MISS', 'MR']
const types = ['PFN', 'UFN', 'PCN', 'MG11', 'MICS', 'FT']
const statuses = ['Open', 'Closed', 'Under Appeal', 'Court Booked']
const postcodes = ['WD18 7DN', 'SW1A 1AA', 'E14 5AB', 'NW1 6XE', 'CR0 2YR', 'M1 4BT']
const closureReasons = ['', 'Paid in full', 'Withdrawn', 'Insufficient evidence', '']

const searchTerm = ref('')
const appliedTerm = ref('')
const perPage = ref(5)
const currentPage = ref(1)
const sortKey = ref('caseDT')
const sortDir = ref('desc')
const selectedIds = ref([])
const lastUpdated = ref(currentTime())

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
function refresh() {
  lastUpdated.value = currentTime()
}

const allRows = ref(Array.from({ length: 30 }, (_, i) => {
  const dd = String((i % 28) + 1).padStart(2, '0')
  const mm = String(((i % 12) + 1)).padStart(2, '0')
  const yyyy = 2025 + (i % 2)
  const type = types[i % types.length]
  const status = statuses[i % statuses.length]
  let amountDue = 0, amountPaid = 0
  switch (i % 6) {
    case 0: amountDue = 81.30;  amountPaid = 0;     break
    case 1: amountDue = 50.00;  amountPaid = 50.00; break
    case 2: amountDue = 120.00; amountPaid = 30.00; break
    case 3: amountDue = 40.00;  amountPaid = 75.00; break
    case 4: amountDue = 200.00; amountPaid = 0;     break
    case 5: amountDue = 0;      amountPaid = 0;     break
  }
  let age = 25 + (i % 30)
  if (i % 7 === 0) age = 16
  if (i % 11 === 0) age = 0
  return {
    case_id: 10000 + i,
    caseNum: `EMR/${type}/${String(122000 + i).padStart(6, '0')}`,
    caseDT: `${dd}/${mm}/${yyyy}`,
    code: type,
    statusDesc: status,
    title: titles[i % titles.length],
    FirstName: firstNames[i % firstNames.length],
    Surname: surnames[i % surnames.length],
    customer_age: age,
    PostCode: postcodes[i % postcodes.length],
    regNum: i % 4 === 0 ? `AB${20 + (i % 20)} ${['XYZ','PQR','MNO','JKL'][i % 4]}` : '',
    amountDue,
    amountPaid,
    reason: status === 'Closed' ? closureReasons[i % closureReasons.length] : '',
    linked_case_count: i % 5 === 0 ? (i % 7) : 0
  }
}))

const filteredRows = computed(() => {
  const q = appliedTerm.value.toLowerCase()
  let rows = allRows.value
  if (q) {
    rows = rows.filter(r =>
      r.caseNum.toLowerCase().includes(q) ||
      r.FirstName.toLowerCase().includes(q) ||
      r.Surname.toLowerCase().includes(q) ||
      (r.regNum && r.regNum.toLowerCase().includes(q)) ||
      (r.PostCode && r.PostCode.toLowerCase().includes(q))
    )
  }
  return [...rows].sort((a, b) => {
    const mul = sortDir.value === 'asc' ? 1 : -1
    if (sortKey.value === 'outstanding') {
      const av = a.amountDue - a.amountPaid
      const bv = b.amountDue - b.amountPaid
      return av > bv ? mul : -mul
    }
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

function applySearch() {
  appliedTerm.value = sanitizeString(searchTerm.value)
  currentPage.value = 1
  selectedIds.value = []
}

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortByOutstanding() { sort('outstanding') }
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function toggleRow(id) {
  const idx = selectedIds.value.indexOf(id)
  idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1)
}
function toggleAll() {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = pagedRows.value.map(r => r.case_id)
}
const allSelected = computed(() => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedIds.value.includes(r.case_id)))
const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value)

function openSelected() {
  if (selectedIds.value.length === 1) {
    goToCase(selectedIds.value[0])
  }
}

function openLinked(row) {
  void row
}

function outstandingValue(row) { return row.amountDue - row.amountPaid }
function formatOutstanding(row) { return Math.abs(outstandingValue(row)).toFixed(2) }

function outstandingCellClass(row) {
  const v = outstandingValue(row)
  switch (row.statusDesc) {
    case 'Open':
      if (v === 0) return 'cell-bg-green'
      if (v > 0)   return 'cell-bg-red'
      return 'cell-bg-black'
    case 'Closed':
      if (v === 0) return 'cell-text-green'
      return 'cell-text-red'
    case 'Under Appeal':
    case 'Court Booked':
      if (v > 0)   return 'cell-bg-red'
      return ''
    default:
      return ''
  }
}
function caseNumClass(row) {
  return row.statusDesc === 'Closed' && outstandingValue(row) === 0 ? 'case-num-closed-zero' : ''
}
function ageClass(row) {
  if (!row.customer_age) return 'age-warn'
  if (row.customer_age < 18) return 'age-minor'
  return ''
}
function statusColor(status) {
  switch (status) {
    case 'Open':         return 'status-open'
    case 'Closed':       return 'status-closed'
    case 'Under Appeal': return 'status-appeal'
    case 'Court Booked': return 'status-booked'
    default:             return ''
  }
}
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

.btn-open {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-open:hover:not(:disabled) { background: #128968; }
.btn-open:disabled {
  background: #d1ede0;
  color: #6aa28e;
  cursor: not-allowed;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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

.cell-bg-green { background: var(--success); color: #fff; font-weight: 600; text-align: center; }
.cell-bg-red   { background: var(--danger);  color: #fff; font-weight: 600; text-align: center; }
.cell-bg-black { background: #1e2236; color: #fff; font-weight: 600; text-align: center; }
.cell-text-green { color: var(--success); font-weight: 600; }
.cell-text-red   { color: var(--danger);  font-weight: 600; }

.case-num-closed-zero { color: var(--danger) !important; }

.age-warn  { color: var(--danger); }
.age-minor { color: var(--danger); font-weight: 700; }

.status-open   { color: var(--text-default); }
.status-closed { color: var(--success); font-weight: 600; }
.status-appeal { color: var(--danger);  font-weight: 600; }
.status-booked { color: var(--warning); font-weight: 600; }

.linked-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  transition: all var(--transition);
}
.linked-pill-zero { background: var(--bg-hover); color: var(--text-light); cursor: not-allowed; }
.linked-pill-active { background: var(--primary-light); color: var(--primary); cursor: pointer; }
.linked-pill-active:hover { background: var(--primary); color: #fff; }

:deep(table) { font-size: 12px; }
:deep(thead th) { padding: 10px 12px 10px 0; }
:deep(tbody td) { padding: 11px 12px 11px 0; }
</style>
