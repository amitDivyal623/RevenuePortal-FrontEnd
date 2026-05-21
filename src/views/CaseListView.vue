<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Cases</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Cases</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Search filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case number</label>
          <input v-model="filters.caseNo" type="text" placeholder="e.g. EMR/MG11/..." maxlength="50" />
        </div>
        <div class="form-group">
          <label class="form-label">Offender name</label>
          <input v-model="filters.offender" type="text" placeholder="Enter offender name" maxlength="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="filters.status">
            <option value="">All statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Case type</label>
          <select v-model="filters.type">
            <option value="">All types</option>
            <option v-for="t in caseTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="applyFilter">Search</button>
        <button class="btn btn-secondary btn-sm" @click="resetFilter">Clear filters</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">All Cases ({{ filteredCases.length }})</div>
        <div class="flex items-center gap-sm">
          <label class="text-sm text-light">Show</label>
          <select v-model="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option><option :value="25">25</option><option :value="50">50</option>
          </select>
          <button class="btn btn-primary btn-sm">+ Add case</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-icon"><input type="checkbox" aria-label="Select all" /></th>
              <th @click="sort('caseNo')" class="sortable">Case no <span>{{ sortIcon('caseNo') }}</span></th>
              <th @click="sort('offender')" class="sortable">Offender</th>
              <th @click="sort('type')" class="sortable">Type</th>
              <th @click="sort('status')" class="sortable">Status</th>
              <th @click="sort('date')" class="sortable">Date</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedCases" :key="row.id">
              <td class="col-icon"><input type="checkbox" :aria-label="`Select ${row.caseNo}`" /></td>
              <td><span class="link-cell" @click="goToCase(row.id)">{{ row.caseNo }}</span></td>
              <td>
                <div class="cell-user">
                  <div :class="`avatar avatar-sm avatar-${row.avatarColor}`">{{ row.initials }}</div>
                  <span>{{ row.offender }}</span>
                </div>
              </td>
              <td><span class="badge badge-neutral">{{ row.type }}</span></td>
              <td><span :class="`badge badge-${statusColor(row.status)}`">{{ row.status }}</span></td>
              <td class="text-light">{{ row.date }}</td>
              <td style="text-align:right">
                <button class="icon-action" aria-label="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="pagedCases.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <p class="empty-state-title">No cases found</p>
                  <p class="empty-state-desc">Try adjusting your filters or clearing them to see all cases.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Prev</button>
        <button v-for="p in pageNumbers" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next ›</button>
        <span class="page-meta">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ filteredCases.length }}</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'

const router = useRouter()
function goToCase(caseid) {
  router.push({ name: 'case-details', params: { caseid } })
}

const statuses  = ['Open','Under investigation','Court queue','Court booked','Under appeal','Closed']
const caseTypes = ['UFN','MICS','MG11','PFN','MG','PCN','PF','FT']
const avatarColors = ['indigo','green','pink','orange','blue','purple']

const filters = reactive({ caseNo:'', offender:'', status:'', type:'' })
const appliedFilters = reactive({ ...filters })
const perPage = ref(10)
const currentPage = ref(1)
const sortKey = ref('date')
const sortDir = ref('desc')

const offenderNames = ['Miss HDFC Gautam','Mr John Smith','Miss T. Master','Mr Teddy GR','Miss Green Yeshu']
const offenderInits = ['HG','JS','TM','TG','GY']

const allCases = ref(Array.from({ length: 42 }, (_, i) => ({
  id: i + 1,
  caseNo:   `EMR/${['MG11','PFN','UFN','PCN','MICS'][i % 5]}/${String(27000 + i).padStart(6,'0')}`,
  offender: offenderNames[i % 5],
  initials: offenderInits[i % 5],
  avatarColor: avatarColors[i % avatarColors.length],
  type:     caseTypes[i % caseTypes.length],
  status:   statuses[i % statuses.length],
  date:     `2026-0${(i % 5)+1}-${String((i % 28)+1).padStart(2,'0')}`
})))

function applyFilter() {
  Object.assign(appliedFilters, {
    caseNo:   sanitizeString(filters.caseNo),
    offender: sanitizeString(filters.offender),
    status:   filters.status,
    type:     filters.type
  })
  currentPage.value = 1
}
function resetFilter() {
  Object.assign(filters, { caseNo:'', offender:'', status:'', type:'' })
  Object.assign(appliedFilters, { caseNo:'', offender:'', status:'', type:'' })
  currentPage.value = 1
}

const filteredCases = computed(() => {
  return allCases.value.filter(c => {
    if (appliedFilters.caseNo   && !c.caseNo.toLowerCase().includes(appliedFilters.caseNo.toLowerCase())) return false
    if (appliedFilters.offender && !c.offender.toLowerCase().includes(appliedFilters.offender.toLowerCase())) return false
    if (appliedFilters.status   && c.status !== appliedFilters.status) return false
    if (appliedFilters.type     && c.type   !== appliedFilters.type)   return false
    return true
  }).sort((a, b) => {
    const mul = sortDir.value === 'asc' ? 1 : -1
    return a[sortKey.value] > b[sortKey.value] ? mul : -mul
  })
})

const totalPages  = computed(() => Math.max(1, Math.ceil(filteredCases.value.length / perPage.value)))
const rangeStart  = computed(() => (currentPage.value - 1) * perPage.value + 1)
const rangeEnd    = computed(() => Math.min(currentPage.value * perPage.value, filteredCases.value.length))
const pagedCases  = computed(() => filteredCases.value.slice(rangeStart.value - 1, rangeEnd.value))
const pageNumbers = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) pages.push(i)
  }
  return pages
})

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }
function statusColor(s) {
  const map = {
    'Open':'info', 'Closed':'success', 'Court queue':'warning',
    'Court booked':'info', 'Under appeal':'danger', 'Under investigation':'purple'
  }
  return map[s] ?? 'neutral'
}
</script>

<style scoped>
.icon-action {
  width: 30px; height: 30px;
  border-radius: var(--radius-sm);
  color: var(--danger);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--transition);
}
.icon-action:hover { background: var(--danger-bg); }
</style>
