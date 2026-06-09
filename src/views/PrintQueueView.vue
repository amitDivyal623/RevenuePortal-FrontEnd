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
            <option v-for="a in agents" :key="a.user_id" :value="a.user_id">{{ a.name }}</option>
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { printQueueService } from '@/services/print-queue.service.js'

// ── Reference data (loaded from /revp/printqueue/lookups/) ──────────────
const agents = ref([])         // [{ user_id, name }]
const docTypes = ref([])       // ['Case Letter', ...]
const allStatuses = ref([])    // [{ letter_status_id, name }]

// ── Filter state ────────────────────────────────────────────────────────
// Map between status NAME (what the chip UI shows) and status ID (what the
// backend wants). The backend filter accepts a csv of IDs.
const filters = reactive({
  dateFrom: '',
  dateTo: '',
  agent: '',
  caseRef: '',
  printedFrom: '',
  printedTo: '',
  docType: '',
  letterStatus: ['IN_PRINT_QUEUE'],  // chip array — by NAME
})

const availableStatuses = computed(() =>
  allStatuses.value
    .map(s => s.name)
    .filter(n => !filters.letterStatus.includes(n))
)

function addStatus(val) {
  if (val && !filters.letterStatus.includes(val)) filters.letterStatus.push(val)
}
function removeStatus(idx) {
  filters.letterStatus.splice(idx, 1)
}

const statusIdsForFilter = computed(() =>
  filters.letterStatus
    .map(name => allStatuses.value.find(s => s.name === name)?.letter_status_id)
    .filter(Boolean)
)

// ── Pagination / sort / loading state ───────────────────────────────────
const perPage = ref(10)
const currentPage = ref(1)
const selectedRows = ref([])  // array of print_id strings
const sortKey = ref('created_dt')
const sortDir = ref('desc')
const lastUpdated = ref(currentTime())
const loading = ref(false)
const apiError = ref('')

// Rows + total fetched from backend.
const rows = ref([])      // server-paginated page
const total = ref(0)

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Map UI column key → backend ordering token (validators allowlist).
const SORT_TO_ORDERING = {
  createdDate:   'created_dt',
  customerName: null,  // not a sortable server field — fall back to default
  letterTitle:  'comm__letter_template__title',
  caseRef:      'comm__case__case_num',
  caseType:     'comm__case__case_type__code',
  caseStatus:   'comm__case__case_status__status_desc',
  letterStatus: 'comm__letter_status__name',
  documentType: 'document_type',
}

function backendOrdering() {
  const base = SORT_TO_ORDERING[sortKey.value] || 'created_dt'
  return sortDir.value === 'desc' ? `-${base}` : base
}

// ── Data loading ────────────────────────────────────────────────────────
async function fetchPage() {
  loading.value = true
  apiError.value = ''
  try {
    const data = await printQueueService.list({
      page:           currentPage.value,
      pageSize:       perPage.value,
      ordering:       backendOrdering(),
      dateFrom:       filters.dateFrom || undefined,
      dateTo:         filters.dateTo   || undefined,
      printedFrom:    filters.printedFrom || undefined,
      printedTo:      filters.printedTo   || undefined,
      caseNum:        filters.caseRef.trim() || undefined,
      documentType:   filters.docType || undefined,
      agent:          filters.agent   || undefined,
      letterStatusIds: statusIdsForFilter.value,
    })
    rows.value  = data?.results ?? []
    total.value = data?.total   ?? 0
    lastUpdated.value = currentTime()
  } catch (e) {
    console.error('[print-queue] fetch failed', e)
    apiError.value = e?.message || 'Failed to load print queue.'
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadLookups() {
  try {
    const data = await printQueueService.lookups()
    allStatuses.value = data?.letter_statuses ?? []
    docTypes.value    = data?.document_types  ?? []
    agents.value      = data?.agents          ?? []
  } catch (e) {
    console.warn('[print-queue] lookups failed', e)
  }
}

function refresh() {
  selectedRows.value = []
  fetchPage()
}

function applyFilters() {
  currentPage.value = 1
  selectedRows.value = []
  fetchPage()
}

// ── Derived view-model — keep template field names stable ───────────────
const pagedRows = computed(() => rows.value.map(r => ({
  id:           r.print_id,
  print_id:     r.print_id,
  case_id:      r.case_id,
  createdDate:  fmtDateTime(r.created_dt),
  customerName: r.customer_name || '—',
  letterTitle:  r.letter_title  || '—',
  caseRef:      r.case_num      || '—',
  caseType:     r.case_type_code || '—',
  caseStatus:   r.case_status_desc || '—',
  letterStatus: r.letter_status_name || '—',
  documentType: r.document_type || '—',
})))

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
const rangeStart = computed(() => total.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(currentPage.value * perPage.value, total.value))

// Expose `filteredRows` for the template's existing pagination footer.
const filteredRows = computed(() => ({ length: total.value }))

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}

// Refetch when sort / pagination / page-size changes.
watch([currentPage, perPage, sortKey, sortDir], () => fetchPage())

onMounted(async () => {
  await loadLookups()
  fetchPage()
})

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

// ── Render-selected helpers ────────────────────────────────────────────
// Both buttons hit the same backend endpoint (/printqueue/view-merged/)
// which returns a single merged PDF. The frontend decides what to do with
// the Blob:
//   VIEW SELECTED  → open in a new tab (browser inline-renders the PDF)
//   PRINT SELECTED → trigger a download (operator opens it and prints)
async function _renderSelected() {
  const ids = selectedRows.value.slice()
  if (ids.length === 0) {
    window.alert('Select at least one letter first.')
    return null
  }
  try {
    const { blob, failed } = await printQueueService.viewMerged(ids)
    if (failed && Array.isArray(failed) && failed.length) {
      console.warn('[print-queue] some letters failed to render:', failed)
    }
    return { blob, failed }
  } catch (e) {
    console.error('[print-queue] render failed', e)
    const detail = e?.data?.detail || e?.message || 'Failed to render the selected letters.'
    window.alert(detail)
    return null
  }
}

async function viewSelected() {
  const res = await _renderSelected()
  if (!res) return
  const url = URL.createObjectURL(res.blob)
  window.open(url, '_blank', 'noopener')
  // Revoke later — the new tab needs the URL alive long enough for the
  // browser to fetch the bytes.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  if (res.failed?.length) {
    window.alert(`Preview opened — ${res.failed.length} letter(s) failed to render. See console for ids.`)
  }
}

async function printSelected() {
  // PRINT SELECTED is a single backend call now — the finalize-print
  // pipeline renders, saves per-letter PDFs as case attachments, flips
  // status to PRINTED, AND streams back the merged PDF for download.
  // One round-trip = one render pass = no extra wait for the user.
  const ids = selectedRows.value.slice()
  if (ids.length === 0) {
    window.alert('Select at least one letter first.')
    return
  }
  try {
    const { blob, failed } = await printQueueService.finalizePrint(ids)
    if (failed?.length) {
      console.warn('[print-queue] finalize-print partial failures:', failed)
    }

    // Trigger the file download.
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const a = document.createElement('a')
    a.href = url
    a.download = `letters-${stamp}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)

    // Refresh — printed rows fall out of the default IN_PRINT_QUEUE filter.
    selectedRows.value = []
    await fetchPage()

    if (failed?.length) {
      window.alert(
        `Printed ${ids.length - failed.length} of ${ids.length} letter(s). ` +
        `${failed.length} failed and remain in the queue. See console for details.`,
      )
    }
  } catch (e) {
    console.error('[print-queue] finalize-print failed', e)
    const detail = e?.data?.detail || e?.message || 'Print failed.'
    window.alert(detail)
  }
}
function openCase() {
  // Selection holds print_ids. Map back to case_id via the loaded rows.
  const selectedId = selectedRows.value[0]
  const row = rows.value.find(r => r.print_id === selectedId)
  if (row?.case_id) {
    window.open(`/cases/${row.case_id}`, '_blank', 'noopener')
  }
}
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
