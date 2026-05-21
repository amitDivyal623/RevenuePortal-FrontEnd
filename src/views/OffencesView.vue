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
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
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
              <th @click="sort('CJS_Code')" class="sortable">CJS Code {{ sortIcon('CJS_Code') }}</th>
              <th @click="sort('description')" class="sortable">Description {{ sortIcon('description') }}</th>
              <th style="text-align:right">Charge</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paged.length===0"><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⚖️</div><p class="empty-state-title">No offences found</p></div></td></tr>
            <tr v-for="row in paged" :key="row.offence_id">
              <td><span class="badge badge-primary">{{ row.CJS_Code }}</span></td>
              <td>{{ row.description }}</td>
              <td style="text-align:right"><strong>£{{ row.charge }}</strong></td>
              <td><span :class="`badge badge-${row.active===1?'success':'neutral'}`">{{ row.active===1?'Active':'Disabled' }}</span></td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                  <button class="btn btn-danger btn-sm" @click="openDelete(row)">Delete</button>
                </div>
              </td>
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

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveOffence">
      <div class="form-group">
        <label class="form-label">CJS Code <span class="req">*</span></label>
        <input v-model.trim="form.CJS_Code" :disabled="modalMode==='view'" placeholder="CJS Code" maxlength="50" />
        <span v-if="errors.CJS_Code" class="form-error">{{ errors.CJS_Code }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Description <span class="req">*</span></label>
        <input v-model.trim="form.description" :disabled="modalMode==='view'" placeholder="Offence description" maxlength="200" />
        <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Charge <span class="req">*</span></label>
        <select v-model="form.charge" :disabled="modalMode==='view'">
          <option value="">Please Select</option>
          <option v-for="c in chargeOptions" :key="c" :value="c">£{{ c }}</option>
        </select>
        <span v-if="errors.charge" class="form-error">{{ errors.charge }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Offence Statement <span class="req">*</span></label>
        <textarea v-model.trim="form.offenceStatment" :disabled="modalMode==='view'" rows="4" placeholder="Offence statement"></textarea>
        <span v-if="errors.offenceStatment" class="form-error">{{ errors.offenceStatment }}</span>
      </div>
      <div class="form-group inline-row" v-if="modalMode!=='add'">
        <label class="form-label">Disabled</label>
        <label class="toggle"><input type="checkbox" v-model="form.disabledFlag" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" :title="`Delete offence`" :detail="`${deleteTarget?.CJS_Code} — ${deleteTarget?.description}`" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { offences as seed, chargeOptions } from '@/mock/offencesData.js'

const rows = reactive([...seed])
const filterName = ref('')
const filterCode = ref('')
const page = ref(1)
const perPage = ref(10)
const sortKey = ref('CJS_Code')
const sortDir = ref('asc')

const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ offence_id:'', CJS_Code:'', description:'', charge:'', offenceStatment:'', disabledFlag:false })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Offence':modalMode.value==='edit'?'Edit Offence':'View Offence')

const filtered = computed(() => rows.filter(r =>
  (!filterName.value || r.description.toLowerCase().includes(filterName.value.toLowerCase())) &&
  (!filterCode.value || r.CJS_Code.toLowerCase().includes(filterCode.value.toLowerCase()))
))
const sorted = computed(() => {
  const m = sortDir.value==='asc'?1:-1
  return [...filtered.value].sort((a,b) => String(a[sortKey.value]??'').localeCompare(String(b[sortKey.value]??''))*m)
})
const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)))
const paged = computed(() => sorted.value.slice((page.value-1)*perPage.value, page.value*perPage.value))
watch(filtered, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function sort(k){ if(sortKey.value===k) sortDir.value=sortDir.value==='asc'?'desc':'asc'; else { sortKey.value=k; sortDir.value='asc' } }
function sortIcon(k){ return sortKey.value===k ? (sortDir.value==='asc'?'↑':'↓') : '' }
function clearFilters(){ filterName.value=''; filterCode.value=''; page.value=1 }
function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { offence_id:r.offence_id, CJS_Code:r.CJS_Code, description:r.description, charge:r.charge, offenceStatment:r.offenceStatment, disabledFlag:r.active===0 }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
function confirmDelete(){ const id=deleteTarget.value?.offence_id; if(!id) return; const t=rows.find(x=>x.offence_id===id); if(t) t.active=0; deleteOpen.value=false; deleteTarget.value=null }
function uuid(){ return crypto?.randomUUID?.() ?? 'id-'+Math.random().toString(16).slice(2) }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.CJS_Code) { errors.CJS_Code='Please enter CJS Code'; ok=false }
  if(!form.description) { errors.description='Please enter Description'; ok=false }
  const dup = rows.find(r => r.description.toLowerCase()===form.description.toLowerCase() && r.offence_id!==form.offence_id)
  if(dup) { errors.description='Description already exists'; ok=false }
  if(!form.charge) { errors.charge='Please select a charge'; ok=false }
  if(!form.offenceStatment) { errors.offenceStatment='Please enter Offence Statement'; ok=false }
  return ok
}
function saveOffence(){
  if(!validate()) return
  if(modalMode.value==='add'){
    rows.push({ offence_id:uuid(), CJS_Code:form.CJS_Code, description:form.description, charge:form.charge, offenceStatment:form.offenceStatment, active:1 })
  } else if(modalMode.value==='edit'){
    const r = rows.find(x=>x.offence_id===form.offence_id)
    if(r) Object.assign(r, { CJS_Code:form.CJS_Code, description:form.description, charge:form.charge, offenceStatment:form.offenceStatment, active:form.disabledFlag?0:1 })
  }
  closeModal()
}
</script>
