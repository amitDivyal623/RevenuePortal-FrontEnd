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
          <select v-model="filterCaseType" :disabled="store.caseTypesLoading">
            <option value="">{{ store.caseTypesLoading ? 'Loading…' : 'All' }}</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
          <p v-if="store.caseTypesError" class="form-error" style="margin-top:4px">{{ store.caseTypesError }}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Added By</label>
          <select v-model="filterAddedBy">
            <option value="">All</option>
            <option v-for="u in tocUsers" :key="u.user_id" :value="u.user_id">{{ u.username }}</option>
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
        <table class="tbl-compact">
          <colgroup>
            <col style="width:12%"><!-- Title -->
            <col style="width:11%"><!-- Description -->
            <col style="width:14%"><!-- Filename -->
            <col style="width:6%"> <!-- Size -->
            <col style="width:12%"><!-- Case Type -->
            <col style="width:6%"> <!-- Admin £ -->
            <col style="width:6%"> <!-- PCN NTO -->
            <col style="width:6%"> <!-- PCN CC -->
            <col style="width:8%"> <!-- Created -->
            <col style="width:7%"> <!-- By -->
            <col style="width:12%"><!-- Actions -->
          </colgroup>
          <thead><tr>
            <th>Title</th><th>Description</th><th>Filename</th><th style="text-align:right">Size</th>
            <th>Case Type</th><th style="text-align:right">Admin £</th>
            <th style="text-align:right">PCN NTO</th><th style="text-align:right">PCN CC</th>
            <th>Created</th><th>By</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="11"><div class="empty-state"><div class="empty-state-icon">📄</div><p class="empty-state-title">No letter templates found</p></div></td></tr>
            <tr v-for="row in paged" :key="row.letter_template_id">
              <td class="cell-clip" :title="row.title"><strong>{{ row.title }}</strong></td>
              <td class="cell-clip text-muted" :title="row.description">{{ row.description }}</td>
              <td class="cell-clip" :title="row.filename">📎 {{ row.filename }}</td>
              <td class="text-right nowrap">{{ formatBytes(row.filesize) }}</td>
              <td class="cell-clip" :title="row.case_type_ids.map(id=>caseTypeLabel(id)).join(', ')">{{ row.case_type_ids.map(id=>caseTypeLabel(id)).join(', ') }}</td>
              <td class="text-right">£{{ row.admin_cost }}</td>
              <td class="text-right">£{{ row.pcn_notice_to_owner }}</td>
              <td class="text-right">£{{ row.pcn_charge_certificate }}</td>
              <td class="text-muted nowrap">{{ formatDate(row.created_dt) }}</td>
              <td class="cell-clip" :title="row.entered_by_name">{{ row.entered_by_name }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-secondary btn-xs" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-xs" @click="openEdit(row)">Edit</button>
                  <button class="btn btn-danger btn-xs" @click="openDelete(row)">Del</button>
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
      <template v-if="saveError" #footer>
        <span class="save-error">{{ saveError }}</span>
        <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button type="button" class="btn btn-primary" @click="saveTpl">Save</button>
      </template>
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
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.admin_cost" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.admin_cost = norm(form.admin_cost)" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">PCN Notice To Owner</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.pcn_notice_to_owner" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.pcn_notice_to_owner = norm(form.pcn_notice_to_owner)" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">PCN Charge Certificate</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.pcn_charge_certificate" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.pcn_charge_certificate = norm(form.pcn_charge_certificate)" /></div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Case Type <span class="req">*</span></label>
        <div v-if="store.caseTypesLoading" class="case-type-loading">Loading case types…</div>
        <p v-else-if="store.caseTypesError" class="form-error">{{ store.caseTypesError }}</p>
        <div v-else class="checkbox-list">
          <label v-for="ct in caseTypes" :key="ct.case_type_id" class="checkbox-row">
            <input type="checkbox" :value="ct.case_type_id" v-model="form.case_type_ids" :disabled="modalMode==='view'" />
            <span>{{ ct.case_option }}</span>
          </label>
        </div>
        <span v-if="errors.case_type_ids" class="form-error">{{ errors.case_type_ids }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">File <span v-if="modalMode==='add'" class="req">*</span></label>
        <template v-if="modalMode!=='view'">
          <input ref="fileInputRef" type="file" accept=".docx" style="display:none" @change="onFile" />
          <div
            class="drop-zone"
            :class="{ 'dz-active': dragging, 'dz-filled': !!_fileObj || !!form.filename }"
            @dragover.prevent="dragging=true"
            @dragleave.prevent="dragging=false"
            @drop.prevent="onDrop"
          >
            <span class="dz-icon">{{ (_fileObj || form.filename) ? '📄' : '📁' }}</span>
            <div class="dz-text">
              <span class="dz-filename" v-if="_fileObj || form.filename">{{ _fileObj ? _fileObj.name : form.filename }}</span>
              <span class="dz-label" v-else>Drag &amp; drop a .docx file here</span>
              <span class="dz-meta">
                <template v-if="_fileObj">{{ formatBytes(_fileObj.size) }} &nbsp;·&nbsp; New file selected</template>
                <template v-else-if="form.filename">{{ formatBytes(form.filesize) }} &nbsp;·&nbsp; Click to replace</template>
                <template v-else>.docx only &nbsp;·&nbsp; max 10 MB</template>
              </span>
            </div>
            <div class="dz-actions">
              <button v-if="modalMode==='edit' && form.letter_template_id && form.filename && !_fileObj"
                type="button" class="dz-dl-btn" title="View file" @click.stop="downloadFile(form)">👁</button>
              <button type="button" class="dz-browse-btn" @click.stop="fileInputRef.click()">
                {{ (_fileObj || form.filename) ? 'Replace' : 'Browse' }}
              </button>
            </div>
          </div>
        </template>
        <div v-if="form.filename && modalMode==='view'" class="file-info-row">
          <p class="text-muted" style="font-size:12px;margin:0;word-break:break-all"><strong>{{ form.filename }}</strong> ({{ formatBytes(form.filesize) }})</p>
          <button type="button" class="btn btn-secondary btn-sm" style="align-self:flex-start;margin-top:6px" @click="downloadFile(form)">👁 View</button>
        </div>
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
import { ref, shallowRef, reactive, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { useLetterTemplatesStore } from '@/store/letter-templates.store.js'
import { swal } from '@/utils/swal.js'

const store = useLetterTemplatesStore()
onMounted(() => store.init())

const rows = computed(() => store.templates)
const caseTypes = computed(() => store.caseTypes)
const tocUsers = computed(() => store.tocUsers)
const filterCaseType = ref('')
const filterAddedBy = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const page = ref(1)
const perPage = ref(10)
const modalOpen = ref(false)
const modalMode = ref('add')
const saveError = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const _fileObj = shallowRef(null)
const fileInputRef = ref(null)
const dragging = ref(false)

const blank = () => ({
  letter_template_id: '', title: '', description: '',
  filename: '', filesize: 0,
  admin_cost: '0.00', pcn_notice_to_owner: '0.00', pcn_charge_certificate: '0.00',
  case_type_ids: [], disabledFlag: false,
  created_dt: '', created_by: '', entered_by_name: '',
})
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value==='add'?'Add Letter Template':modalMode.value==='edit'?'Edit Letter Template':'View Letter Template')
const filtered = computed(() => rows.value.filter(r =>
  (!filterCaseType.value || (r.case_type_ids || []).includes(filterCaseType.value)) &&
  (!filterAddedBy.value || r.created_by === filterAddedBy.value) &&
  (!filterFrom.value || new Date(r.created_dt) >= new Date(filterFrom.value)) &&
  (!filterTo.value || new Date(r.created_dt) <= new Date(filterTo.value + 'T23:59:59'))
))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paged = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function caseTypeLabel(id){ return caseTypes.value.find(c=>c.case_type_id===id)?.case_option ?? id }
function formatBytes(b){ if(!b) return '—'; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB' }
function formatDate(d){ if(!d) return '—'; return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}) }
function norm(v){ v=String(v??'').trim(); if(!v) return '0.00'; if(v.indexOf('.')===-1) return v+'.00'; const [w,f]=v.split('.'); if(f.length===1) return `${w}.${f}0`; if(f.length>2) return parseFloat(v).toFixed(2); return v }
function truncate(text, n=60){ if(!text) return ''; return text.length > n ? text.slice(0, n) + '…' : text }
function clearFilters(){ filterCaseType.value=''; filterAddedBy.value=''; filterFrom.value=''; filterTo.value=''; page.value=1 }
function reset(){
  Object.assign(form, blank())
  Object.keys(errors).forEach(k=>delete errors[k])
  _fileObj.value = null
  saveError.value = ''
}
watch(() => form.title, v => { if(v) delete errors.title })
watch(() => form.description, v => { if(v) delete errors.description })
watch(() => form.case_type_ids.length, n => { if(n > 0) delete errors.case_type_ids })
watch(_fileObj, v => { if(v) delete errors.filename })

function openAdd(){ reset(); modalMode.value='add'; modalOpen.value=true }
function load(r){
  Object.assign(form, blank(), {
    ...r,
    admin_cost: String(r.admin_cost ?? 0),
    pcn_notice_to_owner: String(r.pcn_notice_to_owner ?? 0),
    pcn_charge_certificate: String(r.pcn_charge_certificate ?? 0),
    case_type_ids: [...(r.case_type_ids || [])],
    disabledFlag: r.active === 0 || r.active === false,
  })
}
function openEdit(r){ reset(); load(r); modalMode.value='edit'; modalOpen.value=true }
function openView(r){ reset(); load(r); modalMode.value='view'; modalOpen.value=true }
function closeModal(){ modalOpen.value=false; reset() }
function openDelete(r){ deleteTarget.value=r; deleteOpen.value=true }
async function confirmDelete(){ const id=deleteTarget.value?.letter_template_id; if(!id) return; await store.removeTemplate(id); deleteOpen.value=false; deleteTarget.value=null }
async function downloadFile(row){ if(!row.filename) return; await store.downloadTemplate(row.letter_template_id, row.filename) }
function onFile(e){
  const f = e.target.files?.[0]
  if(f) _applyFile(f)
}
function onDrop(e){
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if(f) _applyFile(f)
}
function _applyFile(f){
  _fileObj.value = f
  form.filename = f.name
  form.filesize = f.size
}
function validate(){
  Object.keys(errors).forEach(k=>delete errors[k]); let ok=true
  if(!form.title) { errors.title='Please enter title'; ok=false }
  if(!form.description) { errors.description='Please enter description'; ok=false }
  if(form.case_type_ids.length===0) { errors.case_type_ids='Please select at least one case type'; ok=false }
  if(modalMode.value==='add' && !_fileObj.value) { errors.filename='Please upload a .docx file'; ok=false }
  return ok
}
async function saveTpl(){
  if(!validate()) return
  const fd = new FormData()
  fd.append('title', form.title)
  fd.append('description', form.description)
  fd.append('admin_cost', form.admin_cost)
  fd.append('pcn_notice_to_owner', form.pcn_notice_to_owner)
  fd.append('pcn_charge_certificate', form.pcn_charge_certificate)
  fd.append('active', form.disabledFlag ? '0' : '1')
  fd.append('case_type_ids', JSON.stringify(form.case_type_ids))
  if(_fileObj.value) fd.append('file', _fileObj.value)

  saveError.value = ''
  try {
    const isAdd = modalMode.value === 'add'
    if(isAdd){
      await store.createTemplate(fd)
    } else {
      await store.updateTemplate(form.letter_template_id, fd)
    }
    closeModal()
    await swal.success(isAdd ? 'Letter template created successfully.' : 'Letter template updated successfully.')
  } catch(err) {
    const data = err.data
    let msg = 'Save failed. Please try again.'
    if(data && typeof data === 'object') {
      const parts = Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      if(parts.length) msg = parts.join(' | ')
    } else if(err.message) {
      msg = err.message
    }
    saveError.value = msg
    console.error('[saveTpl] server error:', data ?? err.message)
  }
}
</script>

<style scoped>
.save-error { color: var(--danger, #dc2626); font-size: 13px; flex: 1; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.checkbox-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); background: #fff; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.case-type-loading { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; color: var(--text-muted); background: #fafafa; }
.tbl-compact { table-layout: fixed; width: 100%; }
.tbl-compact th { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.tbl-compact td { font-size: 13px; vertical-align: middle; }
.cell-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0; }
.text-right { text-align: right; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.action-btns { display: flex; gap: 4px; justify-content: flex-end; align-items: center; }
.file-info-row { display: flex; flex-direction: column; gap: 0; margin-top: 6px; }
.drop-zone { display: flex; flex-direction: row; align-items: center; gap: 12px; padding: 10px 14px; border: 2px dashed var(--border, #d1d5db); border-radius: var(--radius, 6px); background: #fafafa; transition: border-color 0.15s, background 0.15s; }
.drop-zone:hover, .dz-active { border-color: var(--primary, #6366f1); background: #f0f0ff; }
.dz-filled { border-color: var(--success, #22c55e); background: #f0fdf4; }
.dz-icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
.dz-text { display: flex; flex-direction: column; flex: 1; gap: 2px; min-width: 0; }
.dz-label { font-size: 13px; font-weight: 500; color: var(--text, #374151); }
.dz-filename { font-size: 13px; font-weight: 600; color: var(--text, #374151); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dz-meta { font-size: 11px; color: var(--text-muted, #6b7280); }
.dz-actions { display: flex; gap: 6px; flex-shrink: 0; align-items: center; }
.dz-browse-btn { padding: 5px 14px; font-size: 12px; font-weight: 500; border: 1px solid var(--border, #d1d5db); border-radius: var(--radius, 6px); background: #fff; cursor: pointer; white-space: nowrap; }
.dz-browse-btn:hover { border-color: var(--primary, #6366f1); color: var(--primary, #6366f1); }
.dz-dl-btn { padding: 5px 10px; font-size: 13px; border: 1px solid var(--border, #d1d5db); border-radius: var(--radius, 6px); background: #fff; cursor: pointer; }
.dz-dl-btn:hover { border-color: var(--primary, #6366f1); color: var(--primary, #6366f1); }
.btn-xs { padding: 2px 8px; font-size: 11px; line-height: 1.5; white-space: nowrap; }
@media (max-width: 720px) { .grid-3 { grid-template-columns: 1fr; } }
</style>
