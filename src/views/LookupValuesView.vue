<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Lookup Values</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Lookup Values</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Lookup Type</label>
          <select v-model="filterType">
            <option value="">All</option>
            <option v-for="t in lookupTypes" :key="t.lookup_type_id" :value="t.lookup_type_id">{{ t.lookup_type_name }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterType='';page=1">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Lookup Values ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Lookup Value</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name (Lookup Type)</th><th>Lookup Data Value</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="4"><div class="empty-state"><div class="empty-state-icon">🗂️</div><p class="empty-state-title">No lookup values found</p></div></td></tr>
            <tr v-for="row in filtered" :key="row.lookup_data_id">
              <td><span class="badge badge-primary">{{ row.lookup_type_name }}</span></td>
              <td><strong>{{ row.lookup_data_value }}</strong></td>
              <td><span :class="`badge badge-${row.active===1?'success':'neutral'}`">{{ row.active===1?'Enabled':'Disabled' }}</span></td>
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
    </div>

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveValue">
      <div class="form-group">
        <label class="form-label">Lookup Type <span class="req">*</span></label>
        <select v-model="form.lookup_type_id" :disabled="modalMode!=='add'">
          <option value="">Please Select</option>
          <option v-for="t in lookupTypes" :key="t.lookup_type_id" :value="t.lookup_type_id">{{ t.lookup_type_name }}</option>
        </select>
        <span v-if="errors.lookup_type_id" class="form-error">{{ errors.lookup_type_id }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Lookup Value <span class="req">*</span></label>
        <input v-model.trim="form.lookup_data_value" :disabled="modalMode==='view'" placeholder="Lookup Value" maxlength="100" />
        <span v-if="errors.lookup_data_value" class="form-error">{{ errors.lookup_data_value }}</span>
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Active</label>
        <label class="toggle"><input type="checkbox" v-model="form.active" :true-value="1" :false-value="0" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete lookup value" :detail="deleteTarget?.lookup_data_value" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { lookupValues as seed, lookupTypes } from '@/mock/lookupValuesData.js'

const rows = reactive([...seed])
const filterType = ref('')
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ lookup_data_id:'', lookup_type_id:'', lookup_type_name:'', lookup_data_value:'', active:1 })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Lookup Value':modalMode.value==='edit'?'Edit Lookup Value':'View Lookup Value')
const filtered = computed(() => rows.filter(r => !filterType.value || r.lookup_type_id === filterType.value))

function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
function confirmDelete(){ const t=rows.find(x=>x.lookup_data_id===deleteTarget.value?.lookup_data_id); if(t) t.active=0; deleteOpen.value=false }
function uuid(){ return crypto?.randomUUID?.() ?? 'id-'+Math.random().toString(16).slice(2) }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.lookup_type_id) { errors.lookup_type_id='Please select type'; ok=false }
  if(!form.lookup_data_value) { errors.lookup_data_value='Please enter value'; ok=false }
  const dup = rows.find(r => r.lookup_type_id===form.lookup_type_id && r.lookup_data_value.toLowerCase()===form.lookup_data_value.toLowerCase() && r.lookup_data_id!==form.lookup_data_id)
  if(dup) { errors.lookup_data_value='Value already exists for this type'; ok=false }
  return ok
}
function saveValue(){
  if(!validate()) return
  const typeName = lookupTypes.find(t=>t.lookup_type_id===form.lookup_type_id)?.lookup_type_name ?? ''
  if(modalMode.value==='add') rows.push({ lookup_data_id:uuid(), lookup_type_id:form.lookup_type_id, lookup_type_name:typeName, lookup_data_value:form.lookup_data_value, active:form.active })
  else { const r=rows.find(x=>x.lookup_data_id===form.lookup_data_id); if(r) Object.assign(r, { lookup_data_value:form.lookup_data_value, active:form.active }) }
  closeModal()
}
</script>
