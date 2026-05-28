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
            <tr v-if="loading">
              <td colspan="12">
                <div class="empty-state" style="padding:1.5rem 0;color:#6b7280;">Loading…</div>
              </td>
            </tr>
            <tr v-else-if="loadError">
              <td colspan="12">
                <div class="empty-state">
                  <p class="empty-state-title" style="color:#b91c1c">Failed to load cases</p>
                  <p class="empty-state-desc">{{ loadError }}</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="pagedRows.length === 0">
              <td colspan="12">
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <p class="empty-state-title">No matching cases</p>
                  <p class="empty-state-desc">Try a different search term — case number, offender name, or VRM.</p>
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

    <!--
      Linked-cases modal — rich table layout matching the legacy
      getLinkedCasesList popup. Header shows the searched case number,
      the table lists the parent + every linked case with the same
      columns Quick Search uses (offender / age / postcode / outstanding
      / closure reason). Operator picks one via radio and clicks
      OPEN SELECTED CASE to navigate there.
    -->
    <div v-if="linkedModalOpen" class="qcs-modal-backdrop" @click.self="linkedModalOpen = false">
      <div class="qcs-modal-panel qcs-modal-wide" role="dialog" aria-modal="true" aria-labelledby="qcs-linked-title">
        <div class="qcs-modal-head">
          <h2 id="qcs-linked-title" class="qcs-modal-title">Linked Cases</h2>
          <button type="button" class="qcs-modal-close" aria-label="Close" @click="linkedModalOpen = false">×</button>
        </div>

        <!-- Searched case header -->
        <div class="qcs-searched-card">
          <div class="qcs-searched-label">SEARCHED CASE</div>
          <div class="qcs-searched-num">
            {{ linkedModalParent ? linkedModalParent.caseNum : '' }}
          </div>
        </div>

        <!-- Open Selected Case button -->
        <div class="qcs-modal-actions">
          <button
            type="button"
            class="btn-open"
            :disabled="!linkedModalSelected"
            @click="openSelectedLinkedCase"
          >OPEN SELECTED CASE</button>
        </div>

        <div class="qcs-modal-body" style="padding: 0 18px 12px;">
          <div v-if="linkedModalLoading" class="empty-state" style="padding:1.5rem 0;color:#6b7280;">Loading…</div>
          <div v-else-if="linkedModalError" class="empty-state">
            <p class="empty-state-title" style="color:#b91c1c">Failed to load linked cases</p>
            <p class="empty-state-desc">{{ linkedModalError }}</p>
          </div>
          <div v-else-if="linkedModalRows.length === 0" class="empty-state">
            <p class="empty-state-desc">No linked cases.</p>
          </div>
          <div v-else>
            <div class="toolbar" style="margin-bottom:8px;">
              <div class="flex items-center gap-sm">
                <select v-model.number="linkedModalPerPage" class="rows-select"
                        @change="linkedModalPage = 1">
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
                    <th class="col-icon"></th>
                    <th>Case Number</th>
                    <th>Offence Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Offender</th>
                    <th>Age</th>
                    <th>Post Code</th>
                    <th>Vehicle Registration</th>
                    <th>Outstanding</th>
                    <th>Closure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in linkedModalPagedRows" :key="row.case_id"
                      :class="{ 'row-selected': linkedModalSelected === row.case_id }">
                    <td class="col-icon">
                      <input type="radio" name="qcs-linked-pick"
                             :value="row.case_id" v-model="linkedModalSelected"
                             :aria-label="`Select ${row.caseNum}`" />
                    </td>
                    <td>
                      <a href="#" class="link-cell" @click.prevent="openLinkedCase(row)">
                        {{ row.caseNum }}
                      </a>
                    </td>
                    <td class="text-light">{{ row.caseDT }}</td>
                    <td><span class="badge badge-neutral">{{ row.code }}</span></td>
                    <td><span :class="statusColor(row.statusDesc)">{{ row.statusDesc }}</span></td>
                    <td>{{ row.title }} {{ row.FirstName }} {{ row.Surname }}</td>
                    <td :class="ageClass(row)">{{ row.customer_age || 0 }}</td>
                    <td>{{ row.PostCode }}</td>
                    <td>{{ row.regNum }}</td>
                    <td :class="outstandingCellClass(row)">£ {{ formatOutstanding(row) }}</td>
                    <td class="text-light">{{ row.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="pagination" v-if="linkedModalTotalPages > 1">
              <span class="page-meta">
                Showing {{ (linkedModalPage - 1) * linkedModalPerPage + 1 }}
                to {{ Math.min(linkedModalPage * linkedModalPerPage, linkedModalRows.length) }}
                of {{ linkedModalRows.length }} entries
              </span>
              <button class="page-btn" :disabled="linkedModalPage === 1"
                      @click="linkedModalPage--">‹ Previous</button>
              <button class="page-btn" :disabled="linkedModalPage === linkedModalTotalPages"
                      @click="linkedModalPage++">Next ›</button>
            </div>
          </div>
        </div>

        <div class="qcs-modal-foot">
          <button type="button" class="btn-open" @click="linkedModalOpen = false">CLOSE</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'
import { casesService } from '@/services/cases.service.js'

const router = useRouter()
function goToCase(caseid) {
  router.push({ name: 'case-details', params: { caseid } })
}

const searchTerm   = ref('')
const appliedTerm  = ref('')
const perPage      = ref(5)
const currentPage  = ref(1)
const sortKey      = ref('caseDT')
const sortDir      = ref('desc')
const selectedIds  = ref([])
const lastUpdated  = ref(currentTime())
const loading      = ref(false)
const loadError    = ref('')

// Server-driven state — populated by loadResults() from the backend.
// pagedRows is what the existing template iterates over (the field names
// map to what the columns already bind: caseNum / caseDT / code / etc.).
const pagedRows    = ref([])
const totalRecords = ref(0)

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Convert backend ISO date → DD/MM/YYYY for the existing table display.
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Map a backend quick-search row → the camelCase shape the existing
// template already uses (preserves all the existing colour rules).
function mapRow(r) {
  return {
    case_id:          r.case_id,
    caseNum:          r.case_num,
    caseDT:           fmtDate(r.case_dt),
    code:             r.case_type_code,
    statusDesc:       r.case_status_desc,
    title:            r.title,
    FirstName:        r.first_name,
    Surname:          r.surname,
    customer_age:     r.customer_age,
    PostCode:         r.post_code,
    regNum:           r.reg_num,
    amountDue:        r.amount_due  || 0,
    amountPaid:       r.amount_paid || 0,
    reason:           r.closure_reason,
    linked_case_count: r.linked_case_count || 0,
    // Array of {case_id, case_num} — drives the linked-cases modal when
    // the pill is clicked. Matches legacy linkedCaseData layout.
    linked_cases:     Array.isArray(r.linked_cases) ? r.linked_cases : [],
  }
}

async function loadResults() {
  loading.value = true
  loadError.value = ''
  try {
    const resp = await casesService.quickSearch({
      term:     appliedTerm.value,
      page:     currentPage.value,
      pageSize: perPage.value,
    })
    pagedRows.value    = (resp.results || []).map(mapRow)
    totalRecords.value = resp.total ?? pagedRows.value.length
    lastUpdated.value  = currentTime()
  } catch (err) {
    loadError.value = err?.data?.detail || err?.message || 'Failed to load cases.'
    pagedRows.value = []
    totalRecords.value = 0
  } finally {
    loading.value = false
  }
}

function refresh() { loadResults() }

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

function applySearch() {
  appliedTerm.value = sanitizeString(searchTerm.value)
  currentPage.value = 1
  selectedIds.value = []
  loadResults()
}

// Watch page / page size so the table refetches when the user changes them.
watch(currentPage, () => loadResults())
watch(perPage,    () => { currentPage.value = 1; loadResults() })

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
  // Client-side sort the visible page — server returns sorted by -case_dt
  // by default. Full server-side sort allowlist can come in a follow-up.
  const mul = sortDir.value === 'asc' ? 1 : -1
  pagedRows.value = [...pagedRows.value].sort((a, b) => {
    if (sortKey.value === 'outstanding') {
      const av = a.amountDue - a.amountPaid
      const bv = b.amountDue - b.amountPaid
      return av > bv ? mul : -mul
    }
    const av = a[sortKey.value] ?? ''
    const bv = b[sortKey.value] ?? ''
    return av > bv ? mul : -mul
  })
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
const allSelected  = computed(() => pagedRows.value.length > 0 && pagedRows.value.every(r => selectedIds.value.includes(r.case_id)))
const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value)

function openSelected() {
  // Legacy OPEN SELECTED CASE always opens the first checked row.
  if (selectedIds.value.length >= 1) {
    goToCase(selectedIds.value[0])
  }
}

// Linked-cases modal — rich table version. Opens on pill click, fetches
// /linked-detail/ which returns {parent, linked:[...]} with all the columns
// the legacy modal renders (offender / age / postcode / outstanding / etc.).
// Mirrors legacy `getLinkedCasesList` (caseaction.cfm:5454).
const linkedModalOpen     = ref(false)
const linkedModalLoading  = ref(false)
const linkedModalError    = ref('')
const linkedModalParent   = ref(null)
const linkedModalRows     = ref([])         // rendered rows: parent first, then linked
const linkedModalSelected = ref('')         // case_id of the currently checked radio
const linkedModalPerPage  = ref(50)
const linkedModalPage     = ref(1)

const linkedModalPagedRows = computed(() => {
  const start = (linkedModalPage.value - 1) * linkedModalPerPage.value
  return linkedModalRows.value.slice(start, start + linkedModalPerPage.value)
})
const linkedModalTotalPages = computed(() =>
  Math.max(1, Math.ceil(linkedModalRows.value.length / linkedModalPerPage.value)),
)

async function openLinked(row) {
  if (!row || !row.case_id) return
  if (!row.linked_case_count) return     // pill is disabled in this case anyway
  linkedModalOpen.value     = true
  linkedModalLoading.value  = true
  linkedModalError.value    = ''
  linkedModalParent.value   = null
  linkedModalRows.value     = []
  linkedModalSelected.value = ''
  linkedModalPage.value     = 1
  try {
    const data = await casesService.getLinkedDetail(row.case_id)
    // Map both parent + linked through the same shape function so the
    // table iteration is uniform. The parent flag drives the row badge.
    const mapped = []
    if (data?.parent) mapped.push({ ...mapRow(data.parent), is_parent: true })
    for (const l of (data?.linked || [])) mapped.push({ ...mapRow(l), is_parent: false })
    linkedModalRows.value   = mapped
    linkedModalParent.value = mapped[0] || null
    // Pre-select the parent so OPEN SELECTED CASE is immediately usable.
    if (mapped[0]) linkedModalSelected.value = mapped[0].case_id
  } catch (err) {
    linkedModalError.value =
      err?.data?.detail || err?.message || 'Failed to load linked cases.'
  } finally {
    linkedModalLoading.value = false
  }
}

function openSelectedLinkedCase() {
  if (!linkedModalSelected.value) return
  linkedModalOpen.value = false
  goToCase(linkedModalSelected.value)
}

function openLinkedCase(row) {
  if (!row?.case_id) return
  linkedModalOpen.value = false
  goToCase(row.case_id)
}

function outstandingValue(row) { return (row.amountDue || 0) - (row.amountPaid || 0) }
function formatOutstanding(row) { return Math.abs(outstandingValue(row)).toFixed(2) }

// Fire the initial load on mount — legacy quick-search lands on an empty
// term and shows the most recent cases for the TOC; we match that.
onMounted(loadResults)

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

/* Linked-cases modal — small, plain panel; mirrors legacy hover-box layout. */
.qcs-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 60;
}
.qcs-modal-panel {
  background: #fff;
  border-radius: 8px;
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}
/* The linked-cases modal needs a wide layout to fit the legacy column set. */
.qcs-modal-wide {
  width: 1200px;
  max-width: 95vw;
  max-height: 90vh;
}
.qcs-searched-card {
  margin: 12px 18px 0;
  padding: 14px 18px;
  background: var(--bg-hover, #f5f6fa);
  border-radius: 6px;
}
.qcs-searched-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.qcs-searched-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  margin-top: 4px;
}
.qcs-modal-actions {
  padding: 12px 18px 0;
  display: flex;
  justify-content: flex-end;
}
.qcs-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-bottom: 1px solid var(--border);
}
.qcs-modal-title { font-size: 15px; font-weight: 700; margin: 0; }
.qcs-modal-subtitle { font-size: 12px; color: var(--text-muted); font-weight: 400; margin-left: 6px; }
.qcs-modal-close {
  width: 28px; height: 28px;
  font-size: 20px; line-height: 1; color: var(--text-muted);
  background: none; border: none; cursor: pointer;
}
.qcs-modal-close:hover { color: var(--text-strong); }
.qcs-modal-body { padding: 14px 18px; overflow-y: auto; flex: 1; }
.qcs-modal-foot { padding: 10px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
.qcs-linked-list { list-style: none; margin: 0; padding: 0; }
.qcs-linked-list li { padding: 6px 0; }
.qcs-linked-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  font-size: 13px;
}
.qcs-linked-link:hover { text-decoration: underline; }
</style>
