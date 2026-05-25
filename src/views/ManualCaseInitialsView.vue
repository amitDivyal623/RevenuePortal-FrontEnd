<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Manual Case Initials</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Manual Case Initials</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Initials</label>
          <input v-model.trim="filterInitials" type="text" placeholder="Search by initials" />
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterInitials='';page=1">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Matching Initials ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Case Initial</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Case Initials</th><th>Case Types</th><th>Status</th><th style="text-align:right">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="4"><div class="empty-state"><div class="empty-state-icon">🔤</div><p class="empty-state-title">No initials found</p></div></td></tr>
            <tr v-for="row in filtered" :key="row.case_initials_id">
              <td><strong>{{ row.case_initials }}</strong></td>
              <td>
                <span v-for="ctId in row.case_type_ids" :key="ctId" class="badge badge-primary" style="margin-right:4px">{{ caseTypeLabel(ctId) }}</span>
              </td>
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
    </div>

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveInitial">
      <div class="form-group">
        <label class="form-label">Case Type Initial <span class="req">*</span></label>
        <input v-model.trim="form.case_initials" :disabled="modalMode==='view'" placeholder="e.g. UFN/A" maxlength="20" />
        <span v-if="errors.case_initials" class="form-error">{{ errors.case_initials }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Case Type(s) <span class="req">*</span></label>
        <div class="checkbox-list">
          <label v-for="ct in caseTypes" :key="ct.case_type_id" class="checkbox-row">
            <input type="checkbox" :value="ct.case_type_id" v-model="form.case_type_ids" :disabled="modalMode==='view'" />
            <span>{{ ct.case_option }}</span>
          </label>
        </div>
        <span v-if="errors.case_type_ids" class="form-error">{{ errors.case_type_ids }}</span>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete case initial" :detail="deleteTarget?.case_initials" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { useManualCaseInitialsStore } from '@/store/manual-case-initials.store.js'

const store = useManualCaseInitialsStore()
onMounted(() => store.init())

const rows = computed(() => store.initials)
const caseTypes = computed(() => store.caseTypes)
const filterInitials = ref('')
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ case_initials_id:'', case_initials:'', case_type_ids:[], active:1 })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Case Initial':modalMode.value==='edit'?'Edit Case Initial':'View Case Initial')
const filtered = computed(() => rows.value.filter(r => !filterInitials.value || r.case_initials.toLowerCase().includes(filterInitials.value.toLowerCase())))

function caseTypeLabel(id){ return caseTypes.value.find(c=>c.case_type_id===id)?.case_option ?? id }
function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { case_initials_id:r.case_initials_id, case_initials:r.case_initials, case_type_ids:[...r.case_type_ids], active:r.active }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
async function confirmDelete(){ const id=deleteTarget.value?.case_initials_id; if(!id) return; await store.removeInitial(id); deleteOpen.value=false; deleteTarget.value=null }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.case_initials) { errors.case_initials='Please enter Case Initial'; ok=false }
  if(form.case_type_ids.length===0) { errors.case_type_ids='Please select at least one case type'; ok=false }
  return ok
}
async function saveInitial(){
  if(!validate()) return
  if(modalMode.value==='add') await store.createInitial({ case_initials:form.case_initials, case_type_ids:[...form.case_type_ids], active:1 })
  else await store.updateInitial(form.case_initials_id, { case_initials:form.case_initials, case_type_ids:[...form.case_type_ids] })
  closeModal()
}
</script>

<style scoped>
.checkbox-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); background: #fff; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
</style>
