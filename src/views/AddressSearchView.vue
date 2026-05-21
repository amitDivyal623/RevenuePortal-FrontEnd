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
          <div class="form-group">
            <label class="form-label">Postcode</label>
            <input v-model="address.postcode" type="text" placeholder="Postcode" maxlength="20" />
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

        <button class="btn-search" @click="handleSearch">SEARCH</button>
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
                <tr>
                  <td colspan="4">
                    <div class="empty-state">
                      <div class="empty-state-icon">🔍</div>
                      <p class="empty-state-title">No data available in table</p>
                      <p class="empty-state-desc">Enter search criteria and click SEARCH to find matching addresses.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="page-meta">Showing 0 to 0 of 0 entries</span>
            <button class="page-btn" disabled>‹ Previous</button>
            <button class="page-btn" disabled>Next ›</button>
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
                  <tr>
                    <td colspan="2">
                      <div class="empty-state">
                        <p class="empty-state-desc">No offenders to display.</p>
                      </div>
                    </td>
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
                        <p class="empty-state-desc">No residents to display.</p>
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
import { ref, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const offender = reactive({ firstName: '', middleName: '', lastName: '' })
const address  = reactive({ postcode: '', line1: '', line2: '', town: '' })

const perPage = ref(10)
const quickFilter = ref('')
const sortKey = ref('address')
const sortDir = ref('asc')

function handleSearch() {
  // No-op until the address-search backend is wired in.
}

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
</style>
