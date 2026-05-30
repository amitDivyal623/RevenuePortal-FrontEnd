<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Casetype Appeal Enabled</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Casetype Appeal Enabled</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">All case types ({{ rows.length }})</div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ rows.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option><option :value="25">25</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('case_option')" class="sortable">Name {{ sortIcon('case_option') }}</th>
              <th>Appeal Status</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length === 0">
              <td colspan="3"><div class="empty-state"><div class="empty-state-icon">⚖️</div><p class="empty-state-title">No case types found</p></div></td>
            </tr>
            <tr v-for="row in paged" :key="row.case_type_id">
              <td>{{ row.case_option }}</td>
              <td>
                <span :class="`badge badge-${row.enabled === 1 ? 'success' : 'neutral'}`">
                  {{ row.enabled === 1 ? 'Appeal Enabled' : 'Appeal Disabled' }}
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
        <button class="page-btn" :disabled="page===1" @click="page--">‹ Prev</button>
        <button v-for="p in totalPages" :key="p" class="page-btn" :class="{active:p===page}" @click="page=p">{{ p }}</button>
        <button class="page-btn" :disabled="page===totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ rows.length }} total</span>
      </div>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Case Type Appeal" size="md" mode="edit" @close="closeModal" @save="save">
      <div class="form-group">
        <label class="form-label">Case Type</label>
        <input :value="form.case_option" disabled />
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Appeal Disabled</label>
        <label class="toggle">
          <input type="checkbox" v-model="form.disabledFlag" />
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
const page = ref(1)
const perPage = ref(10)
const sortKey = ref('case_option')
const sortDir = ref('asc')

onMounted(async () => {
  const data = await apiGet('/revp/cases/appeal-enabled/?page_size=100')
  rows.value = data.data ?? []
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
const form = reactive({ case_type_id: '', case_option: '', disabledFlag: false })

function openEdit(row) {
  form.case_type_id = row.case_type_id
  form.case_option  = row.case_option
  form.disabledFlag = row.enabled === 0
  modalOpen.value   = true
}

function closeModal() { modalOpen.value = false }

async function save() {
  try {
    const enabled = form.disabledFlag ? 0 : 1
    const updated = await apiPut(`/revp/cases/appeal-enabled/${form.case_type_id}/`, { enabled })
    const row = rows.value.find(r => r.case_type_id === form.case_type_id)
    if (row) row.enabled = updated.enabled
    closeModal()
    await swal.success('Case type appeal setting updated successfully')
  } catch {
    await swal.error('Failed to save appeal setting. Please try again.')
  }
}
</script>

<style scoped>
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #f5f5f5; }
</style>
