<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Printer App Control</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Printer App Control</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">All case types ({{ rows.length }})</div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ rows.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('description')" class="sortable">Name {{ sortIcon('description') }}</th>
              <th @click="sort('case_option')" class="sortable">Case Type Code {{ sortIcon('case_option') }}</th>
              <th>Enable</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" style="text-align:center;padding:24px">Loading…</td>
            </tr>
            <tr v-else-if="paged.length === 0">
              <td colspan="4"><div class="empty-state"><div class="empty-state-icon">🖨️</div><p class="empty-state-title">No case types found</p></div></td>
            </tr>
            <tr v-for="row in paged" :key="row.case_type_id">
              <td>{{ row.description }}</td>
              <td><span class="badge badge-primary">{{ row.case_option }}</span></td>
              <td>
                <span :class="`badge badge-${row.enabled === 1 ? 'success' : 'neutral'}`">
                  {{ row.enabled === 1 ? 'Yes' : 'No' }}
                </span>
              </td>
              <td style="text-align:right">
                <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--">‹ Prev</button>
        <button v-for="p in totalPages" :key="p" class="page-btn" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ rows.length }} total</span>
      </div>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Printer App Control" size="md" mode="edit" @close="closeModal" @save="save">
      <div class="form-group">
        <label class="form-label">Case Type</label>
        <input :value="form.caseTypeDisplay" disabled />
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Enable</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.enabledFlag" />
          <span class="toggle-track"></span>
        </label>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { apiGet, apiPut } from '@/services/api.js'
import { swal } from '@/utils/swal.js'

const rows = ref([])
const loading = ref(false)
const page = ref(1)
const perPage = ref(25)
const sortKey = ref('description')
const sortDir = ref('asc')

onMounted(async () => {
  loading.value = true
  try {
    const data = await apiGet('/revp/templates/print-app-control/?page_size=100')
    rows.value = data.data ?? []
  } catch (err) {
    await swal.error(err?.data?.detail ?? 'Failed to load printer app control data.')
  } finally {
    loading.value = false
  }
})

const sorted = computed(() => {
  const m = sortDir.value === 'asc' ? 1 : -1
  return [...rows.value].sort((a, b) =>
    String(a[sortKey.value] ?? '').localeCompare(String(b[sortKey.value] ?? '')) * m
  )
})
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)))
const paged = computed(() => sorted.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

const modalOpen = ref(false)
const form = reactive({ caseTypeId: '', caseTypeDisplay: '', enabledFlag: false })

async function openEdit(row) {
  try {
    const data = await apiGet(`/revp/templates/print-app-control/${row.case_type_id}/`)
    form.caseTypeId      = data.case_type_id ?? row.case_type_id
    form.caseTypeDisplay = data.case_option  ?? row.case_option
    form.enabledFlag     = data.appcasetype === 1
    modalOpen.value      = true
  } catch (err) {
    await swal.error(err?.data?.detail ?? 'Failed to load case type details.')
  }
}

function closeModal() { modalOpen.value = false }

async function save() {
  try {
    const enabled = form.enabledFlag ? 1 : 0
    await apiPut(`/revp/templates/print-app-control/${form.caseTypeId}/`, { enabled })
    const row = rows.value.find(r => r.case_type_id === form.caseTypeId)
    if (row) row.enabled = enabled
    closeModal()
    await swal.success('Printer app control setting saved.')
  } catch (err) {
    await swal.error(err?.data?.detail ?? 'Failed to save.')
  }
}
</script>

<style scoped>
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #f5f5f5; }
</style>
