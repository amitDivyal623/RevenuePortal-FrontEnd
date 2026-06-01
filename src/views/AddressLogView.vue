<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Address Search Log</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Address Search Log</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Address Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Entered By</label>
          <select v-model="filterUser">
            <option value="">Select</option>
            <option v-for="u in users" :key="u.user_id" :value="u.user_id">{{ u.username }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date From</label>
          <input type="date" v-model="filterFrom" :max="filterTo || today" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input type="date" v-model="filterTo" :min="filterFrom || undefined" :max="today" />
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch" :disabled="loading">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters" :disabled="loading">Clear</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Matching Address <span v-if="!loading">({{ total }})</span>
        </div>
        <div class="flex items-center gap-sm">
          <label class="form-label" style="margin:0;white-space:nowrap">Show</label>
          <select v-model="pageSize" style="width:auto" @change="doSearch">
            <option v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}</option>
          </select>
          <span class="text-sm text-light">entries</span>
        </div>
      </div>

      <div v-if="loading" style="padding:24px;text-align:center">Loading…</div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="setSort('search_type')">
                Search Type <span class="sort-icon">{{ sortIcon('search_type') }}</span>
              </th>
              <th class="sortable" @click="setSort('created_dt')">
                Entered Date / Time <span class="sort-icon">{{ sortIcon('created_dt') }}</span>
              </th>
              <th class="sortable" @click="setSort('username')">
                Entered By <span class="sort-icon">{{ sortIcon('username') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="3">
                <div class="empty-state">
                  <div class="empty-state-icon">📜</div>
                  <p class="empty-state-title">No search log entries</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.search_audit_id">
              <td><span class="badge badge-primary">{{ row.search_type }}</span></td>
              <td class="text-muted">{{ formatDateTime(row.created_dt) }}</td>
              <td><strong>{{ row.username }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1 || rows.length > 0" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="changePage(page - 1)">‹ Prev</button>
        <span class="page-btn" style="cursor:default">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="changePage(page + 1)">Next ›</button>
        <span class="page-meta">{{ total }} total</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { apiGet } from '@/services/api.js'
import { swal } from '@/utils/swal.js'

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const rows     = ref([])
const total    = ref(0)
const loading  = ref(false)
const page     = ref(1)
const pageSize = ref(25)
const ordering = ref('-created_dt')

const filterUser = ref('')
const filterFrom = ref('')
const filterTo   = ref('')

const users = ref([])

const today = computed(() => new Date().toISOString().slice(0, 10))

async function loadUsers() {
  try {
    const data = await apiGet('/auth/user-list/')
    users.value = Array.isArray(data) ? data : []
  } catch {
    // non-fatal — filter dropdown stays empty; search still works without a user filter
  }
}

async function fetchLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page:      page.value,
      page_size: pageSize.value,
      ordering:  ordering.value,
    })
    if (filterUser.value) params.append('entered_by', filterUser.value)
    if (filterFrom.value) params.append('date_from',  filterFrom.value)
    if (filterTo.value)   params.append('date_to',    filterTo.value)

    const data  = await apiGet(`/revp/audit/address-search-log/?${params}`)
    rows.value  = data.data         ?? []
    total.value = data.recordsTotal ?? 0
  } catch (err) {
    await swal.error(err?.data?.detail ?? 'Failed to load address search log.')
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function doSearch()    { page.value = 1; fetchLogs() }
function changePage(n) { page.value = n; fetchLogs() }

function clearFilters() {
  filterUser.value = ''
  filterFrom.value = ''
  filterTo.value   = ''
  ordering.value   = '-created_dt'
  page.value       = 1
  fetchLogs()
}

function setSort(col) {
  // toggle: current ASC → DESC, anything else (including unsorted) → ASC
  ordering.value = ordering.value === col ? `-${col}` : col
  page.value = 1
  fetchLogs()
}

function sortIcon(col) {
  if (ordering.value === col)        return '▲'
  if (ordering.value === `-${col}`)  return '▼'
  return '⇅'
}

function formatDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return (
    dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' / ' +
    dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
}

onMounted(() => {
  loadUsers()
  fetchLogs()
})
</script>

<style scoped>
th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
th.sortable:hover {
  background: var(--bg-hover, #f0f0f0);
}
.sort-icon {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-left: 4px;
}
</style>
