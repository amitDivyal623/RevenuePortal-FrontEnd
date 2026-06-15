<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Action Tracker</h1></div>
      <div class="breadcrumb"><a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Actions</span></div>
    </div>

    <!-- ── Filters card ───────────────────────────────────────────────── -->
    <div class="card card-padded mb-md">
      <div class="card-title">ACTION TRACKER FILTERS</div>

      <div class="filters-grid">
        <!-- Row 1 col 1 — Status (chip multi-select) -->
        <div class="form-group">
          <label class="form-label">Status</label>
          <ChipMultiSelect
            v-model="filterStatusIds"
            :options="statusOptions"
            placeholder="Select status"
          />
        </div>

        <!-- Row 1 col 2 — Action (text) -->
        <div class="form-group">
          <label class="form-label">Action</label>
          <input v-model.trim="filterActionName" placeholder="Action" />
        </div>

        <!-- Row 1 col 3 — Owner (single) -->
        <div class="form-group">
          <label class="form-label">Owner</label>
          <select v-model="filterOwner">
            <option value="">Select</option>
            <option v-for="o in holderOwnerOptions" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
          </select>
        </div>

        <!-- Row 2 col 1 — Case Type (chip multi-select) -->
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <ChipMultiSelect
            v-model="filterCaseTypeIds"
            :options="caseTypeOptions"
            placeholder="Click to add"
          />
        </div>

        <!-- Row 2 col 2 — Holder (single) -->
        <div class="form-group">
          <label class="form-label">Holder</label>
          <select v-model="filterHolder">
            <option value="">Select</option>
            <option v-for="o in holderOwnerOptions" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
          </select>
        </div>

        <!-- Row 2 col 3 — Correspondence -->
        <div class="form-group">
          <label class="form-label">Correspondence Type</label>
          <select v-model="filterCorrespondence">
            <option value="">Please Select</option>
            <option value="email">Email</option>
            <option value="letter">Letter</option>
          </select>
        </div>

        <!-- Row 3 col 1 — Saved filter (deferred) -->
        <div class="form-group">
          <label class="form-label">Saved case list filters</label>
          <select v-model="filterSavedId" disabled title="Saved filters coming in a later phase">
            <option value="">Select Saved case list Filter</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" @click="onSearch">SEARCH</button>
        <button class="btn btn-danger" @click="onReset">RESET</button>
      </div>
    </div>

    <!-- ── Action Tracker table card ──────────────────────────────────── -->
    <div class="card card-padded">
      <div class="card-title">ACTION TRACKER</div>

      <!-- Actions toolbar -->
      <fieldset class="actions-fieldset">
        <legend>Actions</legend>
        <div class="actions-toolbar">
          <button class="btn btn-primary" :disabled="selectedCount === 0" @click="onOpenCase">OPEN CASE</button>
          <button class="btn btn-primary" :disabled="selectedCount === 0 || busy" @click="onCloseAndAction">CLOSE &amp; ACTION</button>
          <button class="btn btn-primary" :disabled="selectedCount === 0 || busy" @click="openCourtModal">ASSIGN COURT BOOKINGS</button>
          <button class="btn btn-primary" :disabled="selectedCount === 0 || busy" @click="openLetterModal">CREATE LETTER</button>
          <button class="btn btn-primary" :disabled="selectedCount === 0 || busy" @click="onPrintLabel">PRINT LABEL</button>
          <button class="btn btn-primary" @click="onExport">EXPORT ACTION TRACKER LIST</button>
        </div>
      </fieldset>

      <div class="flex justify-between items-center mb-sm flex-wrap gap-sm">
        <div class="flex items-center gap-sm">
          <select v-model.number="pageSize" @change="onPageSizeChange" style="width:64px;padding:4px 8px;font-size:12px">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span class="text-light" style="font-size:0.85em">records per page</span>
          <span class="text-light" style="font-size:0.85em">
            <span style="margin:0 6px">·</span>
            <span v-if="loading">loading…</span>
            <span v-else>updated at {{ updatedAt }}</span>
          </span>
        </div>
        <div class="text-light" style="font-size:0.85em" v-if="selectedCount > 0">
          {{ selectedCount }} selected
        </div>
      </div>

      <div v-if="apiError" class="error-banner">{{ apiError }}</div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:32px">
                <input type="checkbox" :checked="allPageSelected" @change="toggleSelectAll" />
              </th>
              <th @click="setSort('case__case_num')" class="sortable">Case No</th>
              <th>Case Type</th>
              <th>Court</th>
              <th>Offender</th>
              <th>Age</th>
              <th @click="setSort('action_name')" class="sortable">Action</th>
              <th @click="setSort('case__case_dt')" class="sortable">Offence Date</th>
              <th @click="setSort('target_dt')" class="sortable">Target Date</th>
              <th>Actioned</th>
              <th @click="setSort('action_status__status_desc')" class="sortable">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!loading && rows.length === 0">
              <td colspan="11" class="text-center text-light" style="padding:24px">No actions match the current filters.</td>
            </tr>
            <tr v-for="row in rows" :key="row.action_id" :class="{ 'row-selected': selectedActionIds.has(row.action_id) }">
              <td>
                <input type="checkbox"
                       :checked="selectedActionIds.has(row.action_id)"
                       @change="toggleRow(row)" />
              </td>
              <td>
                <router-link :to="`/cases/${row.case_id}`" class="link-cell">{{ row.case_num || '—' }}</router-link>
              </td>
              <td>{{ row.case_type_code || '—' }}</td>
              <td>{{ row.court_name || '—' }}</td>
              <td>{{ row.offender || '—' }}</td>
              <td>{{ row.customer_age ?? '—' }}</td>
              <td>{{ row.action_name || '—' }}</td>
              <td>{{ fmtDate(row.case_dt) }}</td>
              <td :class="row.is_overdue ? 'overdue' : ''">{{ fmtDate(row.target_dt) }}</td>
              <td>{{ fmtDate(row.actioned_dt) || '—' }}</td>
              <td>
                <span :class="`badge badge-${statusColor(row.is_overdue ? 'OVERDUE' : row.action_status_desc)}`">
                  {{ row.is_overdue ? 'OVERDUE' : (row.action_status_desc || '—') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center mt-md" v-if="total > 0">
        <div class="text-light" style="font-size:0.85em">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
        </div>
        <div class="flex items-center gap-sm">
          <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">‹ Prev</button>
          <span style="font-size:0.85em">Page {{ page }} / {{ totalPages }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Next ›</button>
        </div>
      </div>
    </div>

    <!-- ── ASSIGN COURT BOOKINGS modal ─────────────────────────────────── -->
    <div v-if="courtModalOpen" class="modal-backdrop" @click.self="closeCourtModal">
      <div class="modal-card" style="width:640px">
        <div class="modal-header">
          <h3>Assign Court Bookings</h3>
          <button class="modal-x" @click="closeCourtModal">×</button>
        </div>
        <div class="modal-body" style="max-height:60vh;overflow:auto">
          <p v-if="courtModal.loading" class="text-light">Loading court options…</p>
          <p v-else-if="courtModal.groups.length === 0" class="text-light">
            No selected case has a court assigned with an unbooked slot to pick.
            (Cases must have <code>court_id</code> set and <code>court_booking_id</code> empty.)
          </p>
          <div v-for="g in courtModal.groups" :key="g.court_id" class="court-group">
            <div class="court-group-head">{{ g.court_name || g.court_id }}</div>
            <div class="court-group-body">
              <div class="court-group-cases">
                <div class="text-light" style="font-size:0.8em">Cases ({{ g.cases.length }})</div>
                <ul>
                  <li v-for="c in g.cases" :key="c.case_id">{{ c.case_num }}</li>
                </ul>
              </div>
              <div class="court-group-slot">
                <label class="form-label">Booking slot</label>
                <select v-model="courtModal.choice[g.court_id]">
                  <option value="">— No slot —</option>
                  <option v-for="b in g.bookings" :key="b.court_booking_id" :value="b.court_booking_id">
                    {{ fmtDateTime(b.start_dt) }} · cap {{ b.capacity }} · {{ b.duration }}min
                  </option>
                </select>
                <p v-if="!g.bookings.length" class="text-light" style="font-size:0.8em;margin-top:6px">
                  No bookings configured for this court.
                </p>
              </div>
            </div>
          </div>
          <div v-if="courtModalError" class="error-banner">{{ courtModalError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCourtModal" :disabled="courtModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitCourtAssignment"
                  :disabled="courtModal.saving || !anyCourtChoiceMade">
            {{ courtModal.saving ? 'Assigning…' : 'Assign selected slots' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── CREATE LETTER modal ─────────────────────────────────────────── -->
    <div v-if="letterModalOpen" class="modal-backdrop" @click.self="closeLetterModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Letter</h3>
          <button class="modal-x" @click="closeLetterModal">×</button>
        </div>
        <div class="modal-body">
          <p class="text-light" style="margin:0 0 12px 0">
            Queues the chosen letter for <strong>{{ uniqueSelectedCaseCount }}</strong> case<span v-if="uniqueSelectedCaseCount !== 1">s</span>.
          </p>
          <div class="form-group">
            <label class="form-label">Letter template *</label>
            <select v-model="letterModal.templateId" :disabled="letterTemplatesLoading">
              <option value="">
                {{ letterTemplatesLoading ? 'Loading templates…' : 'Select a template…' }}
              </option>
              <option v-for="t in letterTemplates" :key="t.letter_template_id" :value="t.letter_template_id">
                {{ t.title }}
              </option>
            </select>
            <p v-if="!letterTemplatesLoading && letterTemplates.length === 0"
               class="text-light" style="font-size:0.8rem;margin:4px 0 0">
              No letter template is valid for every case type you selected.
              Tick rows of a single type, or ask an admin to map a template to this combination.
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">Copies</label>
            <input v-model.number="letterModal.copies" type="number" min="1" max="50" style="width:100px" />
          </div>
          <div class="form-group">
            <label class="form-label">Language</label>
            <input v-model.trim="letterModal.language" placeholder="English" />
          </div>
          <div v-if="letterModalError" class="error-banner">{{ letterModalError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeLetterModal" :disabled="letterModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitLetter"
                  :disabled="!letterModal.templateId || letterModal.saving">
            {{ letterModal.saving ? 'Queuing…' : 'Queue letter' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { actionsService } from '@/services/actions.service.js'
import { caseTypesService } from '@/services/case-types.service.js'
import { api, apiDownload, apiDownloadPost } from '@/services/api.js'

// ── Inline ChipMultiSelect component ─────────────────────────────────────
// Renders selected items as removable chips + a single dropdown to add more.
// Defined inline so we don't need a separate file for this one screen.
const ChipMultiSelect = {
  name: 'ChipMultiSelect',
  props: {
    modelValue: { type: Array, required: true },     // array of ids
    options:    { type: Array, required: true },     // [{ id, label }]
    placeholder:{ type: String, default: 'Select' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const pending = ref('')
    const selectedSet = computed(() => new Set(props.modelValue))
    const selectedOptions = computed(() =>
      props.modelValue
        .map(id => props.options.find(o => o.id === id))
        .filter(Boolean)
    )
    const remaining = computed(() => props.options.filter(o => !selectedSet.value.has(o.id)))
    function add() {
      if (!pending.value) return
      emit('update:modelValue', [...props.modelValue, pending.value])
      pending.value = ''
    }
    function remove(id) {
      emit('update:modelValue', props.modelValue.filter(x => x !== id))
    }
    return () => h('div', { class: 'chip-multi-select' }, [
      h('div', { class: 'chip-row' }, [
        ...selectedOptions.value.map(o =>
          h('span', { class: 'chip' }, [
            h('button', {
              class: 'chip-x',
              type: 'button',
              onClick: () => remove(o.id),
            }, '×'),
            ' ',
            o.label,
          ])
        ),
        h('select', {
          class: 'chip-picker',
          value: pending.value,
          onChange: e => { pending.value = e.target.value; add() },
        }, [
          h('option', { value: '' }, props.placeholder),
          ...remaining.value.map(o => h('option', { value: o.id }, o.label)),
        ]),
      ]),
    ])
  },
}

// ── State ────────────────────────────────────────────────────────────────
const rows         = ref([])
const total        = ref(0)
const page         = ref(1)
const pageSize     = ref(50)
const ordering     = ref('-case__case_dt')
const loading      = ref(false)
const busy         = ref(false)
const apiError     = ref('')
const updatedAt    = ref('')

const filterStatusIds       = ref([])
const filterCaseTypeIds     = ref([])
const filterActionName      = ref('')
const filterHolder          = ref('')
const filterOwner           = ref('')
const filterCorrespondence  = ref('')
const filterSavedId         = ref('')

// Reference data
const statuses          = ref([])
const caseTypes         = ref([])
const holderOwnerOptions = ref([])

const selectedActionIds = reactive(new Set())
const selectedCaseIds   = reactive(new Map())  // action_id → case_id (for OPEN CASE)

// ── Derived ──────────────────────────────────────────────────────────────
const totalPages    = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const rangeStart    = computed(() => total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1)
const rangeEnd      = computed(() => Math.min(page.value * pageSize.value, total.value))
const selectedCount = computed(() => selectedActionIds.size)

const uniqueSelectedCaseCount = computed(() => new Set([...selectedCaseIds.values()].filter(Boolean)).size)

const statusOptions = computed(() =>
  statuses.value.map(s => ({ id: s.action_status_id, label: s.status_desc }))
)
const caseTypeOptions = computed(() =>
  caseTypes.value.map(c => ({ id: c.case_type_id, label: `${c.code} — ${c.description ?? ''}`.trim() }))
)

const allPageSelected = computed(() =>
  rows.value.length > 0 && rows.value.every(r => selectedActionIds.has(r.action_id))
)

// ── Selection ────────────────────────────────────────────────────────────
function toggleRow(row) {
  if (selectedActionIds.has(row.action_id)) {
    selectedActionIds.delete(row.action_id)
    selectedCaseIds.delete(row.action_id)
  } else {
    selectedActionIds.add(row.action_id)
    selectedCaseIds.set(row.action_id, row.case_id)
  }
}
function toggleSelectAll() {
  if (allPageSelected.value) {
    rows.value.forEach(r => {
      selectedActionIds.delete(r.action_id)
      selectedCaseIds.delete(r.action_id)
    })
  } else {
    rows.value.forEach(r => {
      selectedActionIds.add(r.action_id)
      selectedCaseIds.set(r.action_id, r.case_id)
    })
  }
}
function clearSelection() {
  selectedActionIds.clear()
  selectedCaseIds.clear()
}

// ── Buttons ──────────────────────────────────────────────────────────────
function onOpenCase() {
  // Open each selected case in its own tab. Matches legacy click-each-row behaviour.
  const uniqueCaseIds = new Set(selectedCaseIds.values())
  uniqueCaseIds.forEach(cid => {
    if (cid) window.open(`/cases/${cid}`, '_blank', 'noopener')
  })
}

// ── ASSIGN COURT BOOKINGS modal state ──────────────────────────────────
const courtModalOpen  = ref(false)
const courtModalError = ref('')
const courtModal = reactive({
  loading: false,
  saving:  false,
  groups:  [],    // [{court_id, court_name, cases, bookings}, ...]
  choice:  {},    // court_id -> booking_id
})

const anyCourtChoiceMade = computed(() =>
  Object.values(courtModal.choice).some(v => !!v)
)

async function openCourtModal() {
  const caseIds = [...new Set([...selectedCaseIds.values()].filter(Boolean))]
  if (caseIds.length === 0) return
  courtModalOpen.value  = true
  courtModalError.value = ''
  courtModal.groups     = []
  courtModal.choice     = {}
  courtModal.loading    = true
  try {
    const data = await actionsService.courtBookingOptions(caseIds)
    courtModal.groups = Array.isArray(data) ? data : []
    courtModal.groups.forEach(g => { courtModal.choice[g.court_id] = '' })
  } catch (e) {
    console.error('[court-booking] options load failed', e)
    courtModalError.value = e?.message || 'Failed to load court options.'
  } finally {
    courtModal.loading = false
  }
}

function closeCourtModal() {
  if (courtModal.saving) return
  courtModalOpen.value = false
}

async function submitCourtAssignment() {
  // For each court group with a chosen slot, apply that slot to every
  // case in the group. Legacy semantics — one slot per court, applied
  // to the bundle of cases at that court.
  const assignments = []
  for (const g of courtModal.groups) {
    const bookingId = courtModal.choice[g.court_id]
    if (!bookingId) continue
    g.cases.forEach(c => assignments.push({
      case_id:          c.case_id,
      court_booking_id: bookingId,
    }))
  }
  if (assignments.length === 0) return

  courtModal.saving = true
  courtModalError.value = ''
  try {
    const res = await actionsService.assignCourtBookings(assignments)
    const assigned = res?.assigned ?? 0
    const skipped  = res?.skipped ?? []
    let msg = `Assigned ${assigned} case${assigned === 1 ? '' : 's'} to court bookings`
    if (skipped.length) {
      msg += `, skipped ${skipped.length}`
      console.warn('[court-booking] skipped', skipped)
    }
    window.alert(msg)
    courtModalOpen.value = false
    clearSelection()
    await fetchPage()
  } catch (e) {
    console.error('[court-booking] assign failed', e)
    courtModalError.value = e?.message || 'Assignment failed.'
  } finally {
    courtModal.saving = false
  }
}

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${mi}`
}

// ── CREATE LETTER modal state ──────────────────────────────────────────
const letterModalOpen  = ref(false)
const letterModalError = ref('')
const letterTemplates  = ref([])
const letterTemplatesLoading = ref(false)
// Last set of case_type_ids the template list was fetched for. We re-fetch
// when the operator opens the modal with a different mix.
const letterTemplatesCachedFor = ref('')
const letterModal = reactive({
  templateId: '',
  copies:     1,
  language:   'English',
  saving:     false,
})

async function openLetterModal() {
  if (selectedCount.value === 0) return
  letterModalOpen.value = true
  letterModalError.value = ''
  letterModal.templateId = ''
  letterModal.copies = 1
  letterModal.language = 'English'

  // Derive distinct case_type_ids from the ticked rows so the backend
  // returns only templates valid for ALL selected case types (intersection).
  const tickedActionIds = selectedActionIds
  const caseTypeIds = [
    ...new Set(rows.value.filter(r => tickedActionIds.has(r.action_id))
                          .map(r => r.case_type_id)
                          .filter(Boolean)),
  ]
  const fingerprint = caseTypeIds.slice().sort().join(',')

  if (letterTemplates.value.length === 0 || letterTemplatesCachedFor.value !== fingerprint) {
    letterTemplatesLoading.value = true
    try {
      const data = await actionsService.letterTemplates({ caseTypeIds })
      letterTemplates.value = data?.results ?? (Array.isArray(data) ? data : [])
      letterTemplatesCachedFor.value = fingerprint
    } catch (e) {
      console.error('[create-letter] templates load failed', e)
      letterModalError.value = 'Failed to load letter templates.'
    } finally {
      letterTemplatesLoading.value = false
    }
  }
}

function closeLetterModal() {
  if (letterModal.saving) return
  letterModalOpen.value = false
}

async function submitLetter() {
  if (!letterModal.templateId) return
  const caseIds = [...new Set([...selectedCaseIds.values()].filter(Boolean))]
  if (caseIds.length === 0) return

  letterModal.saving = true
  letterModalError.value = ''
  try {
    const res = await actionsService.createLetter({
      caseIds,
      letterTemplateId: letterModal.templateId,
      copies:           letterModal.copies || 1,
      language:         letterModal.language || 'English',
    })
    const created = res?.created ?? 0
    const skipped = res?.skipped ?? []
    let msg = `Queued ${created} letter${created === 1 ? '' : 's'} for Print Queue`
    if (skipped.length) {
      msg += `, skipped ${skipped.length}`
      console.warn('[create-letter] skipped', skipped)
    }
    window.alert(msg)
    letterModalOpen.value = false
    clearSelection()
    await fetchPage()
  } catch (e) {
    console.error('[create-letter] failed', e)
    letterModalError.value = e?.message || 'Letter queue failed.'
  } finally {
    letterModal.saving = false
  }
}

async function onPrintLabel() {
  // case_ids deduplicated — the selection may have several actions on the
  // same case but each case only needs one label.
  const caseIds = [...new Set([...selectedCaseIds.values()].filter(Boolean))]
  if (caseIds.length === 0) return
  busy.value = true
  apiError.value = ''
  try {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    await apiDownloadPost(
      '/revp/actions/print-label/',
      { case_ids: caseIds },
      `address-labels-${stamp}.pdf`,
    )
  } catch (e) {
    console.error('[print-label] failed', e)
    apiError.value = e?.message || 'PRINT LABEL failed.'
  } finally {
    busy.value = false
  }
}

async function onExport() {
  busy.value = true
  apiError.value = ''
  try {
    const p = new URLSearchParams({ ordering: ordering.value })
    if (filterStatusIds.value.length)   p.set('status',         filterStatusIds.value.join(','))
    if (filterCaseTypeIds.value.length) p.set('case_type',      filterCaseTypeIds.value.join(','))
    if (filterActionName.value.trim())  p.set('action_name',    filterActionName.value.trim())
    if (filterHolder.value)             p.set('holder',         filterHolder.value)
    if (filterOwner.value)              p.set('owner',          filterOwner.value)
    if (filterCorrespondence.value)     p.set('correspondence', filterCorrespondence.value)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    await apiDownload(
      `/revp/actions/tracker/export/?${p.toString()}`,
      `action-tracker-${stamp}.csv`,
    )
  } catch (e) {
    console.error('[export] failed', e)
    apiError.value = e?.message || 'Export failed.'
  } finally {
    busy.value = false
  }
}

async function onCloseAndAction() {
  const ids = [...selectedActionIds]
  if (ids.length === 0) return
  const ok = window.confirm(
    `Close ${ids.length} action${ids.length === 1 ? '' : 's'} and unlock any successors?`
  )
  if (!ok) return

  busy.value = true
  apiError.value = ''
  try {
    const res = await actionsService.closeAndAction(ids)
    const closed = res?.closed ?? 0
    const unlocked = res?.unlocked ?? 0
    const skipped = res?.skipped ?? []
    let msg = `Closed ${closed} action${closed === 1 ? '' : 's'}`
    if (unlocked > 0) msg += `, unlocked ${unlocked} successor${unlocked === 1 ? '' : 's'}`
    if (skipped.length) msg += `, skipped ${skipped.length} (see console)`
    if (skipped.length) console.warn('[close-and-action] skipped', skipped)
    window.alert(msg)
    clearSelection()
    await fetchPage()
  } catch (e) {
    console.error('[close-and-action] failed', e)
    apiError.value = e?.message || 'CLOSE & ACTION failed.'
  } finally {
    busy.value = false
  }
}

// ── Data fetching ────────────────────────────────────────────────────────
async function fetchPage() {
  loading.value = true
  apiError.value = ''
  try {
    const data = await actionsService.tracker({
      page:           page.value,
      pageSize:       pageSize.value,
      ordering:       ordering.value,
      status:         filterStatusIds.value.length    ? filterStatusIds.value.join(',')   : undefined,
      caseType:       filterCaseTypeIds.value.length  ? filterCaseTypeIds.value.join(',') : undefined,
      holder:         filterHolder.value         || undefined,
      owner:          filterOwner.value          || undefined,
      actionName:     filterActionName.value.trim() || undefined,
      correspondence: filterCorrespondence.value || undefined,
    })
    rows.value  = data?.results ?? []
    total.value = data?.total ?? 0
    const now = new Date()
    updatedAt.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  } catch (e) {
    console.error('[action-tracker] fetch failed', e)
    apiError.value = e?.message || 'Failed to load Action Tracker.'
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadReferenceData() {
  try {
    const [s, ct, opts] = await Promise.allSettled([
      actionsService.statuses(),
      caseTypesService.getAll(),
      api.get('/revp/actions/templates/modal-options/'),
    ])
    statuses.value = s.status === 'fulfilled'
      ? (Array.isArray(s.value) ? s.value : (s.value?.results ?? []))
      : []
    caseTypes.value = ct.status === 'fulfilled' ? (ct.value ?? []) : []
    holderOwnerOptions.value = opts.status === 'fulfilled'
      ? (opts.value?.holder_owner_options ?? [])
      : []
  } catch (e) {
    console.warn('[action-tracker] reference data load failed', e)
  }
}

function onSearch() {
  page.value = 1
  clearSelection()
  fetchPage()
}
function onReset() {
  filterStatusIds.value = []
  filterCaseTypeIds.value = []
  filterActionName.value = ''
  filterHolder.value = ''
  filterOwner.value = ''
  filterCorrespondence.value = ''
  filterSavedId.value = ''
  page.value = 1
  clearSelection()
  fetchPage()
}
function onPageSizeChange() {
  page.value = 1
  clearSelection()
  fetchPage()
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  fetchPage()
}
function setSort(field) {
  ordering.value = ordering.value === field ? `-${field}` : field
  fetchPage()
}

// ── Formatting ───────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  return `${dd}/${mm}/${yy}`
}
function statusColor(s) {
  const u = (s || '').toUpperCase()
  if (u === 'OVERDUE') return 'danger'
  if (u === 'OPEN')    return 'info'
  if (u === 'PENDING') return 'warning'
  if (u === 'CLOSED' || u === 'CLOSED & ACTIONED') return 'success'
  return 'neutral'
}

onMounted(async () => {
  await loadReferenceData()
  fetchPage()
})
</script>

<style scoped>
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 24px;
  margin-bottom: 12px;
}
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #e5e7eb);
}
.actions-fieldset {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 4px;
  padding: 8px 12px 12px;
  margin: 8px 0 16px;
}
.actions-fieldset > legend {
  padding: 0 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dim, #6b7280);
}
.actions-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.actions-toolbar .btn {
  background: var(--primary, #0d9488);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 8px 14px;
}
.actions-toolbar .btn[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}
.overdue { color: var(--danger, #b91c1c); font-weight: 600; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: var(--bg-subtle, #f5f7fa); }
.row-selected { background: #eef2ff; }
.error-banner {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 4px;
  font-size: 0.875rem;
}

/* ChipMultiSelect inline styles */
.chip-multi-select { width: 100%; }
.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 6px;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 4px;
  background: #fff;
}
.chip {
  display: inline-flex;
  align-items: center;
  background: #e5e7eb;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
}
.chip-x {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 4px 0 0;
  color: #6b7280;
}
.chip-x:hover { color: #b91c1c; }
.chip-picker {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  padding: 2px 4px;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  border: 1px solid #dc2626;
}
.btn-danger:hover { background: #b91c1c; border-color: #b91c1c; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: #fff;
  border-radius: 6px;
  width: 480px;
  max-width: 92vw;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.modal-header h3 { margin: 0; font-size: 1rem; }
.modal-x {
  border: none; background: transparent;
  font-size: 1.5rem; line-height: 1;
  cursor: pointer; color: #6b7280;
}
.modal-x:hover { color: #b91c1c; }
.modal-body { padding: 16px 18px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--border, #e5e7eb);
  background: #f9fafb;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.court-group {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.court-group-head {
  font-weight: 600;
  margin-bottom: 6px;
}
.court-group-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.court-group-cases ul {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 0.85em;
}
</style>
