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
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Entered By</label>
          <input v-model.trim="filterUser" placeholder="User ID" />
        </div>
        <div class="form-group">
          <label class="form-label">Date From</label>
          <input type="date" v-model="filterFrom" />
        </div>
        <div class="form-group">
          <label class="form-label">Date To</label>
          <input type="date" v-model="filterTo" />
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="doSearch">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Address Searches <span v-if="!loading">({{ total }})</span>
        </div>
        <span class="text-sm text-light">Read-only audit log</span>
      </div>

      <div v-if="loading" style="padding:24px;text-align:center">Loading…</div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Search Type</th>
              <th>Created Date/Time</th>
              <th>Username</th>
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

      <div v-if="totalPages > 1" class="pagination">
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

const PAGE_SIZE = 25

const rows    = ref([])
const total   = ref(0)
const loading = ref(false)
const page    = ref(1)

const filterUser = ref('')
const filterFrom = ref('')
const filterTo   = ref('')

async function fetchLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, page_size: PAGE_SIZE })
    if (filterUser.value) params.append('entered_by', filterUser.value)
    if (filterFrom.value) params.append('date_from',  filterFrom.value)
    if (filterTo.value)   params.append('date_to',    filterTo.value)

    const data  = await apiGet(`/revp/audit/address-search-log/?${params}`)
    rows.value  = data.data          ?? []
    total.value = data.recordsTotal  ?? 0
  } catch (err) {
    await swal.error(err?.data?.detail ?? 'Failed to load address search log.')
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

function doSearch()     { page.value = 1; fetchLogs() }
function changePage(n)  { page.value = n; fetchLogs() }
function clearFilters() { filterUser.value = ''; filterFrom.value = ''; filterTo.value = ''; page.value = 1; fetchLogs() }

function formatDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

onMounted(fetchLogs)
</script>
