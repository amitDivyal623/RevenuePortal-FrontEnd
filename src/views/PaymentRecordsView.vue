<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Payment Records</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <span class="breadcrumb-active">Payment Records</span>
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Payment Records Filters</div>

      <!-- Row 1: Case Reference, Date From, Date To -->
      <div class="form-row mb-md">
        <div class="form-group">
          <label class="form-label">Case Reference</label>
          <input v-model="filters.caseReference" type="text" placeholder="Case Reference" />
        </div>
        <div class="form-group">
          <label class="form-label">Date From</label>
          <input v-model="filters.dateFrom" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input v-model="filters.dateTo" type="date" />
        </div>
      </div>

      <!-- Row 2: Min Value, Max Value, Result From Realex -->
      <div class="form-row mb-md">
        <div class="form-group">
          <label class="form-label">Minimum Value</label>
          <div class="input-currency">
            <span class="currency-symbol">£</span>
            <input v-model="filters.minValue" type="number" placeholder="Amount" min="0" step="0.01" class="has-currency" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Maximum Value</label>
          <div class="input-currency">
            <span class="currency-symbol">£</span>
            <input v-model="filters.maxValue" type="number" placeholder="Amount" min="0" step="0.01" class="has-currency" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Result From Realex</label>
          <select v-model="filters.resultFromRealex">
            <option value="">Select Status</option>
            <option value="00">Successful</option>
            <option value="101">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Buttons: Reset (red) left of Search (green), right-aligned -->
      <div class="filter-actions">
        <button class="btn-reset" @click="resetFilters">Reset</button>
        <button class="btn-search" @click="applyFilters">Search</button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="store.error" class="error-banner">{{ store.error }}</div>

    <!-- Results Panel -->
    <div class="card card-padded">
      <div class="card-title">Matching Payment Records</div>

      <!-- Actions box (mirrors legacy .border-box / .border-label) -->
      <div class="actions-box mb-md">
        <span class="actions-box-label">Actions</span>
        <button
          class="btn-export"
          :disabled="store.exporting || store.loading"
          @click="exportTable"
        >
          {{ store.exporting ? 'Exporting...' : 'Export Table' }}
        </button>
      </div>

      <!-- Toolbar: rows-per-page + entry range -->
      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
        <span class="text-sm text-light">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ store.total.toLocaleString() }} entries
        </span>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Date / Time</th>
              <th>Payment Amount</th>
              <th>Status Code</th>
              <th>Description</th>
              <th>Reference Number</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="store.loading">
              <tr>
                <td colspan="6" class="state-row">Loading...</td>
              </tr>
            </template>
            <template v-else-if="store.rows.length === 0">
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <p class="empty-state-title">No payment records found</p>
                    <p class="empty-state-desc">Adjust your filters and click Search.</p>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="r in store.rows" :key="r.id">
                <td class="link-cell" @click="openCase(r.case_id)">{{ r.case_num || '—' }}</td>
                <td class="text-light">{{ formatDateTime(r.date_time) }}</td>
                <td><strong>{{ r.amount || '—' }}</strong></td>
                <td>
                  <span :class="`badge badge-${statusColor(r.status_code)}`">
                    {{ r.status_code || '—' }}
                  </span>
                </td>
                <td :class="{ 'desc-failed': r.status_code !== '00' }">{{ r.result_details || '—' }}</td>
                <td>{{ r.payment_refer || '—' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Previous</button>
        <button
          v-for="p in pageNumbers" :key="p"
          class="page-btn" :class="{ active: p === currentPage }"
          @click="currentPage = p"
        >{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { usePaymentRecordsStore } from '@/store/payment-records.store.js'

const store  = usePaymentRecordsStore()
const router = useRouter()

// ── Pagination ────────────────────────────────────────────────────────────────
const perPage     = ref(25)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(store.total / perPage.value)))
const rangeStart = computed(() => store.total === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(currentPage.value * perPage.value, store.total))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) pages.push(i)
  }
  return pages.slice(0, 7)
})

// ── Filters ───────────────────────────────────────────────────────────────────
// `filters`  — live values bound to the inputs
// `applied`  — values last submitted via Search (what the table actually shows)
const EMPTY_FILTERS = {
  caseReference:    '',
  dateFrom:         '',
  dateTo:           '',
  minValue:         '',
  maxValue:         '',
  resultFromRealex: '',
}

const filters = reactive({ ...EMPTY_FILTERS })
const applied = reactive({ ...EMPTY_FILTERS })

// ── Params builders ───────────────────────────────────────────────────────────
function buildListParams() {
  const p = { page: String(currentPage.value), page_size: String(perPage.value) }
  if (applied.caseReference)    p.case_reference     = applied.caseReference
  if (applied.dateFrom)         p.date_from          = applied.dateFrom
  if (applied.dateTo)           p.date_to            = applied.dateTo
  if (applied.minValue)         p.min_value          = applied.minValue
  if (applied.maxValue)         p.max_value          = applied.maxValue
  if (applied.resultFromRealex) p.result_from_realex = applied.resultFromRealex
  return p
}

function buildExportParams() {
  // Same as list params but without page/page_size (export = all rows)
  const p = {}
  if (applied.caseReference)    p.case_reference     = applied.caseReference
  if (applied.dateFrom)         p.date_from          = applied.dateFrom
  if (applied.dateTo)           p.date_to            = applied.dateTo
  if (applied.minValue)         p.min_value          = applied.minValue
  if (applied.maxValue)         p.max_value          = applied.maxValue
  if (applied.resultFromRealex) p.result_from_realex = applied.resultFromRealex
  return p
}

// ── Data loading ──────────────────────────────────────────────────────────────
function load() {
  store.fetchList(buildListParams())
}

onMounted(load)
watch([currentPage, perPage], load)

// ── Filter actions ────────────────────────────────────────────────────────────
function applyFilters() {
  Object.assign(applied, { ...filters })
  currentPage.value = 1
  load()
}

function resetFilters() {
  Object.assign(filters,  { ...EMPTY_FILTERS })
  Object.assign(applied, { ...EMPTY_FILTERS })
  currentPage.value = 1
  load()
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportTable() {
  store.exportExcel(buildExportParams())
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(',', '')
}

function statusColor(code) {
  return code === '00' ? 'success' : code === '101' ? 'danger' : 'neutral'
}

function openCase(caseId) {
  if (!caseId) return
  const { href } = router.resolve({ name: 'case-details', params: { caseid: caseId } })
  window.open(href, '_blank')
}
</script>

<style scoped>
/* Error banner */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}

/* Filter buttons */
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.btn-search {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
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
}
.btn-reset:hover { background: #dc2626; }

/* Actions bordered box */
.actions-box {
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.actions-box-label {
  position: absolute;
  top: 0;
  left: 16px;
  transform: translateY(-50%);
  background: #fff;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.btn-export {
  padding: 8px 18px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-export:hover:not(:disabled) { background: #128968; }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select  { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }

/* £ prefix inputs */
.input-currency  { position: relative; display: flex; align-items: center; }
.currency-symbol {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  font-size: 13px;
  pointer-events: none;
  z-index: 1;
}
.has-currency { padding-left: 24px; }

/* Failed payment description highlight (status != '00') */
.desc-failed {
  background: #fee2e2;
  color: #b91c1c;
}

/* Loading / empty row */
.state-row {
  text-align: center;
  color: var(--text-light);
  padding: 32px 0;
  font-size: 13px;
}
</style>
