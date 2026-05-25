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
          <select v-model="filterUser">
            <option value="">All</option>
            <option v-for="u in tocUsers" :key="u.UserID" :value="u.UserID">{{ u.Username }}</option>
          </select>
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
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Address Searches ({{ filtered.length }})</div>
        <span class="text-sm text-light">Read-only audit log</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Search Type</th><th>Created Date/Time</th><th>Username</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="3"><div class="empty-state"><div class="empty-state-icon">📜</div><p class="empty-state-title">No search log entries</p></div></td></tr>
            <tr v-for="row in paged" :key="row.id">
              <td><span class="badge badge-primary">{{ row.searchType }}</span></td>
              <td class="text-muted">{{ formatDateTime(row.CreatedDT) }}</td>
              <td><strong>{{ row.Username }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="totalPages>1">
        <button class="page-btn" :disabled="page===1" @click="page--">‹ Prev</button>
        <button v-for="p in totalPages" :key="p" class="page-btn" :class="{active:p===page}" @click="page=p">{{ p }}</button>
        <button class="page-btn" :disabled="page===totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ filtered.length }} total</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAddressLogStore } from '@/store/address-log.store.js'

const store = useAddressLogStore()
onMounted(() => store.init())

const rows = computed(() => store.logs)
const tocUsers = computed(() => store.users)
const filterUser = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const page = ref(1)
const perPage = ref(10)

const filtered = computed(() => rows.value.filter(r => {
  if (filterUser.value && r.userid !== filterUser.value) return false
  if (filterFrom.value && new Date(r.CreatedDT) < new Date(filterFrom.value)) return false
  if (filterTo.value && new Date(r.CreatedDT) > new Date(filterTo.value + 'T23:59:59')) return false
  return true
}).sort((a,b) => new Date(b.CreatedDT) - new Date(a.CreatedDT)))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paged = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function clearFilters(){ filterUser.value=''; filterFrom.value=''; filterTo.value=''; page.value=1 }
function formatDateTime(d){ if(!d) return '—'; const dt=new Date(d); return `${dt.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'})} ${dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` }
</script>
