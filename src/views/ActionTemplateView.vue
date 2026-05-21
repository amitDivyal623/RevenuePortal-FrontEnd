<template>
  <AppLayout>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Workflow Action Template</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Action Template</span>
      </div>
    </div>

    <!-- Filters card -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Action Template Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="caseTypeFilter">Case Type</label>
          <select id="caseTypeFilter" v-model="filterCaseTypeId">
            <option value="">All case types</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id" :title="ct.code">
              {{ ct.description }} ({{ ct.case_option }})
            </option>
          </select>
          <span v-if="caseTypeError" class="form-error" role="alert">{{ caseTypeError }}</span>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button type="button" class="btn btn-primary btn-sm" @click="search">Search</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <!-- Data card -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">
          Matching Action Templates ({{ filteredActions.length }})
        </div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ filteredActions.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">+ Add Action</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('name')" class="sortable">Workflow Action {{ sortIcon('name') }}</th>
              <th @click="sort('instruction')" class="sortable">Instruction {{ sortIcon('instruction') }}</th>
              <th>Work From</th>
              <th @click="sort('days_offset')" class="sortable" style="text-align:right">Offset {{ sortIcon('days_offset') }}</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedRows.length === 0">
              <td colspan="5">
                <div class="empty-state">
                  <div class="empty-state-icon">📋</div>
                  <p class="empty-state-title">No action templates found</p>
                  <p class="empty-state-desc">Try clearing filters or add a new action template.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in pagedRows" :key="row.action_template_id">
              <td><strong>{{ row.name }}</strong></td>
              <td class="text-muted">{{ row.instruction }}</td>
              <td>
                <span v-if="row.workFromDate === 1" class="badge badge-warning">*Offence Date*</span>
                <span v-else class="badge badge-primary">{{ predecessorName(row.predecessor) }}</span>
              </td>
              <td style="text-align:right"><strong>{{ row.days_offset }}</strong></td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button type="button" class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                  <button type="button" class="btn btn-danger btn-sm" @click="openDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--">‹ Prev</button>
        <button
          v-for="p in totalPages" :key="p"
          class="page-btn" :class="{ active: p === page }"
          @click="page = p"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">Next ›</button>
        <span class="page-meta">{{ filteredActions.length }} total</span>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <form class="modal-body two-col" @submit.prevent="saveAction" novalidate>
          <!-- Left column -->
          <div class="modal-col">
            <div class="form-group">
              <label class="form-label" for="m-caseType">Case Type <span class="req">*</span></label>
              <select id="m-caseType" v-model="form.case_type_id" :disabled="modalMode!=='add'" @change="onCaseTypeChange">
                <option value="">Please Select</option>
                <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id" :title="ct.code">
                  {{ ct.description }} ({{ ct.case_option }})
                </option>
              </select>
              <span v-if="errors.case_type_id" class="form-error">{{ errors.case_type_id }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-action">Action <span class="req">*</span></label>
              <input id="m-action" v-model.trim="form.name" type="text" placeholder="Action" :disabled="modalMode==='view'" />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-instruction">Instruction <span class="req">*</span></label>
              <input id="m-instruction" v-model.trim="form.instruction" type="text" placeholder="Instruction" :disabled="modalMode==='view'" />
              <span v-if="errors.instruction" class="form-error">{{ errors.instruction }}</span>
            </div>

            <div class="form-group inline-row">
              <label class="form-label">Work from Offence Date?</label>
              <label class="toggle">
                <input type="checkbox" v-model="form.workFromDate" :true-value="1" :false-value="0" :disabled="modalMode==='view'" />
                <span class="toggle-track"></span>
              </label>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-predecessor">Predecessor</label>
              <select id="m-predecessor" v-model="form.predecessor" :disabled="form.workFromDate === 1 || modalMode==='view'">
                <option value="">Please Select</option>
                <option v-for="p in predecessorOptions" :key="p.action_template_id" :value="p.action_template_id">
                  {{ p.name }}
                </option>
              </select>
              <span v-if="errors.predecessor" class="form-error">{{ errors.predecessor }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-dayoffset">Days Offset <span class="req">*</span></label>
              <input id="m-dayoffset" v-model.number="form.days_offset" type="number" min="0" placeholder="0" :disabled="modalMode==='view'" />
              <span v-if="errors.days_offset" class="form-error">{{ errors.days_offset }}</span>
            </div>

            <template v-if="communicationAutomationEnabled">
              <div class="form-group">
                <label class="form-label" for="m-actionType">Action Type <span class="req">*</span></label>
                <select id="m-actionType" v-model="form.action_type" :disabled="modalMode==='view'">
                  <option value="">Please Select</option>
                  <option v-for="t in actionTypes" :key="t.actionTypeID" :value="t.actionTypeID">{{ t.actionTypeName }}</option>
                </select>
                <span v-if="errors.action_type" class="form-error">{{ errors.action_type }}</span>
              </div>

              <div class="form-group" v-if="showEmailTemplate">
                <label class="form-label" for="m-emailTemplate">Email Template to use <span class="req">*</span></label>
                <select id="m-emailTemplate" v-model="form.EmailTemplate" :disabled="modalMode==='view'">
                  <option value="">Please Select</option>
                  <option v-for="e in emailTemplates" :key="e.email_template_id" :value="e.email_template_id">{{ e.title }}</option>
                </select>
                <span v-if="errors.EmailTemplate" class="form-error">{{ errors.EmailTemplate }}</span>
              </div>

              <div class="form-group" v-if="showLetterTemplate">
                <label class="form-label" for="m-letterTemplate">Letter Template to use <span class="req">*</span></label>
                <select id="m-letterTemplate" v-model="form.LetterTemplate" :disabled="modalMode==='view'">
                  <option value="">Please Select</option>
                  <option v-for="l in letterTemplates" :key="l.letter_template_id" :value="l.letter_template_id">{{ l.title }}</option>
                </select>
                <span v-if="errors.LetterTemplate" class="form-error">{{ errors.LetterTemplate }}</span>
              </div>

              <div v-if="showAttachments" class="form-group">
                <div v-for="(att, idx) in form.attachments" :key="idx" class="attachment-row">
                  <label class="form-label">
                    Attachment to use ({{ idx + 1 }})
                    <a v-if="modalMode!=='view'" href="#" class="remove-link" @click.prevent="removeAttachment(idx)">Remove</a>
                  </label>
                  <select v-model="form.attachments[idx]" :disabled="modalMode==='view'">
                    <option value="">Please Select</option>
                    <option v-for="l in letterTemplates" :key="l.letter_template_id" :value="l.letter_template_id">{{ l.title }}</option>
                  </select>
                </div>
                <a v-if="modalMode!=='view'" href="#" class="add-link" @click.prevent="addAttachment">+ Add another attachment</a>
              </div>
            </template>
          </div>

          <!-- Right column -->
          <div class="modal-col">
            <div class="form-group">
              <label class="form-label" for="m-holder">Holder <span class="req">*</span></label>
              <select id="m-holder" v-model="form.holder" :disabled="modalMode==='view'">
                <option value="">Please Select</option>
                <option v-for="r in holderOwnerLookup" :key="`h-${r.lookup_data_id}`" :value="r.lookup_data_id">
                  {{ r.lookup_data_value }}
                </option>
              </select>
              <span v-if="errors.holder" class="form-error">{{ errors.holder }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-owner">Owner <span class="req">*</span></label>
              <select id="m-owner" v-model="form.owner" :disabled="modalMode==='view'">
                <option value="">Please Select</option>
                <option v-for="r in holderOwnerLookup" :key="`o-${r.lookup_data_id}`" :value="r.lookup_data_id">
                  {{ r.lookup_data_value }}
                </option>
              </select>
              <span v-if="errors.owner" class="form-error">{{ errors.owner }}</span>
            </div>

            <div class="form-group inline-row">
              <label class="form-label">PCN Notice to Owner?</label>
              <label class="toggle">
                <input type="checkbox" v-model="form.pcnNoticeToOwnerFlag" :disabled="modalMode==='view'" />
                <span class="toggle-track"></span>
              </label>
            </div>

            <div class="form-group inline-row">
              <label class="form-label">PCN Charge Certificate?</label>
              <label class="toggle">
                <input type="checkbox" v-model="form.pcnChargeCertificateFlag" :disabled="modalMode==='view'" />
                <span class="toggle-track"></span>
              </label>
            </div>

            <div class="form-group">
              <label class="form-label" for="m-admincost">Add Admin Cost?</label>
              <div class="input-prefix">
                <span class="prefix">£</span>
                <input id="m-admincost" v-model="form.adminCost" type="text" placeholder="0.00" autocomplete="off"
                  :disabled="modalMode==='view'" @blur="normalizeCost" />
              </div>
            </div>
          </div>

          <div class="modal-footer two-col-footer">
            <p v-if="formError" class="form-error" role="alert" style="flex:1">{{ formError }}</p>
            <div class="flex gap-sm" style="margin-left:auto">
              <button v-if="modalMode==='view'" type="button" class="btn btn-secondary" @click="closeModal">Close</button>
              <template v-else>
                <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </template>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteOpen" class="modal-overlay" @click.self="deleteOpen=false" role="dialog" aria-modal="true">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2 class="modal-title">Confirm Delete</h2>
          <button type="button" class="modal-close" @click="deleteOpen=false" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <strong>Are you sure you want to delete this Workflow Action Template?</strong>
          <p class="text-muted" style="margin-top:8px;font-size:13px">
            "{{ deleteTarget?.name }}" — this action will be marked inactive and removed from predecessor lookups.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="deleteOpen=false">No</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete">Yes, delete</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  caseTypes,
  holderOwnerLookup,
  actionTypes,
  emailTemplates,
  letterTemplates,
  actionTemplates as seedActionTemplates,
  communicationAutomationEnabled
} from '@/mock/actionTemplateData.js'

/* ════════════════════════════════════════════════════════════════════════
   State — mirrors the data shape returned by the legacy
   RevpConfig.actiontemplate / getAction / setAction / getEditAction APIs
   so future axios integration is a drop-in swap.
   ════════════════════════════════════════════════════════════════════════ */
const actions = reactive([...seedActionTemplates])

const filterCaseTypeId = ref('')
const caseTypeError = ref('')

const page = ref(1)
const perPage = ref(10)
const sortKey = ref('name')
const sortDir = ref('asc')

const modalOpen = ref(false)
const modalMode = ref('add') // 'add' | 'edit' | 'view'
const formError = ref('')

const blankForm = () => ({
  action_template_id: '',
  case_type_id: '',
  name: '',
  instruction: '',
  predecessor: '',
  workFromDate: 0,
  days_offset: 0,
  holder: '',
  owner: '',
  pcnNoticeToOwnerFlag: false,
  pcnChargeCertificateFlag: false,
  pcnNoticeToOwner: '0.00',
  pcnChargeCertificate: '0.00',
  adminCost: '0.00',
  action_type: '',
  EmailTemplate: '',
  LetterTemplate: '',
  attachments: [''],
  active: 1
})

const form = reactive(blankForm())
const errors = reactive({})

const deleteOpen = ref(false)
const deleteTarget = ref(null)

const modalTitle = computed(() =>
  modalMode.value === 'add'  ? 'Add Work Action Template'  :
  modalMode.value === 'edit' ? 'Edit Work Action Template' :
                               'View Work Action Template'
)

/* ───────────── Lookups ───────────── */
const predecessorOptions = computed(() =>
  actions
    .filter(a => a.active === 1 && a.case_type_id === form.case_type_id && a.action_template_id !== form.action_template_id)
    .sort((a, b) => a.name.localeCompare(b.name))
)

function predecessorName(id) {
  if (!id) return '*Offence Date*'
  const found = actions.find(a => a.action_template_id === id)
  return found ? found.name : '*Offence Date*'
}

/* ───────────── Action Type-driven visibility (matches legacy JS) ───────────── */
const selectedActionTypeName = computed(() => {
  const t = actionTypes.find(a => a.actionTypeID === form.action_type)
  return t?.actionTypeName ?? ''
})
const showEmailTemplate   = computed(() => ['Send Email', 'Send Email with Attachment'].includes(selectedActionTypeName.value))
const showLetterTemplate  = computed(() => selectedActionTypeName.value === 'Send Letter')
const showAttachments     = computed(() => selectedActionTypeName.value === 'Send Email with Attachment')

watch(() => form.workFromDate, (v) => { if (v === 1) form.predecessor = '' })

/* ───────────── Filtering / sorting / paging ───────────── */
const filteredActions = computed(() =>
  actions
    .filter(a => a.active === 1)
    .filter(a => !filterCaseTypeId.value || a.case_type_id === filterCaseTypeId.value)
)

const sortedActions = computed(() => {
  const mul = sortDir.value === 'asc' ? 1 : -1
  return [...filteredActions.value].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul
    return String(va ?? '').localeCompare(String(vb ?? '')) * mul
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedActions.value.length / perPage.value)))
const pagedRows  = computed(() => sortedActions.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch(filteredActions, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

/* ───────────── Filter actions ───────────── */
function search() {
  caseTypeError.value = ''
  page.value = 1
}
function clearFilters() {
  filterCaseTypeId.value = ''
  caseTypeError.value = ''
  page.value = 1
}

/* ───────────── Modal handlers ───────────── */
function resetForm() {
  Object.assign(form, blankForm())
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
}

function openAdd() {
  resetForm()
  // Pre-fill case type from the page-level filter when one is active, otherwise leave blank
  form.case_type_id = filterCaseTypeId.value || ''
  caseTypeError.value = ''
  modalMode.value = 'add'
  modalOpen.value = true
}

function onCaseTypeChange() {
  // Clear the predecessor when case type changes, since predecessor list is filtered by case_type_id
  form.predecessor = ''
  if (errors.case_type_id) delete errors.case_type_id
}

function loadIntoForm(row) {
  Object.assign(form, blankForm(), {
    action_template_id: row.action_template_id,
    case_type_id: row.case_type_id,
    name: row.name,
    instruction: row.instruction,
    predecessor: row.predecessor ?? '',
    workFromDate: row.workFromDate ?? 0,
    days_offset: row.days_offset ?? 0,
    holder: row.holder ?? '',
    owner: row.owner ?? '',
    pcnNoticeToOwnerFlag: Number(row.pcnNoticeToOwner) > 0,
    pcnChargeCertificateFlag: Number(row.pcnChargeCertificate) > 0,
    pcnNoticeToOwner: row.pcnNoticeToOwner ?? '0.00',
    pcnChargeCertificate: row.pcnChargeCertificate ?? '0.00',
    adminCost: row.adminCost ?? '0.00',
    action_type: row.action_type ?? '',
    EmailTemplate: row.EmailTemplate ?? '',
    LetterTemplate: row.LetterTemplate ?? '',
    attachments: (row.attachments && row.attachments.length) ? [...row.attachments] : [''],
    active: row.active ?? 1
  })
}

function openEdit(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'edit'
  modalOpen.value = true
}

function openView(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'view'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  resetForm()
}

function openDelete(row) {
  deleteTarget.value = row
  deleteOpen.value = true
}
function confirmDelete() {
  const id = deleteTarget.value?.action_template_id
  if (!id) return
  // Mirrors legacy deleteAction: mark inactive + null any predecessor pointing at this id
  const target = actions.find(a => a.action_template_id === id)
  if (target) target.active = 0
  actions.forEach(a => { if (a.predecessor === id) a.predecessor = '' })
  deleteOpen.value = false
  deleteTarget.value = null
}

/* ───────────── Add attachment management ───────────── */
function addAttachment() { form.attachments.push('') }
function removeAttachment(idx) { form.attachments.splice(idx, 1); if (form.attachments.length === 0) form.attachments.push('') }

/* ───────────── Admin cost formatter (mirrors legacy .cost focusout JS) ───────────── */
function normalizeCost() {
  let v = String(form.adminCost ?? '').trim()
  if (!v) v = '0.00'
  if (v.indexOf('.') === -1) v += '.00'
  else {
    const [whole, frac] = v.split('.')
    if (frac.length === 1) v = `${whole}.${frac}0`
    else if (frac.length > 2) v = parseFloat(v).toFixed(2)
  }
  form.adminCost = v
}

/* ───────────── Validation + save (mirrors legacy actionTemplate.validate rules) ───────────── */
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
  let ok = true
  if (!form.name?.trim())        { errors.name = 'Please Enter Action'; ok = false }
  if (!form.instruction?.trim()) { errors.instruction = 'Please Enter Instruction'; ok = false }
  if (form.days_offset === '' || form.days_offset === null || isNaN(form.days_offset)) {
    errors.days_offset = 'Please select Day offset'; ok = false
  }
  if (!form.holder) { errors.holder = 'Please select Holder'; ok = false }
  if (!form.owner)  { errors.owner  = 'Please select Owner';  ok = false }
  if (communicationAutomationEnabled) {
    if (!form.action_type) { errors.action_type = 'Please select Action Type'; ok = false }
    if (showEmailTemplate.value  && !form.EmailTemplate)  { errors.EmailTemplate  = 'Please select Email';  ok = false }
    if (showLetterTemplate.value && !form.LetterTemplate) { errors.LetterTemplate = 'Please select Letter'; ok = false }
  }
  if (form.workFromDate !== 1 && !form.predecessor) {
    formError.value = 'As a minimum a predecessor should be selected or Offence Date selected'
    ok = false
  }
  if (!form.case_type_id) {
    errors.case_type_id = 'Please select Case Type'
    ok = false
  }
  return ok
}

function saveAction() {
  if (!validate()) return

  // Map flag booleans back into the legacy money-string fields ('0.00' or a TOC-configured value)
  // In real backend the value comes from revp_tocVarConfig.value — stub here.
  const noticeOwnerValue       = form.pcnNoticeToOwnerFlag     ? '70.00' : '0.00'
  const chargeCertificateValue = form.pcnChargeCertificateFlag ? '60.00' : '0.00'

  const payload = {
    action_template_id: form.action_template_id || crypto.randomUUID(),
    case_type_id: form.case_type_id,
    name: form.name.trim(),
    instruction: form.instruction.trim(),
    predecessor: form.workFromDate === 1 ? '' : form.predecessor,
    workFromDate: form.workFromDate,
    days_offset: Number(form.days_offset) || 0,
    holder: form.holder,
    owner: form.owner,
    pcnNoticeToOwner: noticeOwnerValue,
    pcnChargeCertificate: chargeCertificateValue,
    adminCost: form.adminCost,
    action_type: form.action_type,
    EmailTemplate: form.EmailTemplate,
    LetterTemplate: form.LetterTemplate,
    attachments: showAttachments.value ? form.attachments.filter(Boolean) : [],
    active: 1
  }

  if (modalMode.value === 'edit') {
    const idx = actions.findIndex(a => a.action_template_id === payload.action_template_id)
    if (idx !== -1) Object.assign(actions[idx], payload)
  } else {
    actions.push(payload)
  }
  closeModal()
}
</script>

<style scoped>
.req { color: var(--danger); margin-left: 2px; }

/* Inline toggle rows */
.inline-row { flex-direction: row; align-items: center; justify-content: space-between; }
.inline-row .form-label { margin: 0; }

/* Money input */
.input-prefix {
  display: flex; align-items: stretch;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color var(--transition);
  background: #fff;
}
.input-prefix:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.input-prefix .prefix {
  padding: 8px 12px;
  background: var(--bg-page);
  color: var(--text-muted);
  font-weight: 600;
  border-right: 1px solid var(--border);
}
.input-prefix input {
  border: none; border-radius: 0; flex: 1;
}
.input-prefix input:focus { box-shadow: none; }

/* Attachment list */
.attachment-row { margin-bottom: 10px; }
.remove-link { margin-left: 8px; color: var(--danger); font-size: 12px; }
.add-link { color: var(--primary); font-size: 12px; font-weight: 500; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(30, 34, 54, 0.42);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
  padding: 24px;
  animation: fadeIn 120ms ease-out;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.modal {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  box-shadow: 0 20px 60px rgba(30, 34, 54, 0.25);
  overflow: hidden;
  display: flex; flex-direction: column;
  max-height: 90vh;
}
.modal-sm { max-width: 440px; }
.modal-lg { max-width: 820px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: var(--primary);
  color: #fff;
}
.modal-title { font-size: 15px; font-weight: 600; }
.modal-close {
  background: transparent; color: #fff;
  font-size: 22px; line-height: 1;
  padding: 0 6px;
  border-radius: 4px;
}
.modal-close:hover { background: rgba(255,255,255,0.15); }
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
.modal-body.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
  padding-bottom: 0;
}
.modal-col { display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-page);
}
.modal-footer.two-col-footer {
  grid-column: 1 / -1;
  margin-top: 6px;
  align-items: center;
}

@media (max-width: 720px) {
  .modal-body.two-col { grid-template-columns: 1fr; }
}
</style>
