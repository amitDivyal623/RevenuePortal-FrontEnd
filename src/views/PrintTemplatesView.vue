<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Print Templates</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Print Templates</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select v-model="filterCaseType">
            <option value="">All</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterCaseType='';page=1">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Print Templates ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Print Template</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Case Option</th><th>Title</th><th>Contents (preview)</th><th>Active</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="5"><div class="empty-state"><div class="empty-state-icon">🖨️</div><p class="empty-state-title">No print templates found</p></div></td></tr>
            <tr v-for="row in filtered" :key="row.print_template_id">
              <td><span class="badge badge-primary">{{ caseTypeLabel(row.case_type_id) }}</span></td>
              <td><strong>{{ row.title }}</strong></td>
              <td class="text-muted" style="max-width:360px">{{ row.contents.slice(0, 100) }}{{ row.contents.length>100?'…':'' }}</td>
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

    <AdminModal v-if="modalOpen" :title="modalTitle" size="lg" :mode="modalMode" @close="closeModal" @save="saveTpl">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Title <span class="req">*</span></label>
          <input v-model.trim="form.title" :disabled="modalMode==='view'" placeholder="Template title" maxlength="120" />
          <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Case Type <span class="req">*</span></label>
          <select v-model="form.case_type_id" :disabled="modalMode==='view'">
            <option value="">Please Select</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
          <span v-if="errors.case_type_id" class="form-error">{{ errors.case_type_id }}</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Contents <span class="req">*</span></label>
        <textarea v-model="form.contents" :disabled="modalMode==='view'" rows="10" placeholder="Print template contents. Use {variable} placeholders." style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
        <span v-if="errors.contents" class="form-error">{{ errors.contents }}</span>
      </div>
      <div class="form-group inline-row">
        <label class="form-label">Active</label>
        <label class="toggle"><input type="checkbox" v-model="form.active" :true-value="1" :false-value="0" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete print template" :detail="deleteTarget?.title" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { usePrintTemplatesStore } from '@/store/print-templates.store.js'

const store = usePrintTemplatesStore()
onMounted(() => store.init())

const rows = computed(() => store.templates)
const caseTypes = computed(() => store.caseTypes)
const filterCaseType = ref('')
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ print_template_id:'', title:'', contents:'', case_type_id:'', active:1 })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Print Template':modalMode.value==='edit'?'Edit Print Template':'View Print Template')
const filtered = computed(() => rows.value.filter(r => !filterCaseType.value || r.case_type_id === filterCaseType.value))

function caseTypeLabel(id){ return caseTypes.value.find(c=>c.case_type_id===id)?.case_option ?? id }
function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
async function confirmDelete(){ const id=deleteTarget.value?.print_template_id; if(!id) return; await store.removeTemplate(id); deleteOpen.value=false; deleteTarget.value=null }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.title) { errors.title='Please enter title'; ok=false }
  if(!form.case_type_id) { errors.case_type_id='Please select case type'; ok=false }
  if(!form.contents) { errors.contents='Please enter contents'; ok=false }
  return ok
}
async function saveTpl(){
  if(!validate()) return
  if(modalMode.value==='add') await store.createTemplate({ title:form.title, contents:form.contents, case_type_id:form.case_type_id, active:form.active })
  else await store.updateTemplate(form.print_template_id, { title:form.title, contents:form.contents, case_type_id:form.case_type_id, active:form.active })
  closeModal()
}
</script>
