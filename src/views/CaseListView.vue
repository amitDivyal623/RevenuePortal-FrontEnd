<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Case List</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Case List</span>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Filters card — three-column legacy layout. Each column groups
         related filter fields so the operator can scan top-to-bottom.
         ─────────────────────────────────────────────────────────────── -->
    <div class="card card-padded mb-lg">
      <div class="card-section-head">
        <strong class="ch-heading">CASE LIST FILTERS</strong>
      </div>

      <div class="case-list-filters">
        <!-- Column 1: identity + classification -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Case Number</label>
            <input
              v-model="filters.caseNo"
              type="text"
              placeholder="Case Number"
              maxlength="50"
              class="filter-input"
              @keyup.enter="applyFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">Case Type</label>
            <select v-model="filters.caseType" class="filter-input">
              <option value="">Click to Add</option>
              <option v-for="t in caseTypes" :key="t.case_type_id" :value="t.case_type_id">
                {{ t.code }}{{ t.description ? ' — ' + t.description : '' }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Court</label>
            <select v-model="filters.courtId" class="filter-input">
              <option value="">Please select</option>
              <option v-for="c in courts" :key="c.court_id" :value="c.court_id">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Closure Reason</label>
            <select v-model="filters.closureReason" class="filter-input">
              <option value="">Please Select</option>
              <option v-for="r in closureReasons" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>

        <!-- Column 2: status + booking -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Added By</label>
            <select v-model="filters.addedBy" class="filter-input">
              <option value="">Select</option>
              <option v-for="u in users" :key="u.user_id" :value="u.user_id">
                {{ u.full_name }} ({{ u.username }})
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Status</label>
            <select v-model="filters.statusId" class="filter-input">
              <option value="">Click to Add</option>
              <option v-for="s in statuses" :key="s.case_status_id" :value="s.case_status_id">
                {{ s.status_desc }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Court Booking</label>
            <select v-model="filters.courtBookingId" class="filter-input">
              <option value="">Select</option>
              <option v-for="b in bookings" :key="b.court_booking_id" :value="b.court_booking_id">
                {{ b.label }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Non-reconciled Notices</label>
            <input v-model="filters.nonReconciled" type="checkbox" class="filter-checkbox" />
          </div>
        </div>

        <!-- Column 3: date range + contact + misc -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Date From</label>
            <input v-model="filters.dateFrom" type="date" class="filter-input" />
          </div>
          <div class="filter-row">
            <label class="filter-label">Date Search By</label>
            <select v-model="filters.dateSearchBy" class="filter-input">
              <option value="case_dt">Offence Date</option>
              <option value="created_dt">Added Date</option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Date To</label>
            <input v-model="filters.dateTo" type="date" class="filter-input" />
          </div>
          <div class="filter-row">
            <label class="filter-label">Contact</label>
            <input
              v-model="filters.contact"
              type="text"
              placeholder="Contact Number"
              maxlength="50"
              class="filter-input"
              @keyup.enter="applyFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">Cases fully paid prior to stage 1</label>
            <input v-model="filters.fullyPaid" type="checkbox" class="filter-checkbox" />
          </div>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn-action-green" :disabled="loading" @click="applyFilter">SEARCH</button>
        <button class="btn-action-red"   :disabled="loading" @click="resetFilter">RESET</button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="loadError" class="alert alert-danger mb-md" role="alert"
         style="padding:0.75rem 1rem;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
      {{ loadError }}
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Results card — green action toolbar + paginated table.
         Action buttons are UI placeholders until their endpoints land.
         ─────────────────────────────────────────────────────────────── -->
    <div class="card card-padded">
      <div class="card-section-head">
        <strong class="ch-heading">MATCHING CASE LIST</strong>
      </div>

      <!-- Action toolbar — mirrors legacy "Actions" row above the table.
           Buttons stay fully coloured at rest (legacy parity); the click
           handler validates that at least one row is checked and alerts
           otherwise. -->
      <div class="action-toolbar">
        <span class="action-toolbar-label">Actions</span>
        <div class="action-toolbar-buttons">
          <button class="btn-action-green" @click="exportPayments">EXPORT PAYMENTS</button>
          <button class="btn-action-green" @click="exportCases">EXPORT CASES</button>
          <button class="btn-action-green" @click="zipAttachment">ZIP ATTACHMENT</button>
          <button class="btn-action-green" @click="assignCourtBookings">ASSIGN COURT BOOKINGS</button>
          <button class="btn-action-green" @click="createLetter">CREATE LETTER</button>
          <button class="btn-action-green" @click="printLabel">PRINT LABEL</button>
          <button class="btn-action-green" @click="updateStatus">UPDATE STATUS</button>
          <button class="btn-action-green" @click="enterCourtResults">ENTER COURT RESULTS</button>
        </div>
      </div>

      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model.number="perPage" class="rows-select" @change="onPageSizeChange">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
        <span class="toolbar-text">updated at {{ lastUpdated }}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-icon">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" aria-label="Select all" />
              </th>
              <th>Case Number</th>
              <th @click="toggleDateSort" class="sortable">
                Offence Date <span>{{ ordering === '-case_dt' ? '↓' : ordering === 'case_dt' ? '↑' : '' }}</span>
              </th>
              <th>Case Type</th>
              <th>Status</th>
              <th>Customer Name</th>
              <th>Age</th>
              <th>Post Code</th>
              <th>Outstanding</th>
              <th>Court</th>
              <th>Court Booking</th>
              <th>Court Result</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="13"><div class="empty-state" style="padding:1.5rem 0;color:#6b7280;">Loading…</div></td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="13">
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <p class="empty-state-title">No cases found</p>
                  <p class="empty-state-desc">Try adjusting your filters or clearing them to see all cases.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" v-else :key="row.case_id">
              <td class="col-icon">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(row.case_id)"
                  @change="toggleSelect(row.case_id)"
                  :aria-label="`Select ${row.case_num}`"
                />
              </td>
              <td>
                <span class="link-cell" @click="viewCase(row.case_id)">{{ row.case_num || '—' }}</span>
              </td>
              <td>{{ fmtDate(row.case_dt) }}</td>
              <td>{{ row.case_type_code || '—' }}</td>
              <td>
                <span :class="`badge badge-${statusColor(row.case_status_desc)}`">
                  {{ row.case_status_desc || '—' }}
                </span>
              </td>
              <td>{{ row.offender_name || '—' }}</td>
              <td>{{ row.customer_age || '—' }}</td>
              <td>{{ row.post_code || '—' }}</td>
              <td>
                <span v-if="row.outstanding > 0" class="outstanding-cell">£ {{ fmtMoney(row.outstanding) }}</span>
                <span v-else>£ 0.00</span>
              </td>
              <td>{{ row.court_name || '—' }}</td>
              <td>{{ row.court_booking || '—' }}</td>
              <td>{{ row.court_result || '—' }}</td>
              <td class="actions-cell">
                <a href="#" class="action-link" @click.prevent="viewCase(row.case_id)">View</a>
                <span class="action-sep">|</span>
                <a href="#" class="action-link" @click.prevent="editCase(row.case_id)">Edit</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="page-btn" :disabled="loading || currentPage === 1" @click="changePage(currentPage - 1)">‹ Prev</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="page-btn"
          :class="{ active: p === currentPage }"
          :disabled="loading"
          @click="changePage(p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="loading || currentPage === totalPages" @click="changePage(currentPage + 1)">Next ›</button>
        <span class="page-meta">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'
import { useCasesStore } from '@/store/cases.store.js'
import { courtsService } from '@/services/courts.service.js'

const router = useRouter()

// Cases store — owns `cases`, `total`, `listLoading`, `listError` and the
// dropdown reference data (caseTypes, statuses, issuers). The view reads
// state via storeToRefs (preserves reactivity) and calls store actions
// to fetch. Filter UI + selection state stay local to the view.
const casesStore = useCasesStore()
const {
  cases:       rows,
  total,
  listLoading: loading,
  listError:   storeError,
  caseTypes,
  statuses,
  issuers:     users,
} = storeToRefs(casesStore)

// View opens the case in read-only mode (the default). Edit appends
// `?mode=edit` so the Case Detail view can unlock the EDIT controls.
// Clicking the case number itself is a View action — anywhere in the
// system that opens a case from a link defaults to view-only, by design.
function viewCase(caseId) {
  router.push({ name: 'case-details', params: { caseid: caseId } })
}
function editCase(caseId) {
  router.push({
    name: 'case-details',
    params: { caseid: caseId },
    query: { mode: 'edit' },
  })
}

// ── Filter state ──────────────────────────────────────────────────────────────
// `filters` is what the inputs bind to; `applied` is what was last submitted
// to the server. Keeping them separate stops every keystroke from refetching.
const emptyFilters = () => ({
  caseNo:         '',
  caseType:       '',
  courtId:        '',
  closureReason:  '',
  addedBy:        '',
  statusId:       '',
  courtBookingId: '',
  nonReconciled:  false,
  dateFrom:       defaultDateFrom(),
  dateSearchBy:   'case_dt',
  dateTo:         defaultDateTo(),
  contact:        '',
  fullyPaid:      false,
})
const filters = reactive(emptyFilters())
const applied = reactive(emptyFilters())

// Default the visible date range to "last 90 days" so the screen lands on
// a useful slice instead of every case ever issued.
function defaultDateFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().slice(0, 10)
}
function defaultDateTo() {
  return new Date().toISOString().slice(0, 10)
}

const perPage     = ref(50)
const currentPage = ref(1)
const ordering    = ref('-case_dt')
const lastUpdated = ref(currentTime())

// Local error mirror — `storeError` (from the store) is the source of
// truth; `loadError` exposes the same value to the template + lets the
// view clear it locally without mutating store state.
const loadError = computed(() => storeError.value ?? '')

// Lookup dropdowns NOT yet owned by a store — courts + bookings will move
// to courts.store.js in the next pass.
const courts         = ref([])
const bookings       = ref([])
// Closure reasons aren't yet exposed via a list endpoint; the legacy DB
// stores them as free text. Surface a small static list until the backend
// adds /revp/cases/closure-reasons/.
const closureReasons = ref([])

// Selection state for the action toolbar — every action button operates on
// the checked rows. The buttons stay enabled regardless; click handlers
// validate that at least one row is selected.
const selectedIds = ref(new Set())
const allSelected = computed(() =>
  rows.value.length > 0 && rows.value.every(r => selectedIds.value.has(r.case_id))
)

function toggleSelect(id) {
  // Re-assigning a fresh Set so Vue reactivity picks up the change.
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(rows.value.map(r => r.case_id))
  }
}

// ── Pagination helpers ────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
const rangeStart = computed(() => total.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(currentPage.value * perPage.value, total.value))
const pageNumbers = computed(() => {
  const out = []
  const cur = currentPage.value
  const last = totalPages.value
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= cur - 1 && i <= cur + 1)) out.push(i)
  }
  return out
})

// ── Fetchers ──────────────────────────────────────────────────────────────────
// The store owns the request itself (loading flags, error capture, state
// updates). The view's job is to pass the current filter/page snapshot
// and stamp lastUpdated when the call returns.
// Shift a YYYY-MM-DD string forward by one day so the backend's __lte
// comparison on a DateTimeField includes the full selected day, not just
// up to midnight. e.g. user picks '2026-06-05' → we send '2026-06-06'.
function shiftDateToEndOfDay(dateStr) {
  if (!dateStr) return dateStr
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function loadRows() {
  await casesStore.fetchCases({
    page:           currentPage.value,
    pageSize:       perPage.value,
    search:         applied.caseNo,
    offenderName:   '',
    status:         applied.statusId,
    caseType:       applied.caseType,
    courtId:        applied.courtId,
    courtBookingId: applied.courtBookingId,
    closureReason:  applied.closureReason,
    addedBy:        applied.addedBy,
    contact:        applied.contact,
    dateFrom:       applied.dateFrom,
    dateTo:         shiftDateToEndOfDay(applied.dateTo),
    dateSearchBy:   applied.dateSearchBy,
    ordering:       ordering.value,
  })
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  lastUpdated.value = currentTime()
}

async function loadDropdowns() {
  // Case-related lookups (types / statuses / issuers) come from the cases
  // store in one parallel batch. Courts + bookings still come from the
  // courts service directly until courts.store.js lands.
  const [, courtsResult, bookingsResult] = await Promise.allSettled([
    casesStore.fetchReferenceData(),
    courtsService.getAll(),
    courtsService.listBookings(),
  ])
  if (courtsResult.status === 'fulfilled') {
    const data = courtsResult.value
    courts.value = (data?.results ?? data ?? []).filter(c => c.active)
  }
  if (bookingsResult.status === 'fulfilled') {
    const data = bookingsResult.value
    const list = data?.results ?? data ?? []
    bookings.value = list.map(b => ({
      court_booking_id: b.court_booking_id,
      label: [b.court_name, b.start_dt ? fmtDateTime(b.start_dt) : '']
        .filter(Boolean).join(' — '),
    }))
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
function applyFilter() {
  Object.assign(applied, {
    ...filters,
    caseNo:  sanitizeString(filters.caseNo),
    contact: sanitizeString(filters.contact),
  })
  currentPage.value = 1
  selectedIds.value = new Set()
  loadRows()
}
function resetFilter() {
  const fresh = emptyFilters()
  Object.assign(filters, fresh)
  Object.assign(applied, fresh)
  currentPage.value = 1
  selectedIds.value = new Set()
  loadRows()
}
function changePage(p) {
  if (p < 1 || p > totalPages.value || p === currentPage.value) return
  currentPage.value = p
  loadRows()
}
function onPageSizeChange() {
  currentPage.value = 1
  loadRows()
}
function toggleDateSort() {
  ordering.value = ordering.value === '-case_dt' ? 'case_dt' : '-case_dt'
  loadRows()
}

// Action-toolbar handlers — placeholders until their endpoints land. Each
// is wired to operate on the checked rows so the surface area is right.
function exportPayments()      { alert(`Export payments for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function exportCases()         { alert(`Export cases for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function zipAttachment()       { alert(`Zip attachments for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function assignCourtBookings() { alert(`Assign court bookings for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function createLetter()        { alert(`Create letter for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function printLabel()          { alert(`Print labels for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function updateStatus()        { alert(`Bulk update status for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }
function enterCourtResults()   { alert(`Enter court results for ${selectedIds.value.size} case(s) — endpoint not yet implemented.`) }

// ── Display helpers ───────────────────────────────────────────────────────────
function currentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtMoney(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0.00'
  return v.toFixed(2)
}
function statusColor(desc) {
  if (!desc) return 'neutral'
  const map = {
    'open': 'info',
    'closed': 'success',
    'court queue': 'warning',
    'court booked': 'info',
    'under appeal': 'danger',
    'under investigation': 'purple',
  }
  return map[desc.toLowerCase()] ?? 'neutral'
}

onMounted(() => {
  // Seed `applied` with the initial filter defaults so the first load
  // honours the default date range.
  Object.assign(applied, emptyFilters())
  loadDropdowns()
  loadRows()
})
</script>

<style scoped>
.case-list-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 32px;
  padding: 12px 4px;
}
.filter-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 12px;
}
.filter-label {
  font-size: 12px;
  color: #4b5563;
}
.filter-input {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  width: 100%;
  background: #fff;
}
.filter-checkbox {
  justify-self: start;
}
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.action-toolbar {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px 12px;
  margin: 8px 0 12px;
}
.action-toolbar-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
}
.action-toolbar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Solid teal action buttons — legacy parity. Styles are duplicated from
   CaseDetailsView's scoped block because <style scoped> does not leak
   across components. */
.btn-action-green {
  padding: 7px 14px;
  background: #15a982;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background var(--transition);
}
.btn-action-green:hover { background: #128968; }
.btn-action-red {
  padding: 7px 14px;
  background: #fee2e2;
  color: var(--danger);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-action-red:hover { background: var(--danger); color: #fff; }

/* Toolbar row above the table: "10 / records per page" left, timestamp right. */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select {
  width: auto;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
}
.toolbar-text { font-size: 12px; color: var(--text-muted); }

/* The global stylesheet uppercases every `thead th`; the legacy case list
   uses normal Title Case for column labels, so undo it just for this
   table. `:deep()` is required because <style scoped> hashes selectors
   and the rule wouldn't otherwise reach descendants. */
:deep(thead th) {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}

.actions-cell {
  white-space: nowrap;
}
.action-link {
  color: #047857;
  font-weight: 600;
  text-decoration: none;
  font-size: 12px;
}
.action-link:hover { text-decoration: underline; }
.action-sep {
  color: #9ca3af;
  margin: 0 6px;
}
.outstanding-cell {
  display: inline-block;
  padding: 2px 8px;
  background: #ef4444;
  color: #fff;
  border-radius: 3px;
  font-weight: 600;
  font-size: 11px;
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--text-strong); }
</style>
