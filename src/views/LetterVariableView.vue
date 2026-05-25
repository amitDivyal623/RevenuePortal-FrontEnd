<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Letter Variable Lookup</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Letter Variable Lookup</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Variable Name</label>
          <input v-model.trim="filterName" type="text" placeholder="Search by variable name" />
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="filterName='';page=1">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Letter Variables ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Variable</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Variable Name</th><th>Data Type</th><th>Value</th><th>Style</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🔣</div><p class="empty-state-title">No variables found</p></div></td></tr>
            <tr v-for="row in filtered" :key="row.variableID">
              <td><strong>{{ row.variableName }}</strong></td>
              <td><span class="badge badge-info">{{ row.variable_data_types }}</span></td>
              <td><code style="background:var(--bg-page);padding:2px 6px;border-radius:3px;font-size:11px">{{ row.value }}</code></td>
              <td class="text-muted">{{ row.style_values }}</td>
              <td><span :class="`badge badge-${row.bActive===1?'success':'neutral'}`">{{ row.bActive===1?'Active':'Disabled' }}</span></td>
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

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveVar">
      <div class="form-group">
        <label class="form-label">Variable Name <span class="req">*</span></label>
        <input v-model.trim="form.variableName" :disabled="modalMode==='view'" placeholder="e.g. OffenderName" maxlength="50" />
        <span v-if="errors.variableName" class="form-error">{{ errors.variableName }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Variable Type <span class="req">*</span></label>
        <select v-model="form.variable_data_types" :disabled="modalMode==='view'" @change="form.style_values=''">
          <option value="">Please Select</option>
          <option v-for="d in dataTypes" :key="d" :value="d">{{ d }}</option>
        </select>
        <span v-if="errors.variable_data_types" class="form-error">{{ errors.variable_data_types }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Value <span class="req">*</span></label>
        <input v-model.trim="form.value" :disabled="modalMode==='view'" placeholder="e.g. {customer.full_name}" />
        <span v-if="errors.value" class="form-error">{{ errors.value }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Variable Format</label>
        <select v-model="form.style_values" :disabled="modalMode==='view' || !form.variable_data_types">
          <option value="">Please Select</option>
          <option v-for="s in (styleOptions[form.variable_data_types] ?? [])" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="form-group inline-row" v-if="modalMode!=='add'">
        <label class="form-label">Active</label>
        <label class="toggle"><input type="checkbox" v-model="form.bActive" :true-value="1" :false-value="0" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete variable" :detail="deleteTarget?.variableName" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { useLetterVariablesStore } from '@/store/letter-variables.store.js'

const store = useLetterVariablesStore()
onMounted(() => store.init())

const rows = computed(() => store.variables)
const dataTypes = computed(() => store.dataTypes)
const styleOptions = computed(() => store.styleOptions)
const filterName = ref('')
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ variableID:'', variableName:'', variable_data_types:'', value:'', variableType:'DATABASE', applicable_styles:'', style_values:'', bActive:1 })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Variable':modalMode.value==='edit'?'Edit Variable':'View Variable')
const filtered = computed(() => rows.value.filter(r => !filterName.value || r.variableName.toLowerCase().includes(filterName.value.toLowerCase())))

function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
async function confirmDelete(){ const id=deleteTarget.value?.variableID; if(!id) return; await store.removeVariable(id); deleteOpen.value=false; deleteTarget.value=null }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.variableName) { errors.variableName='Please enter name'; ok=false }
  if(!form.variable_data_types) { errors.variable_data_types='Please select type'; ok=false }
  if(!form.value) { errors.value='Please enter value'; ok=false }
  return ok
}
async function saveVar(){
  if(!validate()) return
  form.applicable_styles = form.style_values
  if(modalMode.value==='add') await store.createVariable({ variableName:form.variableName, variable_data_types:form.variable_data_types, value:form.value, variableType:form.variableType, applicable_styles:form.style_values, style_values:form.style_values, bActive:form.bActive })
  else await store.updateVariable(form.variableID, { variableName:form.variableName, variable_data_types:form.variable_data_types, value:form.value, applicable_styles:form.style_values, style_values:form.style_values, bActive:form.bActive })
  closeModal()
}
</script>
