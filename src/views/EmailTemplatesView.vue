<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Email Templates</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Email Templates</span>
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Email Template Filters</div>
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
        <button class="btn btn-primary btn-sm" @click="applyFilters">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Email Templates ({{ filtered.length }})</div>
        <button class="btn btn-primary btn-sm" @click="openAdd">+ Add Email Template</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Title</th><th>Description</th><th>Set Email Template</th><th>Case Type</th>
            <th style="text-align:right">Admin Cost</th><th style="text-align:right">PCN NTO</th><th style="text-align:right">PCN CC</th>
            <th>Created</th><th>By</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody>
            <tr v-if="filtered.length===0"><td colspan="10"><div class="empty-state"><div class="empty-state-icon">📧</div><p class="empty-state-title">No email templates found</p></div></td></tr>
            <tr v-for="row in paged" :key="row.email_template_id">
              <td><strong>{{ row.title }}</strong></td>
              <td class="text-muted">{{ row.body }}</td>
              <td><span class="badge badge-info">{{ tocEmailLabel(row.toc_email_template_id) }}</span></td>
              <td><span v-for="ct in (row.case_types ?? [])" :key="ct.case_type_id" class="badge badge-primary" style="margin-right:4px">{{ ct.case_option }}</span></td>
              <td style="text-align:right">£{{ fmt(row.admin_cost) }}</td>
              <td style="text-align:right">£{{ fmt(row.pcn_notice_to_owner) }}</td>
              <td style="text-align:right">£{{ fmt(row.pcn_charge_certificate) }}</td>
              <td class="text-muted">{{ formatDate(row.created_dt) }}</td>
              <td>{{ userLabel(row.created_by) }}</td>
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
          <input v-model.trim="form.title" :disabled="modalMode==='view'" maxlength="20" @input="touched.title = true" />
          <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">Description <span class="req">*</span></label>
          <input v-model.trim="form.description" :disabled="modalMode==='view'" maxlength="200" @input="touched.description = true" />
          <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
        </div>
      </div>

      <div class="grid-3">
        <div class="form-group">
          <label class="form-label">Admin Cost</label>
          <div class="input-prefix"><span class="prefix">£</span><input v-model.trim="form.adminCost" :disabled="modalMode==='view'" placeholder="0.00" @blur="form.adminCost = norm(form.adminCost)" /></div>
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
            <input type="checkbox" :value="ct.case_type_id" v-model="form.case_type_ids" :disabled="modalMode==='view'" @change="onCaseTypeChange" />
            <span>{{ ct.case_option }}</span>
          </label>
        </div>
        <span v-if="errors.case_type_ids" class="form-error">{{ errors.case_type_ids }}</span>
      </div>

      <div v-if="form.case_type_ids.length > 0" class="grid-2">
        <div class="form-group">
          <label class="form-label">Set Email Template</label>
          <select v-model="form.tocEmailTemplate_id" :disabled="modalMode==='view'">
            <option value="">Please Select</option>
            <option v-for="t in tocEmailTemplates" :key="t.email_template_id" :value="t.email_template_id">{{ t.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Backup Letter Template <span class="req">*</span></label>
          <select v-model="form.letter_template_id" :disabled="modalMode==='view'" @change="touched.letter_template_id = true">
            <option value="">Please Select</option>
            <option v-for="l in modalLetterTemplates" :key="l.letter_template_id" :value="l.letter_template_id">{{ l.title }}</option>
          </select>
          <span v-if="errors.letter_template_id" class="form-error">{{ errors.letter_template_id }}</span>
        </div>
      </div>

      <div class="form-group inline-row" v-if="modalMode==='edit'">
        <label class="form-label">Disabled</label>
        <label class="toggle"><input type="checkbox" v-model="form.disabledFlag" /><span class="toggle-track"></span></label>
      </div>
    </AdminModal>

    <ConfirmDelete v-if="deleteOpen" title="Delete email template" :detail="deleteTarget?.title" @cancel="deleteOpen=false" @confirm="confirmDelete" />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watchEffect } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import { swal } from '@/utils/swal.js'
import { useEmailTemplatesStore } from '@/store/email-templates.store.js'

const store = useEmailTemplatesStore()
onMounted(() => store.init())

const rows = computed(() => store.templates)
const caseTypes = computed(() => store.caseTypes)
const tocUsers = computed(() => store.tocUsers)
const letterTemplates = computed(() => store.letterTemplates)
const tocEmailTemplates = computed(() => store.tocEmailTemplates)
const communicationAutomationEnabled = computed(() => store.communicationAutomationEnabled)
const filterCaseType = ref('')
const filterAddedBy = ref('')
const filterFrom = ref('')
const filterTo = ref('')
// Applied filter state — only updated when Search is clicked
const appliedCaseType = ref('')
const appliedAddedBy = ref('')
const appliedFrom = ref('')
const appliedTo = ref('')
const page = ref(1)
const perPage = ref(10)
const modalOpen = ref(false)
const modalMode = ref('add')
const deleteOpen = ref(false)
const deleteTarget = ref(null)

const blank = () => ({
  email_template_id: '',
  tocEmailTemplate_id: '',
  title: '',
  description: '',
  adminCost: '0.00',
  pcnNoticeToOwner: '0.00',
  pcnChargeCertificate: '0.00',
  letter_template_id: '',
  case_type_ids: [],
  disabledFlag: false,
})
const form = reactive(blank())
const errors = reactive({})
const touched = reactive({})

// Real-time validation — runs synchronously whenever form data or touched state changes
watchEffect(() => {
  if (touched.title) {
    if (!form.title || !/\S/.test(form.title)) errors.title = 'Please enter title'
    else delete errors.title
  } else delete errors.title

  if (touched.description) {
    if (!form.description || !/\S/.test(form.description)) errors.description = 'Please enter description'
    else delete errors.description
  } else delete errors.description

  if (touched.case_type_ids) {
    if (form.case_type_ids.length === 0) errors.case_type_ids = 'Please select at least one case type'
    else delete errors.case_type_ids
  } else delete errors.case_type_ids

  if (touched.letter_template_id) {
    if (form.case_type_ids.length > 0 && !form.letter_template_id) errors.letter_template_id = 'Please select Backup Letter Template'
    else delete errors.letter_template_id
  } else delete errors.letter_template_id
}, { flush: 'sync' })

// Computed letter templates for the modal: filtered by selected case types when active, all otherwise
const modalLetterTemplates = computed(() =>
  form.case_type_ids.length > 0 ? store.filteredLetterTemplates : store.letterTemplates
)

// Fired by each case type checkbox @change (user interaction only — not during programmatic load)
function onCaseTypeChange() {
  touched.case_type_ids = true
  if (form.case_type_ids.length === 0) {
    form.tocEmailTemplate_id = ''
    form.letter_template_id = ''
    store.clearFilteredLetterTemplates()
  } else {
    form.letter_template_id = ''
    store.fetchLetterTemplatesForCaseTypes([...form.case_type_ids])
  }
}

const modalTitle = computed(() => modalMode.value==='add'?'Add Email Template':modalMode.value==='edit'?'Edit Email Template':'View Email Template')
const filtered = computed(() => rows.value.filter(r =>
  (!appliedCaseType.value || (r.case_type_ids ?? []).includes(appliedCaseType.value)) &&
  (!appliedAddedBy.value || r.created_by === appliedAddedBy.value) &&
  (!appliedFrom.value || new Date(r.created_dt) >= new Date(appliedFrom.value)) &&
  (!appliedTo.value || new Date(r.created_dt) <= new Date(appliedTo.value + 'T23:59:59'))
))
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)))
const paged = computed(() => filtered.value.slice((page.value-1)*perPage.value, page.value*perPage.value))

function tocEmailLabel(id) {
  if (!id) return '—'
  return tocEmailTemplates.value.find(t => t.email_template_id === id)?.title ?? '—'
}
function userLabel(userId) {
  if (!userId) return '—'
  return tocUsers.value.find(u => u.user_id === userId)?.username ?? userId
}
function fmt(v) { return Number(v ?? 0).toFixed(2) }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', {day:'2-digit',month:'2-digit',year:'numeric'}) }
function norm(v) { v=String(v??'').trim(); if(!v) return '0.00'; if(v.indexOf('.')===-1) return v+'.00'; const [w,f]=v.split('.'); if(f.length===1) return `${w}.${f}0`; if(f.length>2) return parseFloat(v).toFixed(2); return v }
function applyFilters() { appliedCaseType.value=filterCaseType.value; appliedAddedBy.value=filterAddedBy.value; appliedFrom.value=filterFrom.value; appliedTo.value=filterTo.value; page.value=1 }
function clearFilters() { filterCaseType.value=''; filterAddedBy.value=''; filterFrom.value=''; filterTo.value=''; appliedCaseType.value=''; appliedAddedBy.value=''; appliedFrom.value=''; appliedTo.value=''; page.value=1 }
function reset() {
  Object.assign(form, blank())
  Object.keys(touched).forEach(k => delete touched[k])
  Object.keys(errors).forEach(k => delete errors[k])
  store.clearFilteredLetterTemplates()
}
function openAdd() { reset(); modalMode.value='add'; modalOpen.value=true }

function load(r) {
  Object.assign(form, blank(), {
    email_template_id: r.email_template_id ?? '',
    tocEmailTemplate_id: r.toc_email_template_id ?? '',
    title: r.title ?? '',
    description: r.body ?? '',
    adminCost: norm(String(r.admin_cost ?? '0')),
    pcnNoticeToOwner: norm(String(r.pcn_notice_to_owner ?? '0')),
    pcnChargeCertificate: norm(String(r.pcn_charge_certificate ?? '0')),
    letter_template_id: r.letter_template_id ?? '',
    case_type_ids: [...(r.case_type_ids ?? [])],
    disabledFlag: r.active === 0,
  })
}

async function openEdit(r) {
  reset()
  const detail = await store.fetchTemplate(r.email_template_id)
  load(detail)
  if ((detail.case_type_ids ?? []).length > 0) {
    await store.fetchLetterTemplatesForCaseTypes([...detail.case_type_ids])
  }
  modalMode.value = 'edit'
  modalOpen.value = true
}

async function openView(r) {
  reset()
  const detail = await store.fetchTemplate(r.email_template_id)
  load(detail)
  if ((detail.case_type_ids ?? []).length > 0) {
    await store.fetchLetterTemplatesForCaseTypes([...detail.case_type_ids])
  }
  modalMode.value = 'view'
  modalOpen.value = true
}

function closeModal() { modalOpen.value=false; reset() }
function openDelete(r) { deleteTarget.value=r; deleteOpen.value=true }

async function confirmDelete() {
  const id = deleteTarget.value?.email_template_id
  if (!id) return
  await store.removeTemplate(id)
  deleteOpen.value = false
  deleteTarget.value = null
}

function validate() {
  // Mark all relevant fields as touched — watchEffect (flush:sync) fires immediately and updates errors
  touched.title = true
  touched.description = true
  touched.case_type_ids = true
  if (form.case_type_ids.length > 0) touched.letter_template_id = true
  return !errors.title && !errors.description && !errors.case_type_ids && !errors.letter_template_id
}

async function saveTpl() {
  if (!validate()) return
  const payload = {
    toc_email_template_id: form.tocEmailTemplate_id || null,
    title: form.title,
    body: form.description,
    admin_cost: parseFloat(form.adminCost) || 0,
    pcn_notice_to_owner: parseFloat(form.pcnNoticeToOwner) || 0,
    pcn_charge_certificate: parseFloat(form.pcnChargeCertificate) || 0,
    letter_template_id: form.letter_template_id || null,
    case_type_ids: [...form.case_type_ids],
  }
  const isAdd = modalMode.value === 'add'
  if (isAdd) {
    await store.createTemplate({ ...payload, active: 1 })
  } else {
    await store.updateTemplate(form.email_template_id, {
      ...payload,
      active: form.disabledFlag ? 0 : 1,
    })
  }
  closeModal()
  await swal.success(isAdd ? 'Email template created successfully' : 'Email template updated successfully')
}
</script>

<style scoped>
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.checkbox-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); background: #fff; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
@media (max-width: 720px) { .grid-3 { grid-template-columns: 1fr; } }
</style>
