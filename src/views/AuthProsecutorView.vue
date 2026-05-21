<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Authorising Prosecutor</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Authorising Prosecutor</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Prosecutors ({{ rows.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Prosecutor</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Job Title</th><th>Supplementary Info</th><th>Attachment</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="rows.length===0"><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⚖️</div><p class="empty-state-title">No prosecutors</p></div></td></tr>
            <tr v-for="row in rows" :key="row.prosecutor_id">
              <td><strong>{{ row.Name }}</strong></td>
              <td>{{ row.job_title }}</td>
              <td class="text-muted" style="max-width:320px">{{ row.supplementary_info }}</td>
              <td>
                <span v-if="row.attachment_filename" class="badge badge-info">📎 {{ row.attachment_filename }}</span>
                <span v-else class="text-light">—</span>
              </td>
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

    <AdminModal v-if="modalOpen" :title="modalTitle" size="md" :mode="modalMode" @close="closeModal" @save="saveProsecutor">
      <div class="form-group">
        <label class="form-label">Prosecutor Name <span class="req">*</span></label>
        <input v-model.trim="form.Name" :disabled="modalMode==='view'" placeholder="Prosecutor Name" maxlength="100" />
        <span v-if="errors.Name" class="form-error">{{ errors.Name }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Job Title <span class="req">*</span></label>
        <input v-model.trim="form.job_title" :disabled="modalMode==='view'" placeholder="Job Title" maxlength="100" />
        <span v-if="errors.job_title" class="form-error">{{ errors.job_title }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Supplementary Info <span class="req">*</span></label>
        <textarea v-model.trim="form.supplementary_info" :disabled="modalMode==='view'" rows="4" placeholder="Supplementary information"></textarea>
        <span v-if="errors.supplementary_info" class="form-error">{{ errors.supplementary_info }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Signature Attachment</label>
        <input v-if="modalMode!=='view'" type="file" @change="onFile" accept="image/*,application/pdf" />
        <p v-if="form.attachment_filename" class="text-muted" style="font-size:12px">Current: {{ form.attachment_filename }}</p>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete prosecutor" :detail="deleteTarget?.Name" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { prosecutors as seed } from '@/mock/prosecutorData.js'

const rows = reactive([...seed])
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({ prosecutor_id:'', Name:'', job_title:'', supplementary_info:'', attachment_id:'', attachment_filename:'' })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Prosecutor':modalMode.value==='edit'?'Edit Prosecutor':'View Prosecutor')

function reset(){ Object.assign(form, blank()); Object.keys(errors).forEach(k=>delete errors[k]) }
function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){ Object.assign(form, blank(), { ...r }) }
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
function confirmDelete(){ const idx=rows.findIndex(x=>x.prosecutor_id===deleteTarget.value?.prosecutor_id); if(idx!==-1) rows.splice(idx,1); deleteOpen.value=false }
function uuid(){ return crypto?.randomUUID?.() ?? 'id-'+Math.random().toString(16).slice(2) }
function onFile(e){ const f=e.target.files?.[0]; if(f){ form.attachment_id='ATT-'+uuid().slice(0,8); form.attachment_filename=f.name } }
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.Name) { errors.Name='Please enter name'; ok=false }
  if(!form.job_title) { errors.job_title='Please enter job title'; ok=false }
  if(!form.supplementary_info) { errors.supplementary_info='Please enter supplementary info'; ok=false }
  return ok
}
function saveProsecutor(){
  if(!validate()) return
  if(modalMode.value==='add') rows.push({ prosecutor_id:uuid(), Name:form.Name, job_title:form.job_title, supplementary_info:form.supplementary_info, attachment_id:form.attachment_id, attachment_filename:form.attachment_filename })
  else { const r=rows.find(x=>x.prosecutor_id===form.prosecutor_id); if(r) Object.assign(r, { Name:form.Name, job_title:form.job_title, supplementary_info:form.supplementary_info, attachment_id:form.attachment_id, attachment_filename:form.attachment_filename }) }
  closeModal()
}
</script>
