<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Remove Case Completely</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Remove Case Completely</span>
      </div>
    </div>

    <div class="alert alert-danger mb-lg" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div>
        <strong>Destructive operation.</strong>
        Removing a case is permanent. All linked records (actions, payments, letters, attachments, audit log) will be cascaded and cannot be recovered. Use this only when legally required (e.g. GDPR erasure requests).
      </div>
    </div>

    <div class="card card-padded mb-lg">
      <div class="card-title">Find case to remove</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Number <span class="req">*</span></label>
          <input v-model.trim="caseNumber" type="text" placeholder="e.g. UFN/000000123" @input="lookupResult=null" />
          <span v-if="lookupError" class="form-error">{{ lookupError }}</span>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="lookup">Find case</button>
        <button class="btn btn-secondary btn-sm" @click="caseNumber='';lookupResult=null;lookupError=''">Clear</button>
      </div>
    </div>

    <div v-if="lookupResult" class="card card-padded">
      <div class="card-title">Case to be removed</div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Case Number</label><input :value="lookupResult.case_number" disabled /></div>
        <div class="form-group"><label class="form-label">Case Type</label><input :value="lookupResult.case_type" disabled /></div>
        <div class="form-group"><label class="form-label">Offender</label><input :value="lookupResult.offender" disabled /></div>
        <div class="form-group"><label class="form-label">Offence Date</label><input :value="lookupResult.offence_date" disabled /></div>
        <div class="form-group"><label class="form-label">Status</label><input :value="lookupResult.status" disabled /></div>
        <div class="form-group"><label class="form-label">Linked Records</label><input :value="`${lookupResult.linked_actions} actions · ${lookupResult.linked_payments} payments · ${lookupResult.linked_letters} letters`" disabled /></div>
      </div>

      <div class="form-group mt-lg">
        <label class="form-label">To confirm permanent removal, type the case number below <span class="req">*</span></label>
        <input v-model.trim="typedConfirm" type="text" :placeholder="lookupResult.case_number" />
      </div>

      <div class="flex gap-sm mt-md" style="justify-content:flex-end">
        <button class="btn btn-secondary" @click="cancel">Cancel</button>
        <button class="btn btn-danger" :disabled="typedConfirm !== lookupResult.case_number" @click="confirmRemove">Remove case permanently</button>
      </div>
    </div>

    <div v-if="removed" class="alert alert-success mb-lg" role="alert">
      <strong>Case {{ removed }} has been permanently removed.</strong>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// Mock cases for lookup
const knownCases = [
  { case_number: 'UFN/000000123', case_type: 'UFN', offender: 'John Doe',     offence_date: '2026-04-12', status: 'Closed', linked_actions: 4, linked_payments: 1, linked_letters: 3 },
  { case_number: 'PFN/000000077', case_type: 'PFN', offender: 'Jane Smith',   offence_date: '2026-03-04', status: 'In progress', linked_actions: 2, linked_payments: 0, linked_letters: 1 },
  { case_number: 'PCN/000000050', case_type: 'PCN', offender: 'Acme Logistics', offence_date: '2026-01-15', status: 'Withdrawn', linked_actions: 5, linked_payments: 0, linked_letters: 4 }
]

const caseNumber = ref('')
const lookupResult = ref(null)
const lookupError = ref('')
const typedConfirm = ref('')
const removed = ref('')

function lookup() {
  lookupError.value = ''
  removed.value = ''
  if (!caseNumber.value) {
    lookupError.value = 'Please enter a case number'
    return
  }
  const found = knownCases.find(c => c.case_number.toLowerCase() === caseNumber.value.toLowerCase())
  if (!found) {
    lookupError.value = 'Case not found'
    lookupResult.value = null
    return
  }
  lookupResult.value = { ...found }
  typedConfirm.value = ''
}

function cancel() {
  lookupResult.value = null
  typedConfirm.value = ''
  removed.value = ''
}

function confirmRemove() {
  if (!lookupResult.value || typedConfirm.value !== lookupResult.value.case_number) return
  removed.value = lookupResult.value.case_number
  lookupResult.value = null
  typedConfirm.value = ''
  caseNumber.value = ''
}
</script>

<style scoped>
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  border: 1px solid;
}
.alert-danger { background: var(--danger-bg); color: var(--danger); border-color: #fecaca; }
.alert-success { background: var(--success-bg); color: var(--success); border-color: #bbf7d0; }
.req { color: var(--danger); margin-left: 2px; }
@media (max-width: 720px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
