<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Perform Address Search</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <span class="breadcrumb-active">Perform Address Search</span>
      </div>
    </div>

    <!-- Top section: search form (left) + matching results (right) -->
    <div class="addr-grid">
      <!-- Left column: criteria + search button -->
      <div class="form-side">
        <div class="card card-padded">
          <div class="card-title">Offender Name</div>
          <div class="form-group">
            <label class="form-label">First name</label>
            <input v-model="offender.firstName" type="text" placeholder="First name" maxlength="50" />
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Middle name</label>
            <input v-model="offender.middleName" type="text" placeholder="Middle name" maxlength="50" />
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Last name</label>
            <input v-model="offender.lastName" type="text" placeholder="Last name" maxlength="50" />
          </div>
        </div>

        <div class="card card-padded mt-lg">
          <div class="card-title">Offender Address</div>
          <div class="form-group" style="position:relative">
            <label class="form-label">Postcode</label>
            <div class="postcode-row">
              <input
                v-model="address.postcode"
                type="text"
                placeholder="Postcode"
                maxlength="20"
                @keyup.enter.prevent="performAddressLookup"
              />
              <button
                type="button"
                class="postcode-lookup-btn"
                title="Look up addresses for this postcode"
                :disabled="addressLookupLoading"
                @click="performAddressLookup"
              >{{ addressLookupLoading ? '…' : '?' }}</button>
            </div>

            <!-- Click-to-apply suggestion dropdown — same pattern as Add Case. -->
            <ul
              v-if="addressSuggestions.length"
              class="address-suggest-popover"
              role="listbox"
            >
              <li
                v-for="(a, i) in addressSuggestions"
                :key="i"
                class="address-suggest-row"
                role="option"
                tabindex="0"
                @click="applyAddressSuggestion(a)"
                @keyup.enter="applyAddressSuggestion(a)"
                @keyup.space.prevent="applyAddressSuggestion(a)"
              >
                {{ a.label || [a.line_1, a.town, a.county, a.postcode].filter(Boolean).join(', ') }}
              </li>
            </ul>
            <span v-if="addressLookupError" class="form-error" role="alert">{{ addressLookupError }}</span>
            <span v-else-if="addressLookupInfo" class="form-info" role="status">{{ addressLookupInfo }}</span>
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Address 1</label>
            <input v-model="address.line1" type="text" placeholder="Address 1" maxlength="100" />
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Address 2</label>
            <input v-model="address.line2" type="text" placeholder="Address 2" maxlength="100" />
          </div>
          <div class="form-group mt-md">
            <label class="form-label">Town</label>
            <input v-model="address.town" type="text" placeholder="Town" maxlength="100" />
          </div>
        </div>

        <button
          class="btn-search"
          :disabled="searching"
          @click="handleSearch"
        >{{ searching ? 'SEARCHING…' : 'SEARCH' }}</button>
        <span v-if="searchError" class="form-error" role="alert" style="margin-top:8px;">{{ searchError }}</span>
      </div>

      <!-- Right column: matching results + related lists -->
      <div class="results-side">
        <div class="card card-padded">
          <div class="card-title">Matching Results</div>

          <div class="results-toolbar">
            <div class="flex items-center gap-sm">
              <select v-model="perPage" class="rows-select">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
              <span class="text-sm text-light">records per page</span>
            </div>
            <input v-model="quickFilter" type="text" placeholder="Search" maxlength="100" class="quick-search" />
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th @click="sort('address')" class="sortable">Address {{ sortIcon('address') }}</th>
                  <th @click="sort('telephone')" class="sortable">Telephone {{ sortIcon('telephone') }}</th>
                  <th @click="sort('resident')" class="sortable">Resident {{ sortIcon('resident') }}</th>
                  <th @click="sort('postcode')" class="sortable">Postcode {{ sortIcon('postcode') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="searching">
                  <td colspan="4"><div class="empty-state" style="padding:1.5rem 0;color:#6b7280;">Searching…</div></td>
                </tr>
                <tr v-else-if="!searched">
                  <td colspan="4">
                    <div class="empty-state">
                      <div class="empty-state-icon">🔍</div>
                      <p class="empty-state-title">No data available in table</p>
                      <p class="empty-state-desc">Enter search criteria and click SEARCH to find matching addresses.</p>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="pagedMatching.length === 0">
                  <td colspan="4">
                    <div class="empty-state">
                      <div class="empty-state-icon">🔍</div>
                      <p class="empty-state-title">No matching customers found</p>
                      <p class="empty-state-desc">Try broader criteria or check your spelling.</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="row in pagedMatching" v-else :key="row.customer_id">
                  <td>{{ row.address  || '—' }}</td>
                  <td>{{ row.telephone || '—' }}</td>
                  <td>{{ row.resident || [row.first_name, row.last_name].filter(Boolean).join(' ') || '—' }}</td>
                  <td>{{ row.postcode || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="page-meta">Showing {{ rangeStart }} to {{ rangeEnd }} of {{ filteredMatching.length }} entries</span>
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹ Previous</button>
            <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">Next ›</button>
          </div>
        </div>

        <div class="related-grid">
          <div class="card card-padded">
            <div class="card-title">Offenders At Same Street</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="sameStreetResults.length === 0">
                    <td colspan="2">
                      <div class="empty-state">
                        <p class="empty-state-desc">{{ searched ? 'No same-street neighbours found.' : 'Run a SEARCH to populate.' }}</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="(row, i) in sameStreetResults" v-else :key="i">
                    <td>{{ row.name || '—' }}</td>
                    <td>{{ row.address || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card card-padded">
            <div class="card-title">Electoral Roll Residents</div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="2">
                      <div class="empty-state">
                        <p class="empty-state-desc">
                          External identity feed not in scope — needs a paid third-party data subscription (legacy uses Equifax).
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { addressesService } from '@/services/addresses.service.js'
import { customersService } from '@/services/customers.service.js'

const offender = reactive({ firstName: '', middleName: '', lastName: '' })
const address  = reactive({ postcode: '', line1: '', line2: '', town: '' })

const perPage = ref(10)
const quickFilter = ref('')
const sortKey = ref('address')
const sortDir = ref('asc')

// ── Customer-search results (SEARCH button) ─────────────────────────────
// Mirrors legacy "Matching Results" + "Offenders At Same Street". Backend
// returns {matching, same_street}; each entry already has display-ready
// composite fields (address = "line1, line2, town", resident = name).
const matchingResults  = ref([])
const sameStreetResults = ref([])
const searching        = ref(false)
const searchError      = ref('')
const searched         = ref(false)   // true after the first SEARCH press

// ── Postcode lookup state (mirrors AddNewCaseView) ──────────────────────
const addressLookupLoading = ref(false)
const addressLookupError   = ref('')
const addressLookupInfo    = ref('')
const addressSuggestions   = ref([])

async function performAddressLookup() {
  const pc = (address.postcode || '').trim()
  if (!pc) {
    addressLookupError.value = 'Enter a postcode first.'
    return
  }
  addressLookupLoading.value = true
  addressLookupError.value = ''
  addressLookupInfo.value = ''
  addressSuggestions.value = []
  try {
    const results = await addressesService.lookup(pc)
    if (results.length === 0) {
      addressLookupError.value = 'Postcode not found.'
      return
    }
    // Show the dropdown — same legacy "confirm the match" UX. Click a row
    // to copy the address into the form below.
    addressSuggestions.value = results
  } catch (err) {
    addressLookupError.value = err?.data?.detail || err?.message || 'Address lookup failed.'
  } finally {
    addressLookupLoading.value = false
  }
}

function applyAddressSuggestion(a) {
  // Only overwrite empty / already-blank form fields when the lookup has a
  // value — preserves anything the operator already typed manually.
  if (a.line_1)   address.line1    = a.line_1
  if (a.line_2)   address.line2    = a.line_2
  if (a.town)     address.town     = a.town
  if (a.postcode) address.postcode = a.postcode
  const where = [a.town, a.county].filter(Boolean).join(', ')
  addressLookupInfo.value = a.line_1
    ? `Filled from ${where || a.postcode}. Adjust house number if needed.`
    : `Postcode matched: ${where || a.postcode}. Please enter Address 1 and Address 2.`
  addressSuggestions.value = []
}

// Outside-click / Escape dismissal — listeners only attached while the
// dropdown is open so we don't pay for them globally.
function _dismissOnEscape(e) {
  if (e.key === 'Escape') addressSuggestions.value = []
}
function _dismissOnClickOutside(e) {
  const popover = document.querySelector('.address-suggest-popover')
  if (popover && !popover.contains(e.target) && !e.target.closest('.postcode-row')) {
    addressSuggestions.value = []
  }
}
watch(addressSuggestions, (rows) => {
  if (rows.length) {
    document.addEventListener('keydown', _dismissOnEscape)
    document.addEventListener('mousedown', _dismissOnClickOutside)
  } else {
    document.removeEventListener('keydown', _dismissOnEscape)
    document.removeEventListener('mousedown', _dismissOnClickOutside)
  }
})

async function handleSearch() {
  // Mirrors legacy fuseaction `searchAddressDataSave` lookup path:
  // the backend's /api/customers/search/ accepts the same name + address
  // fragments and returns matching customers + same-street neighbours,
  // both tenant-scoped. At least one criterion required — empty search
  // would otherwise return every customer for the TOC.
  const f = {
    firstName:  offender.firstName.trim(),
    middleName: offender.middleName.trim(),
    lastName:   offender.lastName.trim(),
    postcode:   address.postcode.trim(),
    address1:   address.line1.trim(),
    address2:   address.line2.trim(),
    town:       address.town.trim(),
  }
  const hasAny = Object.values(f).some(v => v)
  if (!hasAny) {
    searchError.value = 'Enter at least one field before searching.'
    return
  }

  searching.value = true
  searchError.value = ''
  matchingResults.value = []
  sameStreetResults.value = []
  try {
    const resp = await customersService.search(f)
    matchingResults.value   = resp.matching    ?? []
    sameStreetResults.value = resp.same_street ?? []
    searched.value = true
  } catch (err) {
    searchError.value = err?.data?.detail || err?.message || 'Search failed.'
  } finally {
    searching.value = false
  }
}

// Quick-filter + sort on the in-memory matching results (DataTables-style).
const filteredMatching = computed(() => {
  let rows = matchingResults.value
  const q = quickFilter.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter(r =>
      (r.address   || '').toLowerCase().includes(q) ||
      (r.resident  || '').toLowerCase().includes(q) ||
      (r.telephone || '').toLowerCase().includes(q) ||
      (r.postcode  || '').toLowerCase().includes(q)
    )
  }
  // Stable client-side sort — the result set is capped at SEARCH_RESULT_LIMIT
  // on the backend so it's safe to sort in JS without paginating server-side.
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = (a[sortKey.value] ?? '').toString().toLowerCase()
    const bv = (b[sortKey.value] ?? '').toString().toLowerCase()
    if (av < bv) return -dir
    if (av > bv) return dir
    return 0
  })
})

// Paginated slice of the filtered set for the table.
const currentPage = ref(1)
const totalPages  = computed(() => Math.max(1, Math.ceil(filteredMatching.value.length / perPage.value)))
const rangeStart  = computed(() => filteredMatching.value.length === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd    = computed(() => Math.min(currentPage.value * perPage.value, filteredMatching.value.length))
const pagedMatching = computed(() => filteredMatching.value.slice(rangeStart.value - 1, rangeEnd.value))

watch([quickFilter, perPage, sortKey, sortDir], () => { currentPage.value = 1 })

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }
</script>

<style scoped>
.addr-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 1100px) {
  .addr-grid { grid-template-columns: 1fr; }
}

.form-side { display: flex; flex-direction: column; }

.results-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.related-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 1100px) {
  .related-grid { grid-template-columns: 1fr; }
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}
.rows-select { width: auto; padding: 5px 10px; font-size: 12px; }
.quick-search { width: auto; max-width: 220px; padding: 6px 10px; font-size: 12px; }

.btn-search {
  align-self: flex-start;
  margin-top: 16px;
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-search:hover { background: #128968; }

/* Postcode field row — input + small lookup button on the right. */
.postcode-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.postcode-row input { flex: 1; }
.postcode-lookup-btn {
  flex: 0 0 32px;
  background: var(--primary, #5b8def);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm, 6px);
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition);
}
.postcode-lookup-btn:hover:not(:disabled) { background: var(--primary-dark, #3563cf); }
.postcode-lookup-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-error { display: block; margin-top: 6px; font-size: 12px; color: #b91c1c; }
.form-info  { display: block; margin-top: 6px; font-size: 12px; color: #047857; }

/* Click-to-apply postcode suggestion dropdown (same look as AddNewCaseView).
   Anchored to the relative-positioned .form-group wrapper around the
   postcode input — sits flush under the input with border + shadow. */
.address-suggest-popover {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid var(--border, #d1d5db);
  border-radius: var(--radius-sm, 6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  list-style: none;
  padding: 4px 0;
  z-index: 30;
  max-height: 220px;
  overflow-y: auto;
}
.address-suggest-row {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-strong, #1f2937);
  cursor: pointer;
  border-bottom: 1px solid var(--border-row, #f3f4f6);
}
.address-suggest-row:last-child { border-bottom: none; }
.address-suggest-row:hover,
.address-suggest-row:focus {
  background: var(--primary-tint, #eef2ff);
  outline: none;
}
</style>
