<template>
  <AppLayout>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Ticket Pad</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Ticket Pads</span>
      </div>
    </div>

    <!-- Filters card -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Ticket Pad Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="fCaseType">Case Type</label>
          <select id="fCaseType" v-model="filterCaseType">
            <option value="">All case types</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">
              {{ ct.case_option }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="fEnteredBy">Entered By</label>
          <select id="fEnteredBy" v-model="filterEnteredBy">
            <option value="">Select Enter By</option>
            <option v-for="u in tocUsers" :key="`fe-${u.UserID}`" :value="u.UserID">{{ u.Username }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="fIssuedBy">Issued By</label>
          <select id="fIssuedBy" v-model="filterIssuedBy">
            <option value="">Select Issued By</option>
            <option v-for="i in padIssuers" :key="i.lookup_data_id" :value="i.lookup_data_id">{{ i.lookup_data_value }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="fIssuedTo">Issued To</label>
          <select id="fIssuedTo" v-model="filterIssuedTo">
            <option value="">Select Issued To</option>
            <option v-for="u in tocUsers" :key="`fi-${u.UserID}`" :value="u.UserID">{{ u.Username }}</option>
          </select>
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
          Matching Ticket Pads ({{ filteredPads.length }})
        </div>
        <div class="flex items-center gap-sm">
          <span class="text-sm text-light">{{ filteredPads.length }} entries</span>
          <select v-model.number="perPage" style="width:auto;padding:5px 10px;font-size:12px">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <button type="button" class="btn btn-primary btn-sm" @click="openAdd">+ Add Ticket Pad</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th @click="sort('code')" class="sortable">Case Type {{ sortIcon('code') }}</th>
              <th @click="sort('enteredbyname')" class="sortable">Entered By {{ sortIcon('enteredbyname') }}</th>
              <th @click="sort('CreatedDT')" class="sortable">Date/Time {{ sortIcon('CreatedDT') }}</th>
              <th>Issued To</th>
              <th @click="sort('issuedDate')" class="sortable">Issued Date {{ sortIcon('issuedDate') }}</th>
              <th style="text-align:right">Pad Start</th>
              <th style="text-align:right">Pad End</th>
              <th>First Used</th>
              <th>Last Used</th>
              <th style="text-align:right">Tickets Issued</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedRows.length === 0">
              <td colspan="12">
                <div class="empty-state">
                  <div class="empty-state-icon">🎫</div>
                  <p class="empty-state-title">No ticket pads found</p>
                  <p class="empty-state-desc">Try clearing filters or add a new ticket pad.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in pagedRows" :key="row.ticket_pad_id">
              <td><span class="badge badge-primary">{{ row.code }}</span></td>
              <td class="text-muted">{{ row.enteredbyname }}</td>
              <td class="text-muted">{{ formatDateTime(row.CreatedDT) }}</td>
              <td>
                <strong>{{ row.FirstName }} {{ row.Surname }}</strong>
                <span class="text-light"> ({{ row.issuedtouser }})</span>
              </td>
              <td>{{ formatDate(row.issuedDate) }}</td>
              <td style="text-align:right">{{ row.startNum }}</td>
              <td style="text-align:right">{{ row.endNum }}</td>
              <td class="text-muted">{{ formatDate(row.Firstused) }}</td>
              <td class="text-muted">{{ formatDate(row.Lastused) }}</td>
              <td style="text-align:right">
                <strong>{{ row.Issuedtickets ?? 0 }}</strong>
                <span class="text-light">/{{ row.Totaltickets ?? 0 }}</span>
              </td>
              <td>
                <span v-if="row.active === 1" class="badge badge-success">Active</span>
                <span v-else class="badge badge-neutral">Disabled</span>
              </td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button type="button" class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
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
        <span class="page-meta">{{ filteredPads.length }} total</span>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true" :aria-label="modalTitle">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <button type="button" class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <form class="modal-body" @submit.prevent="saveTicketPad" novalidate>
          <!-- Disabled toggle (edit only — matches legacy `flag EQ 'edit'` branch) -->
          <div v-if="modalMode !== 'add'" class="toggle-row mb-md">
            <label class="toggle-cell">
              <input type="checkbox" v-model="form.disabledFlag" />
              <span>Disabled</span>
            </label>
          </div>

          <!-- Two-column body. When disabledFlag is true (edit), inputs are visually dimmed
               and read-only — matches legacy `.disabled-fields` + `:input.prop('disabled', true)`. -->
          <div class="ticket-grid" :class="{ 'is-dimmed': form.disabledFlag && modalMode!=='view' }">
            <!-- Left column -->
            <div class="ticket-col">
              <div class="form-group">
                <label class="form-label" for="m-enteredby">Entered By <span class="req">*</span></label>
                <!-- Always disabled in legacy (auto-set to current user) -->
                <select id="m-enteredby" v-model="form.entered_by" disabled>
                  <option v-for="u in tocUsers" :key="`eb-${u.UserID}`" :value="u.UserID">{{ u.Username }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="m-issuedate">Issue Date <span class="req">*</span></label>
                <input id="m-issuedate" v-model="form.issuedDate" type="date" :disabled="isFieldDisabled" />
                <span v-if="errors.issuedDate" class="form-error">{{ errors.issuedDate }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="m-padstart">Pad Start Number <span class="req">*</span></label>
                <input
                  id="m-padstart"
                  v-model.number="form.startNum"
                  type="number"
                  min="0"
                  placeholder="Pad Start Number"
                  :disabled="isFieldDisabled"
                />
                <span v-if="errors.startNum" class="form-error">{{ errors.startNum }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="m-padend">Pad End Number <span class="req">*</span></label>
                <input
                  id="m-padend"
                  v-model.number="form.endNum"
                  type="number"
                  min="0"
                  placeholder="Pad End Number"
                  :disabled="isFieldDisabled"
                />
                <span v-if="errors.endNum" class="form-error">{{ errors.endNum }}</span>
              </div>
            </div>

            <!-- Right column -->
            <div class="ticket-col">
              <div class="form-group">
                <label class="form-label" for="m-casetype">Case Type <span class="req">*</span></label>
                <select id="m-casetype" v-model="form.case_type_id" :disabled="isFieldDisabled">
                  <option value="">Select Case Type</option>
                  <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
                </select>
                <span v-if="errors.case_type_id" class="form-error">{{ errors.case_type_id }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="m-issuedby">Issued By <span class="req">*</span></label>
                <select id="m-issuedby" v-model="form.issuedBy" :disabled="isFieldDisabled">
                  <option value="">Select Issued By</option>
                  <option v-for="i in padIssuers" :key="i.lookup_data_id" :value="i.lookup_data_id">{{ i.lookup_data_value }}</option>
                </select>
                <span v-if="errors.issuedBy" class="form-error">{{ errors.issuedBy }}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="m-issueto">Issued To <span class="req">*</span></label>
                <select id="m-issueto" v-model="form.issuedTo" :disabled="isFieldDisabled">
                  <option value="">Select Issued To</option>
                  <option v-for="u in tocUsers" :key="`it-${u.UserID}`" :value="u.UserID">
                    {{ u.Username }}
                  </option>
                </select>
                <span v-if="errors.issuedTo" class="form-error">{{ errors.issuedTo }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <p v-if="formError" class="form-error" role="alert" style="flex:1">{{ formError }}</p>
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useTicketPadsStore } from '@/store/ticket-pads.store.js'

const store = useTicketPadsStore()
onMounted(() => store.init())

const pads = computed(() => store.pads)
const caseTypes = computed(() => store.caseTypes)
const tocUsers = computed(() => store.tocUsers)
const padIssuers = computed(() => store.padIssuers)
const sessionUserId = computed(() => store.sessionUserId)

const filterCaseType  = ref('')
const filterEnteredBy = ref('')
const filterIssuedBy  = ref('')
const filterIssuedTo  = ref('')

// Applied only on Search click — dropdowns alone do not trigger filtering
const appliedCaseType  = ref('')
const appliedEnteredBy = ref('')
const appliedIssuedBy  = ref('')
const appliedIssuedTo  = ref('')

const page = ref(1)
const perPage = ref(10)
const sortKey = ref('CreatedDT')
const sortDir = ref('desc')

const modalOpen = ref(false)
const modalMode = ref('add')   // 'add' | 'edit'
const formError = ref('')

const blankForm = () => ({
  ticket_pad_id: '',
  case_type_id: '',
  issuedBy: '',
  issuedTo: '',
  issuedDate: '',
  startNum: null,
  endNum: null,
  disabledFlag: false,
  entered_by: sessionUserId.value
})

const form = reactive(blankForm())
const errors = reactive({})

const modalTitle = computed(() =>
  modalMode.value === 'add' ? 'Add Ticket Pad' : 'Edit Ticket Pad'
)

const isFieldDisabled = computed(() =>
  modalMode.value === 'edit' && form.disabledFlag
)

/* ───────────── Filtering / sorting / paging ───────────── */
const filteredPads = computed(() =>
  pads.value.filter(p =>
    (!appliedCaseType.value  || p.case_type_id === appliedCaseType.value) &&
    (!appliedEnteredBy.value || p.CreatedBy    === appliedEnteredBy.value) &&
    (!appliedIssuedBy.value  || p.issuedBy     === appliedIssuedBy.value) &&
    (!appliedIssuedTo.value  || p.issuedTo     === appliedIssuedTo.value)
  )
)

const sortedPads = computed(() => {
  const mul = sortDir.value === 'asc' ? 1 : -1
  return [...filteredPads.value].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul
    return String(va ?? '').localeCompare(String(vb ?? '')) * mul
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedPads.value.length / perPage.value)))
const pagedRows  = computed(() => sortedPads.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

watch(filteredPads, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(k) { return sortKey.value === k ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function search() {
  appliedCaseType.value  = filterCaseType.value
  appliedEnteredBy.value = filterEnteredBy.value
  appliedIssuedBy.value  = filterIssuedBy.value
  appliedIssuedTo.value  = filterIssuedTo.value
  page.value = 1
}

function clearFilters() {
  filterCaseType.value = ''
  filterEnteredBy.value = ''
  filterIssuedBy.value = ''
  filterIssuedTo.value = ''
  appliedCaseType.value = ''
  appliedEnteredBy.value = ''
  appliedIssuedBy.value = ''
  appliedIssuedTo.value = ''
  page.value = 1
}

/* ───────────── Formatters ───────────── */
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return `${dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

/* ───────────── Lookup helpers (used on save to denormalise joins) ───────────── */
function findCaseType(id) { return caseTypes.value.find(c => c.case_type_id === id) }
function findIssuer(id)   { return padIssuers.value.find(i => i.lookup_data_id === id) }
function findUser(id)     { return tocUsers.value.find(u => u.UserID === id) }

/* ───────────── Modal handlers ───────────── */
function resetForm() {
  Object.assign(form, blankForm())
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
}

function openAdd() {
  resetForm()
  modalMode.value = 'add'
  modalOpen.value = true
}

function loadIntoForm(row) {
  Object.assign(form, blankForm(), {
    ticket_pad_id: row.ticket_pad_id,
    case_type_id: row.case_type_id,
    issuedBy: row.issuedBy,
    issuedTo: row.issuedTo,
    issuedDate: row.issuedDate ?? '',
    startNum: row.startNum,
    endNum: row.endNum,
    disabledFlag: row.active === 0,
    entered_by: row.CreatedBy
  })
}

function openEdit(row) {
  resetForm()
  loadIntoForm(row)
  modalMode.value = 'edit'
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  resetForm()
}

/* ───────────── Validation + save (mirrors legacy addTicketPadsfrm.validate rules) ───────────── */
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  formError.value = ''
  let ok = true
  if (!form.issuedDate)            { errors.issuedDate = 'Please select Issue Date'; ok = false }
  if (form.startNum === null || form.startNum === '' || isNaN(form.startNum) || form.startNum < 0) {
    errors.startNum = 'Please enter Pad Start Number'; ok = false
  }
  if (form.endNum === null || form.endNum === '' || isNaN(form.endNum) || form.endNum < 0) {
    errors.endNum = 'Please enter Pad End Number'; ok = false
  }
  if (Number.isFinite(form.startNum) && Number.isFinite(form.endNum) && Number(form.endNum) <= Number(form.startNum)) {
    errors.endNum = 'Pad End Number must be greater than Pad Start Number'; ok = false
  }
  if (!form.case_type_id) { errors.case_type_id = 'Please select Case Type'; ok = false }
  if (!form.issuedBy)     { errors.issuedBy     = 'Please select Issued By'; ok = false }
  if (!form.issuedTo)     { errors.issuedTo     = 'Please select Issued To'; ok = false }
  if (!ok) formError.value = 'Please correct the highlighted fields'
  return ok
}

/* ───────────── Real-time error clearing (errors appear on submit, disappear as user fixes) ───────────── */
function _clearBannerIfDone() {
  if (Object.keys(errors).length === 0) formError.value = ''
}

watch(() => form.issuedDate, (v) => {
  if (errors.issuedDate && v) { delete errors.issuedDate; _clearBannerIfDone() }
})

watch(() => form.case_type_id, (v) => {
  if (errors.case_type_id && v) { delete errors.case_type_id; _clearBannerIfDone() }
})

watch(() => form.issuedBy, (v) => {
  if (errors.issuedBy && v) { delete errors.issuedBy; _clearBannerIfDone() }
})

watch(() => form.issuedTo, (v) => {
  if (errors.issuedTo && v) { delete errors.issuedTo; _clearBannerIfDone() }
})

watch(() => form.startNum, (v) => {
  const n = Number(v)
  if (errors.startNum && v !== null && v !== '' && !isNaN(n) && n >= 0)
    delete errors.startNum
  if (errors.endNum && Number.isFinite(n) && n >= 0 && Number.isFinite(Number(form.endNum)) && Number(form.endNum) > n)
    delete errors.endNum
  _clearBannerIfDone()
})

watch(() => form.endNum, (v) => {
  if (errors.endNum) {
    const end = Number(v)
    const start = Number(form.startNum)
    const validValue = v !== null && v !== '' && !isNaN(end) && end >= 0
    const validRange = !Number.isFinite(start) || end > start
    if (validValue && validRange) delete errors.endNum
  }
  _clearBannerIfDone()
})

function uuid() {
  return (crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2))
}


function denormalise(payload) {
  const ct = findCaseType(payload.case_type_id)
  const issuer = findIssuer(payload.issuedBy)
  const to = findUser(payload.issuedTo)
  const enteredBy = findUser(payload.CreatedBy)
  return {
    code: ct?.code ?? '',
    issuedbyuser: issuer?.lookup_data_value ?? '',
    issuedtouser: to?.Username ?? '',
    FirstName: to?.FirstName ?? '',
    Surname: to?.Surname ?? '',
    enteredbyname: enteredBy?.Username ?? ''
  }
}

async function saveTicketPad() {
  if (!validate()) return

  const startNum = Number(form.startNum)
  const endNum = Number(form.endNum)
  const total = endNum - startNum + 1

  if (modalMode.value === 'add') {
    const base = {
      case_type_id: form.case_type_id,
      issuedBy: form.issuedBy,
      issuedTo: form.issuedTo,
      issuedDate: form.issuedDate,
      startNum,
      endNum,
      Totaltickets: total,
      Issuedtickets: 0,
      Firstused: null,
      Lastused: null,
      active: 1,
      CreatedBy: form.entered_by,
      CreatedDT: new Date().toISOString()
    }
    await store.createPad({ ...base, ...denormalise(base) })
  } else if (modalMode.value === 'edit') {
    const existing = pads.value.find(p => p.ticket_pad_id === form.ticket_pad_id)
    if (existing) {
      const base = {
        ...existing,
        case_type_id: form.case_type_id,
        issuedBy: form.issuedBy,
        issuedTo: form.issuedTo,
        issuedDate: form.issuedDate,
        startNum,
        endNum,
        Totaltickets: total,
        active: form.disabledFlag ? 0 : 1
      }
      await store.updatePad(form.ticket_pad_id, { ...base, ...denormalise(base) })
    }
  }
  closeModal()
}
</script>

<style scoped>
.req { color: var(--danger); margin-left: 2px; }

.toggle-row {
  display: flex; align-items: center; gap: 24px;
  padding: 10px 14px;
  background: var(--primary-tint);
  border-radius: var(--radius);
}
.toggle-cell {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--text-default);
  cursor: pointer;
}

.ticket-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
  transition: opacity var(--transition);
}
.ticket-grid.is-dimmed { opacity: 0.4; pointer-events: none; }
.ticket-col { display: flex; flex-direction: column; gap: 14px; }

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
.modal-sm { max-width: 460px; }
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
.modal-body { padding: 20px; overflow-y: auto; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-page);
  align-items: center;
}

@media (max-width: 720px) {
  .ticket-grid { grid-template-columns: 1fr; }
}
</style>
