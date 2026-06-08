<script setup>
import { ref, reactive, watch } from 'vue'
import { customersService } from '@/services/customers.service.js'
import { addressesService } from '@/services/addresses.service.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  firstName:  { type: String, default: '' },
  lastName:   { type: String, default: '' },
  postcode:   { type: String, default: '' },
  address1:   { type: String, default: '' },
  address2:   { type: String, default: '' },
  town:       { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'pick'])

const loading        = ref(false)
const error          = ref('')
const attempted      = ref(false)
const matchingResults   = ref([])
const sameStreetResults = ref([])
const search = reactive({
  firstName: '', middleName: '', lastName: '',
  postcode: '', address1: '', address2: '', town: '',
})

// ── Postcode lookup ────────────────────────────────────────────────────────────
const _UK_PC_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i

const lookupLoading     = ref(false)
const lookupError       = ref('')
const lookupSuggestions = ref([])
let   _lookupTimer      = null

function onPostcodeInput(val) {
  search.postcode = val
  lookupError.value       = ''
  lookupSuggestions.value = []
  clearTimeout(_lookupTimer)
  if (!_UK_PC_RE.test(val.trim())) return
  _lookupTimer = setTimeout(() => _doLookup(val), 400)
}

async function _doLookup(pc) {
  lookupLoading.value = true
  try {
    const results = await addressesService.lookup(pc)
    lookupSuggestions.value = results.length ? results : []
    if (!results.length) lookupError.value = 'Postcode not found.'
  } catch (e) {
    lookupError.value = e?.data?.detail || e?.message || 'Lookup failed.'
  } finally {
    lookupLoading.value = false
  }
}

function applySuggestion(a) {
  if (a.line_1)   search.address1 = a.line_1
  if (a.line_2)   search.address2 = a.line_2
  if (a.town)     search.town     = a.town
  if (a.postcode) search.postcode = a.postcode
  lookupSuggestions.value = []
  lookupError.value = ''
}

function dismissLookup() {
  lookupSuggestions.value = []
  lookupError.value = ''
}
// ── ────────────────────────────────────────────────────────────────────────────

watch(() => props.modelValue, open => {
  if (!open) return
  search.firstName  = props.firstName
  search.middleName = ''
  search.lastName   = props.lastName
  search.postcode   = props.postcode
  search.address1   = props.address1
  search.address2   = props.address2
  search.town       = props.town
  matchingResults.value   = []
  sameStreetResults.value = []
  lookupSuggestions.value = []
  lookupError.value = ''
  error.value     = ''
  attempted.value = false
})

function close() { emit('update:modelValue', false) }

async function runSearch() {
  loading.value   = true
  error.value     = ''
  attempted.value = true
  try {
    const data = await customersService.search(search)
    matchingResults.value   = data.matching    || []
    sameStreetResults.value = data.same_street || []
  } catch (err) {
    matchingResults.value   = []
    sameStreetResults.value = []
    error.value = err?.data?.detail || err?.message || 'Search failed.'
  } finally {
    loading.value = false
  }
}

function pick(m) {
  emit('pick', m)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="osm-backdrop">
    <div class="osm-panel" role="dialog" aria-modal="true" aria-labelledby="off-modal-title">

      <!-- Header -->
      <div class="osm-head">
        <h2 id="off-modal-title" class="osm-title">Address / Offender Search</h2>
        <button type="button" class="osm-close" aria-label="Close" @click="close">×</button>
      </div>

      <!-- Body: left form + right results -->
      <div class="osm-body">

        <!-- LEFT — search form -->
        <div class="osm-form">
          <fieldset class="osm-fieldset">
            <legend class="osm-legend">Offender Name</legend>
            <div class="osm-fields">
              <label class="osm-label">First Name</label>
              <input class="osm-input" v-model="search.firstName"  type="text" placeholder="First Name"   maxlength="50" />
              <label class="osm-label">Middle Name</label>
              <input class="osm-input" v-model="search.middleName" type="text" placeholder="Middle Name"  maxlength="50" />
              <label class="osm-label">Last Name</label>
              <input class="osm-input" v-model="search.lastName"   type="text" placeholder="Last Name"    maxlength="50" />
            </div>
          </fieldset>

          <fieldset class="osm-fieldset">
            <legend class="osm-legend">Offender Address</legend>
            <div class="osm-fields">
              <label class="osm-label">
                Postcode
                <span v-if="lookupLoading" class="osm-lookup-spinner">looking up…</span>
              </label>
              <div class="osm-postcode-wrap">
                <input
                  class="osm-input"
                  :value="search.postcode"
                  type="text"
                  placeholder="Full postcode (e.g. SW1A 1AA)"
                  maxlength="20"
                  autocomplete="off"
                  @input="onPostcodeInput($event.target.value)"
                />
                <ul v-if="lookupSuggestions.length" class="osm-suggestions">
                  <li
                    v-for="(s, i) in lookupSuggestions"
                    :key="i"
                    class="osm-suggestion-item"
                    @mousedown.prevent="applySuggestion(s)"
                  >{{ s.label }}</li>
                </ul>
              </div>
              <p v-if="lookupError" class="osm-lookup-error">{{ lookupError }}</p>
              <label class="osm-label">Address 1</label>
              <input class="osm-input" v-model="search.address1" type="text" placeholder="Address 1" maxlength="100" />
              <label class="osm-label">Address 2</label>
              <input class="osm-input" v-model="search.address2" type="text" placeholder="Address 2" maxlength="100" />
              <label class="osm-label">Town</label>
              <input class="osm-input" v-model="search.town"     type="text" placeholder="Town"      maxlength="100" @focus="dismissLookup" />
            </div>
          </fieldset>

          <button class="osm-btn osm-btn-search" :disabled="loading" @click="runSearch">
            {{ loading ? 'SEARCHING…' : 'SEARCH' }}
          </button>
        </div>

        <!-- RIGHT — results -->
        <div class="osm-results">

          <div class="osm-result-block">
            <div class="osm-result-title">Matching Results</div>
            <div class="osm-table-wrap">
              <table class="osm-table">
                <thead>
                  <tr><th>Address</th><th>Telephone</th><th>Resident</th><th>Postcode</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(m, i) in matchingResults" :key="'m'+i" class="osm-row-pick" @click="pick(m)">
                    <td>{{ m.address }}</td>
                    <td>{{ m.telephone }}</td>
                    <td>{{ m.resident }}</td>
                    <td>{{ m.postcode }}</td>
                  </tr>
                  <tr v-if="!matchingResults.length">
                    <td colspan="4" class="osm-empty">
                      {{ attempted ? 'No matching customers found.' : 'Enter criteria and click SEARCH.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="osm-result-block">
            <div class="osm-result-title">Offenders At Same Street</div>
            <div class="osm-table-wrap">
              <table class="osm-table">
                <thead><tr><th>Offender</th><th>Address</th></tr></thead>
                <tbody>
                  <tr v-for="(s, i) in sameStreetResults" :key="'s'+i">
                    <td>{{ s.name }}</td>
                    <td>{{ s.address }}</td>
                  </tr>
                  <tr v-if="!sameStreetResults.length">
                    <td colspan="2" class="osm-empty">No nearby offenders.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="osm-result-block">
            <div class="osm-result-title">Electoral Roll Residents</div>
            <div class="osm-table-wrap">
              <table class="osm-table">
                <thead><tr><th>Resident</th><th>Address</th></tr></thead>
                <tbody>
                  <tr><td colspan="2" class="osm-empty">Electoral roll data not available.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <p v-if="error" class="osm-error" role="alert">{{ error }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="osm-foot">
        <button type="button" class="osm-btn osm-btn-cancel" @click="close">CLOSE</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Backdrop ── */
.osm-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  padding: 20px;
}

/* ── Panel ── */
.osm-panel {
  background: #fff;
  border-radius: var(--radius, 6px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
  width: 100%; max-width: 1160px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.osm-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: var(--primary, #1d4ed8);
  color: #fff;
  flex-shrink: 0;
}
.osm-title {
  font-size: 15px; font-weight: 600;
  margin: 0;
}
.osm-close {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: #fff; font-size: 22px; line-height: 1;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background 120ms;
}
.osm-close:hover { background: rgba(255,255,255,0.18); }

/* ── Body ── */
.osm-body {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

/* ── Left: form ── */
.osm-form {
  width: 340px;
  flex-shrink: 0;
  padding: 16px 14px;
  border-right: 1px solid var(--border, #e5e7eb);
  overflow-y: auto;
  display: flex; flex-direction: column;
  gap: 14px;
  background: var(--bg-page, #f8fafc);
}
.osm-fieldset {
  border: 1px solid var(--border, #d1d5db);
  border-radius: var(--radius-sm, 4px);
  padding: 10px 12px;
  margin: 0;
}
.osm-legend {
  font-size: 12px; font-weight: 600;
  color: var(--primary, #1d4ed8);
  padding: 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.osm-fields {
  display: flex; flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.osm-label {
  font-size: 12px; font-weight: 500;
  color: var(--text-muted, #6b7280);
  margin-top: 4px;
}
.osm-label:first-child { margin-top: 0; }
.osm-input {
  padding: 7px 9px;
  font-size: 13px;
  border: 1px solid var(--border, #d1d5db);
  border-radius: var(--radius-sm, 4px);
  outline: none;
  background: #fff;
  color: var(--text-strong, #111827);
  transition: border-color 120ms, box-shadow 120ms;
}
.osm-input:focus {
  border-color: var(--primary, #1d4ed8);
  box-shadow: 0 0 0 3px var(--primary-light, #dbeafe);
}
.osm-postcode-wrap { position: relative; }
.osm-suggestions {
  position: absolute; top: 100%; left: 0; right: 0;
  background: #fff;
  border: 1px solid var(--primary, #1d4ed8);
  border-top: none;
  border-radius: 0 0 var(--radius-sm, 4px) var(--radius-sm, 4px);
  list-style: none; padding: 0; margin: 0;
  z-index: 100;
  max-height: 180px; overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.osm-suggestion-item {
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-default, #374151);
  border-bottom: 1px solid var(--border, #f3f4f6);
}
.osm-suggestion-item:last-child { border-bottom: none; }
.osm-suggestion-item:hover { background: var(--primary-light, #dbeafe); color: var(--primary, #1d4ed8); }
.osm-lookup-spinner {
  font-size: 11px; font-weight: 400;
  color: var(--text-muted, #9ca3af);
  margin-left: 6px;
  font-style: italic;
}
.osm-lookup-error {
  font-size: 12px;
  color: var(--danger, #dc2626);
  margin: 2px 0 0;
}

/* ── Right: results ── */
.osm-results {
  flex: 1;
  padding: 16px 14px;
  overflow-y: auto;
  display: flex; flex-direction: column;
  gap: 16px;
}
.osm-result-block { display: flex; flex-direction: column; gap: 6px; }
.osm-result-title {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-muted, #6b7280);
  border-bottom: 1px solid var(--border, #e5e7eb);
  padding-bottom: 4px;
}
.osm-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: var(--radius-sm, 4px);
}
.osm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.osm-table th {
  padding: 7px 10px;
  background: var(--bg-page, #f8fafc);
  color: var(--text-muted, #6b7280);
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid var(--border, #e5e7eb);
  white-space: nowrap;
}
.osm-table td {
  padding: 7px 10px;
  color: var(--text-default, #374151);
  border-bottom: 1px solid var(--border, #f3f4f6);
}
.osm-table tbody tr:last-child td { border-bottom: none; }
.osm-row-pick { cursor: pointer; }
.osm-row-pick:hover td { background: var(--primary-light, #dbeafe); color: var(--primary, #1d4ed8); }
.osm-empty {
  text-align: center;
  color: var(--text-muted, #9ca3af);
  font-style: italic;
  padding: 14px !important;
}
.osm-error {
  font-size: 13px;
  color: var(--danger, #dc2626);
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm, 4px);
  margin: 0;
}

/* ── Footer ── */
.osm-foot {
  display: flex; justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--border, #e5e7eb);
  background: var(--bg-page, #f8fafc);
  flex-shrink: 0;
}

/* ── Buttons ── */
.osm-btn {
  padding: 8px 20px;
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.04em;
  border: none; border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background 120ms, opacity 120ms;
}
.osm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.osm-btn-search {
  background: var(--success, #059669);
  color: #fff;
  margin-top: 4px;
}
.osm-btn-search:hover:not(:disabled) { background: #047857; }
.osm-btn-cancel {
  background: var(--danger, #dc2626);
  color: #fff;
}
.osm-btn-cancel:hover:not(:disabled) { background: #b91c1c; }
</style>
