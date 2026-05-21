<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Letter Templates</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Letter Templates</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Letter Template Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select v-model="filterCaseType">
            <option value="">All</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Added By</label>
          <select v-model="filterAddedBy">
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
        <div class="card-title" style="margin-bottom:0">Letter Templates ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Letter Template</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Description</th><th>Filename</th><th style="text-align:right">Size</th>
            <th>Case Type</th><th style="text-align:right">Admin Cost</th>
            <th style="text-align:right">PCN NTO</th><th style="text-align:right">PCN CC</th>
            <th>Created</th><th>By</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="11"><div class="empty-state"><div class="empty-state-icon">📄</div><p class="empty-state-title">No letter templates found</p></div></td></tr>
            <tr v-for="row in paged" :key="row.letter_template_id">
              <td><strong>{{ row.title }}</strong></td>
              <td class="text-muted">{{ row.description }}</td>
              <td><span class="badge badge-info">📎 {{ row.filename }}</span></td>
              <td style="text-align:right">{{ formatBytes(row.filesize) }}</td>
              <td><span v-for="ctId in row.case_type_ids" :key="ctId" class="badge badge-primary" style="margin-right:4px">{{ caseTypeLabel(ctId) }}</span></td>
              <td style="text-align:right">£{{ row.admincost }}</td>
              <td style="text-align:right">£{{ row.pcnNoticeToOwner }}</td>
              <td style="text-align:right">£{{ row.pcnChargeCertificate }}</td>
              <td class="text-muted">{{ formatDate(row.CreatedDT) }}</td>
              <td>{{ row.enteredbyname }}</td>
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

    <AdminModal v-if="modalOpen" :title="modalTitle" size="lg" :mode="modalMode" @close="closeModal" @save="saveTpl">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Title <span class="req">*</span></label>
          <input v-model.trim="form.title" :disabled="modalMode==='view'" maxlength="120" />
          <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Description <span class="req">*</span></label>
          <input v-model.trim="form.description" :disabled="modalMode==='view'" maxlength="200" />
          <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
        </div>
      </div>

      <div class="grid-3">
        <div class="form-group">
          <label class="form-label">Admin Cost</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.admincost" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.admincost = norm(form.admincost)" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">PCN Notice To Owner</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.pcnNoticeToOwner" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.pcnNoticeToOwner = norm(form.pcnNoticeToOwner)" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">PCN Charge Certificate</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.pcnChargeCertificate" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.pcnChargeCertificate = norm(form.pcnChargeCertificate)" /></div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Case Type <span class="req">*</span></label>
        <div class="checkbox-list">
          <label v-for="ct in caseTypes" :key="ct.case_type_id" class="checkbox-row">
            <input type="checkbox" :value="ct.case_type_id" v-model="form.case_type_ids" :disabled="modalMode==='view'" />
            <span>{{ ct.case_option }}</span>
          </label>
        </div>
        <span v-if="errors.case_type_ids" class="form-error">{{ errors.case_type_ids }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">File <span v-if="modalMode==='add'" class="req">*</span></label>
        <input v-if="modalMode!=='view'" type="file" @change="onFile" accept=".pdf,.docx" />
        <p v-if="form.filename" class="text-muted" style="font-size:12px">Current: <strong>{{ form.filename }}</strong> ({{ formatBytes(form.filesize) }})</p>
        <span v-if="errors.filename" class="form-error">{{ errors.filename }}</span>
      </div>

      <div class="form-group inline-row">
        <label class="form-label">Disabled</label>
        <label class="toggle"><input type="checkbox" v-model="form.disabledFlag" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete letter template" :detail="deleteTarget?.title" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { letterTemplates as seed, caseTypes, tocUsers } from '@/mock/letterTemplatesData.js'

const rows = reactive([...seed])
const filterCaseType = ref('')
const filterAddedBy = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const page = ref(1)
const perPage = ref(10)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ letter_template_id:'', title:'', description:'', filename:'', filelocation:'', filesize:0, admincost:'0.00', pcnNoticeToOwner:'0.00', pcnChargeCertificate:'0.00', case_type_ids:[], disabledFlag:false, CreatedDT:'', CreatedBy:'', enteredbyname:'' })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Letter Template':modalMode.value==='edit'?'Edit Letter Template':'View Letter Template')
const filtered = computed(() => rows.filter(r =>
  (!filterCaseType.value || r.case_type_ids.includes(filterCaseType.value)) &&
  (!filterAddedBy.value || r.CreatedBy === filterAddedBy.value) &&
  (!filterFrom.value || new Date(r.CreatedDT) >= new Date(filterFrom.value)) &&
  (!filterTo.value || new Date(r.CreatedDT) <= new Date(filterTo.value + 'T23:59:59'))
))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paged = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function caseTypeLabel(id){ return caseTypes.find(c=>c.case_type_id===id)?.case_option ?? id }
function formatBytes(b){ if(!b) return '—'; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB' }
function formatDate(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}) }
function norm(v){ v=String(v??'').trim(); if(!v) return '0.00'; if(v.indexOf('.')===-1) return v+'.00'; const [w,f]=v.split('.'); if(f.length===1) return `${w}.${f}0`; if(f.length>2) return parseFloat(v).toFixed(2); return v }
function clearFilters(){ filterCaseType.value=''; filterAddedBy.value=''; filterFrom.value=''; filterTo.value=''; page.value=1 }
function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r, case_type_ids:[...r.case_type_ids], disabledFlag: r.active===0 }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
function confirmDelete(){ const t=rows.find(x=>x.letter_template_id===deleteTarget.value?.letter_template_id); if(t) t.active=0; deleteOpen.value=false }
function uuid(){ return 'LT-'+(crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).slice(0,8) }
function onFile(e){ const f=e.target.files?.[0]; if(f){ form.filename=f.name; form.filesize=f.size; form.filelocation='s3://templates/'+f.name } }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.title) { errors.title='Please enter title'; ok=false }
  if(!form.description) { errors.description='Please enter description'; ok=false }
  if(form.case_type_ids.length===0) { errors.case_type_ids='Please select at least one case type'; ok=false }
  if(modalMode.value==='add' && !form.filename) { errors.filename='Please upload a file'; ok=false }
  return ok
}
function saveTpl(){
  if(!validate()) return
  if(modalMode.value==='add'){
    rows.push({ letter_template_id:uuid(), title:form.title, description:form.description, filename:form.filename, filelocation:form.filelocation, filesize:form.filesize, admincost:form.admincost, pcnNoticeToOwner:form.pcnNoticeToOwner, pcnChargeCertificate:form.pcnChargeCertificate, active:form.disabledFlag?0:1, case_type_ids:[...form.case_type_ids], CreatedDT:new Date().toISOString(), CreatedBy:'USR-001', enteredbyname:'a.ansari' })
  } else {
    const r=rows.find(x=>x.letter_template_id===form.letter_template_id)
    if(r) Object.assign(r, { title:form.title, description:form.description, filename:form.filename||r.filename, filesize:form.filesize||r.filesize, filelocation:form.filelocation||r.filelocation, admincost:form.admincost, pcnNoticeToOwner:form.pcnNoticeToOwner, pcnChargeCertificate:form.pcnChargeCertificate, case_type_ids:[...form.case_type_ids], active:form.disabledFlag?0:1 })
  }
  closeModal()
}
</script>

<style scoped>
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.checkbox-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); background: #fff; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
@media (max-width: 720px) { .grid-3 { grid-template-columns: 1fr; } }
</style>
