<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Offences</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Offences</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Offence Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Name (Description)</label>
          <input v-model.trim="filterName" type="text" placeholder="Search by description" />
        </div>
        <div class="form-group">
          <label class="form-label">CJS Code</label>
          <input v-model.trim="filterCode" type="text" placeholder="Search by CJS code" />
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="applyFilters">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Matching Offences ({{ filtered.length }})</div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ filtered.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option><option :value="25">25</option><option :value="50">50</option>
          </select>
          <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Offence</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('cjs_code')" class="sortable">CJS Code {{ sortIcon('cjs_code') }}</th>
              <th @click="sort('description')" class="sortable">Description {{ sortIcon('description') }}</th>
              <th>Charge</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length===0"><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⚖️</div><p class="empty-state-title">No offences found</p></div></td></tr>
            <tr v-for="row in paged" :key="row.offence_id">
              <td><span class="badge badge-primary">{{ row.cjs_code }}</span></td>
              <td>{{ row.description }}</td>
              <td>{{ row.charge }}</td>
              <td><span :class="`badge badge-${row.active ? 'success' : 'neutral'}`">{{ row.active ? 'Active' : 'Disabled' }}</span></td>
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
        <span class="page-meta">{{ filtered.length }} total</span>
      </div>
    </div>

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveOffence">
      <div class="form-group">
        <label class="form-label">CJS Code <span class="req">*</span></label>
        <input v-model.trim="form.cjs_code" placeholder="CJS Code" maxlength="10" @input="touched.cjs_code = true" />
        <span v-if="errors.cjs_code" class="form-error">{{ errors.cjs_code }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Description <span class="req">*</span></label>
        <input v-model.trim="form.description" placeholder="Offence description" maxlength="200" @input="touched.description = true" />
        <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Default Charge <span class="req">*</span></label>
        <select v-model="form.charge" @change="touched.charge = true">
          <option value="">Please Select</option>
          <option v-for="ct in chargeTypes" :key="ct" :value="ct">{{ ct }}</option>
        </select>
        <span v-if="errors.charge" class="form-error">{{ errors.charge }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Offence Statement <span class="req">*</span></label>
        <textarea v-model.trim="form.offence_statement" rows="4" placeholder="Offence statement" @input="touched.offence_statement = true"></textarea>
        <span v-if="errors.offence_statement" class="form-error">{{ errors.offence_statement }}</span>
      </div>
      <div class="form-group inline-row" v-if="modalMode === 'edit'">
        <label class="form-label">Disabled</label>
        <label class="toggle"><input type="checkbox" v-model="form.disabledFlag" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watchEffect } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { useOffencesStore } from '@/store/offences.store.js'
import { swal } from '@/utils/swal.js'

const store = useOffencesStore()
onMounted(() => store.init())

const rows = computed(() => store.offences)
const chargeTypes = computed(() => store.chargeTypes)

// Filter inputs — not applied until Search is clicked
const filterName = ref('')
const filterCode = ref('')
const appliedName = ref('')
const appliedCode = ref('')

const page = ref(1)
const perPage = ref(10)
const sortKey = ref('cjs_code')
const sortDir = ref('asc')
const modalOpen = ref(false)
const modalMode = ref('add')

const blank = () => ({ offence_id: '', cjs_code: '', description: '', charge: '', offence_statement: '', disabledFlag: false })
const form = reactive(blank())
const errors = reactive({})
const touched = reactive({})

// Real-time validation — fires synchronously on every form/touched change
watchEffect(() => {
  if (touched.cjs_code) {
    if (!form.cjs_code || !/\S/.test(form.cjs_code)) errors.cjs_code = 'Please enter CJS Code'
    else delete errors.cjs_code
  } else delete errors.cjs_code

  if (touched.description) {
    if (!form.description || !/\S/.test(form.description)) errors.description = 'Please enter Description'
    else if (rows.value.find(r => r.description?.toLowerCase() === form.description.toLowerCase() && r.offence_id !== form.offence_id))
      errors.description = 'Description already exists'
    else delete errors.description
  } else delete errors.description

  if (touched.charge) {
    if (!form.charge) errors.charge = 'Please select a charge'
    else delete errors.charge
  } else delete errors.charge

  if (touched.offence_statement) {
    if (!form.offence_statement || !/\S/.test(form.offence_statement)) errors.offence_statement = 'Please enter Offence Statement'
    else delete errors.offence_statement
  } else delete errors.offence_statement
}, { flush: 'sync' })

const modalTitle = computed(() => modalMode.value === 'add' ? 'Add Offence' : 'Edit Offence')

const filtered = computed(() => rows.value.filter(r =>
  (!appliedName.value || (r.description ?? '').toLowerCase().includes(appliedName.value.toLowerCase())) &&
  (!appliedCode.value || (r.cjs_code ?? '').toLowerCase().includes(appliedCode.value.toLowerCase()))
))
const sorted = computed(() => {
  const m = sortDir.value === 'asc' ? 1 : -1
  return [...filtered.value].sort((a, b) => String(a[sortKey.value] ?? '').localeCompare(String(b[sortKey.value] ?? '')) * m)
})
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)))
const paged = computed(() => sorted.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function sort(k) {
  if (sortKey.value === k) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = k; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function applyFilters() { appliedName.value = filterName.value; appliedCode.value = filterCode.value; page.value = 1 }
function clearFilters() { filterName.value = ''; filterCode.value = ''; appliedName.value = ''; appliedCode.value = ''; page.value = 1 }

function reset() {
  Object.assign(form, blank())
  Object.keys(touched).forEach(k => delete touched[k])
  Object.keys(errors).forEach(k => delete errors[k])
}

function openAdd() { reset(); modalMode.value = 'add'; modalOpen.value = true }

function load(r) {
  Object.assign(form, blank(), {
    offence_id: r.offence_id,
    cjs_code: r.cjs_code ?? '',
    description: r.description ?? '',
    charge: r.charge ?? '',
    offence_statement: r.offence_statement ?? '',
    disabledFlag: r.active === false,
  })
}

async function openEdit(row) {
  reset()
  const detail = await store.fetchOffence(row.offence_id)
  load(detail)
  modalMode.value = 'edit'
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false; reset() }

function validate() {
  touched.cjs_code = true
  touched.description = true
  touched.charge = true
  touched.offence_statement = true
  return !errors.cjs_code && !errors.description && !errors.charge && !errors.offence_statement
}

async function saveOffence() {
  if (!validate()) return
  const payload = {
    cjs_code: form.cjs_code,
    description: form.description,
    charge: form.charge,
    offence_statement: form.offence_statement,
  }
  const isAdd = modalMode.value === 'add'
  if (isAdd) {
    await store.createOffence({ ...payload, active: true })
  } else {
    await store.updateOffence(form.offence_id, { ...payload, active: !form.disabledFlag })
  }
  closeModal()
  await swal.success(isAdd ? 'Offence created successfully' : 'Offence updated successfully')
}
</script>

<style scoped>
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #f5f5f5; }
</style>
