<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Add New Case</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Add New Case</span>
      </div>
    </div>

    <!-- BASIC INFORMATION -->
    <div class="card card-padded mb-lg">
      <div class="card-section-head">
        <div class="card-title" style="margin-bottom:0">Basic Information</div>
        <button class="collapse-btn" @click="basicOpen = !basicOpen" :aria-expanded="basicOpen" aria-label="Toggle basic information">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="{ transform: basicOpen ? 'none' : 'rotate(-90deg)' }">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      <div v-show="basicOpen" class="basic-body">
        <div class="form-row-left">
          <label class="form-label-left">Case Type<span class="req">*</span></label>
          <select v-model="form.caseType">
            <option value="">Please select Case</option>
            <option v-for="t in caseTypes" :key="t" :value="t">{{ t }}</option>
          </select>

          <label class="form-label-left">Offence Date<span class="req">*</span></label>
          <input v-model="form.offenceDate" type="date" />

          <label class="form-label-left">Case Issuer<span class="req">*</span></label>
          <input v-model="form.caseIssuer" type="text" placeholder="Case Issuer" maxlength="100" />
        </div>

        <div class="manual-ref-row">
          <label class="form-label-left">Manual Case Ref</label>
          <input v-model="form.manualCaseRef" type="checkbox" />
        </div>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="tabs">
      <button v-for="t in tabs" :key="t.id" class="tab" :class="{ active: activeTab === t.id }" @click="activeTab = t.id">
        {{ t.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="card card-padded tab-pane">
      <!-- CUSTOMER DETAILS -->
      <div v-show="activeTab === 'customer'">
        <div class="two-col">
          <fieldset class="legend-group">
            <legend>Customer</legend>

            <div class="form-row-left">
              <label class="form-label-left">Title</label>
              <select v-model="form.title">
                <option value="">Please Select Title</option>
                <option v-for="t in titles" :key="t" :value="t">{{ t }}</option>
              </select>

              <label class="form-label-left">First name</label>
              <input v-model="form.firstName" type="text" maxlength="50" />

              <label class="form-label-left">Last Name</label>
              <input v-model="form.lastName" type="text" maxlength="50" />

              <label class="form-label-left">Date of Birth</label>
              <input v-model="form.dob" type="date" />

              <label class="form-label-left">Age</label>
              <input v-model.number="form.age" type="number" min="0" max="120" />

              <label class="form-label-left">Gender</label>
              <div class="radio-row">
                <label class="radio-item"><input type="radio" v-model="form.gender" value="Male" /> Male</label>
                <label class="radio-item"><input type="radio" v-model="form.gender" value="Female" /> Female</label>
                <label class="radio-item"><input type="radio" v-model="form.gender" value="Other" /> Other</label>
              </div>

              <label class="form-label-left">Telephone</label>
              <input v-model="form.telephone" type="tel" maxlength="20" />

              <label class="form-label-left">Mobile Telephone</label>
              <input v-model="form.mobileTelephone" type="tel" placeholder="Mobile Number" maxlength="20" />

              <label class="form-label-left">E-mail Address</label>
              <input v-model="form.email" type="email" maxlength="100" />

              <label class="form-label-left">Employment Status</label>
              <select v-model="form.employmentStatus">
                <option value="">Please Select</option>
                <option v-for="e in employmentStatuses" :key="e" :value="e">{{ e }}</option>
              </select>

              <label class="form-label-left">Parent/Guardian</label>
              <input v-model="form.parentGuardian" type="text" maxlength="100" />
            </div>

            <button class="btn-action-green mt-md" @click="openAddDescription">ADD DESCRIPTION</button>
          </fieldset>

          <div class="right-stack">
            <fieldset class="legend-group">
              <legend>Address</legend>
              <div class="form-row-left">
                <label class="form-label-left">Postcode</label>
                <div class="input-with-icon">
                  <input v-model="form.postcode" type="text" placeholder="Postcode" maxlength="20" />
                  <span class="help-icon" title="Postcode lookup">?</span>
                </div>

                <label class="form-label-left">Address 1</label>
                <input v-model="form.address1" type="text" placeholder="Address 1" maxlength="100" />

                <label class="form-label-left">Address 2</label>
                <input v-model="form.address2" type="text" placeholder="Address 2" maxlength="100" />

                <label class="form-label-left">Town</label>
                <input v-model="form.town" type="text" placeholder="Town" maxlength="100" />
              </div>
              <div class="flex gap-sm mt-md" style="justify-content: space-between">
                <button class="btn-action-green" @click="enterAddressSearchReference">ENTER ADDRESS SEARCH REFERENCE</button>
                <button class="btn-action-green" @click="performAddressSearch">PERFORM ADDRESS SEARCH</button>
              </div>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Manual Verification</legend>
              <div class="form-row-left">
                <label class="form-label-left">Verification Type</label>
                <select v-model="form.verificationType">
                  <option value="">Please Select Verification Type</option>
                  <option v-for="v in verificationTypes" :key="v" :value="v">{{ v }}</option>
                </select>

                <label class="form-label-left">Verification Notes</label>
                <input v-model="form.verificationNotes" type="text" placeholder="Verification Note" maxlength="200" />
              </div>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Customer Signature</legend>
              <div class="form-row-left">
                <label class="form-label-left">Customer Signature</label>
                <select v-model="form.customerSignature">
                  <option value="">Please select an option</option>
                  <option v-for="s in signatureOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- JOURNEY DETAILS -->
      <div v-show="activeTab === 'journey'">
        <div class="two-col">
          <div class="form-row-left">
            <label class="form-label-left">Place</label>
            <input v-model="form.place" type="text" placeholder="Place" maxlength="100" />

            <label class="form-label-left">Journey From</label>
            <input v-model="form.journeyFrom" type="text" placeholder="Journey From" maxlength="100" />

            <label class="form-label-left">Journey To</label>
            <input v-model="form.journeyTo" type="text" placeholder="Journey To" maxlength="100" />

            <label class="form-label-left">Time &amp; Date of Travel</label>
            <input v-model="form.timeDateOfTravel" type="datetime-local" />

            <label class="form-label-left">Train Service Id</label>
            <input v-model="form.trainServiceId" type="text" placeholder="Train Service Id" maxlength="50" />
          </div>

          <div class="form-row-left">
            <label class="form-label-left">Smartcard Number</label>
            <input v-model="form.smartcardNumber" type="text" placeholder="Card Number" maxlength="50" />

            <label class="form-label-left">Fare Travelled</label>
            <div class="input-currency">
              <span class="prefix">£</span>
              <input v-model.number="form.fareTravelled" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>

            <label class="form-label-left">Fare Paid</label>
            <div class="input-currency">
              <span class="prefix">£</span>
              <input v-model.number="form.farePaid" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>

            <label class="form-label-left outstanding-label">Outstanding</label>
            <div class="input-currency">
              <span class="prefix">£</span>
              <input :value="outstanding" type="text" readonly class="field-readonly" />
            </div>
          </div>
        </div>
      </div>

      <!-- NOTES -->
      <div v-show="activeTab === 'notes'">
        <div class="flex" style="justify-content: flex-end; margin-bottom: 12px">
          <button class="btn-action-green" @click="addNote">ADD</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Author</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in notes" :key="n.id">
                <td>{{ n.datetime }}</td>
                <td>{{ n.author }}</td>
                <td>{{ n.note }}</td>
              </tr>
              <tr v-if="notes.length === 0">
                <td colspan="3">
                  <div class="empty-state">
                    <p class="empty-state-desc">No notes added.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ATTACHMENTS -->
      <div v-show="activeTab === 'attachments'">
        <div class="flex gap-sm" style="margin-bottom: 12px">
          <button class="btn-action-light" :disabled="selectedAttachments.length === 0" @click="openAttach">OPEN ATTACH</button>
          <button class="btn-action-green" @click="addAttach">ADD ATTACH</button>
          <button class="btn-action-red" :disabled="selectedAttachments.length === 0" @click="deleteAttach">DELETE ATTACH</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon">
                  <input
                    type="checkbox"
                    :checked="allAttachmentsSelected"
                    :indeterminate.prop="someAttachmentsSelected"
                    @change="toggleAllAttachments"
                    aria-label="Select all attachments"
                  />
                </th>
                <th>Date&amp;time</th>
                <th>Uploader</th>
                <th>Filename</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in attachments" :key="a.id">
                <td class="col-icon">
                  <input
                    type="checkbox"
                    :checked="selectedAttachments.includes(a.id)"
                    @change="toggleAttachment(a.id)"
                  />
                </td>
                <td>{{ a.datetime }}</td>
                <td>{{ a.uploader }}</td>
                <td>{{ a.filename }}</td>
                <td>{{ a.size }}</td>
              </tr>
              <tr v-if="attachments.length === 0">
                <td colspan="5">
                  <div class="empty-state">
                    <p class="empty-state-desc">No attachments uploaded.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Next button (hidden on last tab) -->
      <div v-if="activeTab !== 'attachments'" class="flex" style="justify-content: flex-end; margin-top: 16px">
        <button class="btn-next" @click="goNext">NEXT</button>
      </div>
    </div>

    <!-- ADD THIS CASE button -->
    <div class="flex" style="justify-content: flex-end; margin-top: 16px">
      <button class="btn-add-case" @click="addThisCase">ADD THIS CASE</button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const caseTypes = ['PFN', 'UFN', 'PCN', 'MG11', 'MICS', 'FT', 'MG', 'PF']
const titles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']
const employmentStatuses = ['Employed', 'Self-employed', 'Unemployed', 'Student', 'Retired']
const verificationTypes = ['Passport', 'Driving License', 'Bank Statement', 'Utility Bill']
const signatureOptions = ['Signed', 'Not signed', 'Refused']

const tabs = [
  { id: 'customer',    label: 'CUSTOMER DETAILS' },
  { id: 'journey',     label: 'JOURNEY DETAILS' },
  { id: 'notes',       label: 'NOTES' },
  { id: 'attachments', label: 'ATTACHMENTS' }
]
const activeTab = ref('customer')
const basicOpen = ref(true)

const form = reactive({
  // Basic Information
  caseType: '',
  offenceDate: '',
  caseIssuer: '',
  manualCaseRef: false,

  // Customer
  title: '',
  firstName: '',
  lastName: '',
  dob: '',
  age: null,
  gender: '',
  telephone: '',
  mobileTelephone: '',
  email: '',
  employmentStatus: '',
  parentGuardian: '',

  // Address
  postcode: '',
  address1: '',
  address2: '',
  town: '',

  // Manual Verification
  verificationType: '',
  verificationNotes: '',

  // Customer Signature
  customerSignature: '',

  // Journey
  place: '',
  journeyFrom: '',
  journeyTo: '',
  timeDateOfTravel: '',
  trainServiceId: '',
  smartcardNumber: '',
  fareTravelled: 0,
  farePaid: 0
})

const outstanding = computed(() => {
  const v = (Number(form.fareTravelled) || 0) - (Number(form.farePaid) || 0)
  return v.toFixed(2)
})

// Notes & Attachments — start empty
const notes = ref([])
const attachments = ref([])
const selectedAttachments = ref([])

const allAttachmentsSelected = computed(() =>
  attachments.value.length > 0 && attachments.value.every(a => selectedAttachments.value.includes(a.id))
)
const someAttachmentsSelected = computed(() =>
  selectedAttachments.value.length > 0 && !allAttachmentsSelected.value
)
function toggleAttachment(id) {
  const idx = selectedAttachments.value.indexOf(id)
  idx === -1 ? selectedAttachments.value.push(id) : selectedAttachments.value.splice(idx, 1)
}
function toggleAllAttachments() {
  if (allAttachmentsSelected.value) selectedAttachments.value = []
  else selectedAttachments.value = attachments.value.map(a => a.id)
}

function goNext() {
  const idx = tabs.findIndex(t => t.id === activeTab.value)
  if (idx < tabs.length - 1) activeTab.value = tabs[idx + 1].id
}

function addThisCase()              { /* TODO: POST to RevpConfig.addCaseDetails */ }
function openAddDescription()       { /* TODO: open offender description modal */ }
function enterAddressSearchReference() { /* TODO: open address-search-reference modal */ }
function performAddressSearch()     { /* TODO: route to Perform Address Search */ }
function addNote()                  { /* TODO: open add-note modal */ }
function openAttach()               { /* TODO: open selected attachment */ }
function addAttach()                { /* TODO: open add-attachment modal */ }
function deleteAttach()             { /* TODO: delete selected attachments */ }
</script>

<style scoped>
.card-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.collapse-btn {
  width: 24px; height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}
.collapse-btn:hover { background: var(--bg-hover); color: var(--text-strong); }
.collapse-btn svg { transition: transform var(--transition); }

.basic-body { display: flex; flex-direction: column; gap: 14px; }

.tab-pane {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 1100px) { .two-col { grid-template-columns: 1fr; } }

.right-stack { display: flex; flex-direction: column; gap: 16px; }

.legend-group {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px 16px;
}
.legend-group legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.form-row-left {
  display: grid;
  grid-template-columns: 160px 1fr;
  row-gap: 12px;
  column-gap: 14px;
  align-items: center;
}
.form-label-left {
  font-size: 13px;
  color: var(--text-default);
  font-weight: 500;
}
.req { color: var(--danger); margin-left: 2px; }

.manual-ref-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 4px;
}
.manual-ref-row input[type='checkbox'] { width: 14px; }

.radio-row { display: flex; gap: 14px; align-items: center; }
.radio-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-default);
}

.input-with-icon { position: relative; }
.input-with-icon input { padding-right: 36px; }
.help-icon {
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  width: 18px; height: 18px;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  cursor: help;
}

.input-currency {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.input-currency:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}
.input-currency .prefix {
  padding: 0 10px;
  background: var(--bg-page);
  color: var(--text-muted);
  font-size: 13px;
  align-self: stretch;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border);
}
.input-currency input {
  border: none;
  border-radius: 0;
  flex: 1;
}
.input-currency input:focus { box-shadow: none; }

.outstanding-label { color: var(--danger); font-weight: 600; }

.field-readonly {
  background: var(--bg-page);
  color: var(--text-strong);
  cursor: default;
}

/* Action buttons */
.btn-action-green {
  padding: 7px 16px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-action-green:hover:not(:disabled) { background: #128968; }
.btn-action-green:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-action-light {
  padding: 7px 16px;
  background: #d1ede0;
  color: #15a982;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}
.btn-action-light:hover:not(:disabled) { background: #15a982; color: #fff; }
.btn-action-light:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-action-red {
  padding: 7px 16px;
  background: #fee2e2;
  color: var(--danger);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all var(--transition);
}
.btn-action-red:hover:not(:disabled) { background: var(--danger); color: #fff; }
.btn-action-red:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-next {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-next:hover { background: #128968; }

.btn-add-case {
  padding: 10px 28px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-add-case:hover { background: #128968; }

@media (max-width: 720px) {
  .form-row-left { grid-template-columns: 1fr; }
  .form-label-left { margin-bottom: -6px; }
}
</style>
