<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Case List</h1>
      </div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Case List</span>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Filters card — three-column legacy layout. Each column groups
         related filter fields so the operator can scan top-to-bottom.
         ─────────────────────────────────────────────────────────────── -->
    <div class="card card-padded mb-lg">
      <div class="card-section-head">
        <strong class="ch-heading">CASE LIST FILTERS</strong>
      </div>

      <div class="case-list-filters">
        <!-- Column 1: identity + classification -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Case Number</label>
            <input
              v-model="filters.caseNo"
              type="text"
              placeholder="Case Number"
              maxlength="50"
              class="filter-input"
              @keyup.enter="applyFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">Case Type</label>
            <select v-model="filters.caseType" class="filter-input">
              <option value="">Click to Add</option>
              <option v-for="t in caseTypes" :key="t.case_type_id" :value="t.case_type_id">
                {{ t.code }}{{ t.description ? ' — ' + t.description : '' }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Court</label>
            <select v-model="filters.courtId" class="filter-input">
              <option value="">Please select</option>
              <option v-for="c in courts" :key="c.court_id" :value="c.court_id">
                {{ c.name }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Closure Reason</label>
            <select v-model="filters.closureReason" class="filter-input">
              <option value="">Please Select</option>
              <option v-for="r in closureReasons" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>

        <!-- Column 2: status + booking -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Added By</label>
            <select v-model="filters.addedBy" class="filter-input">
              <option value="">Select</option>
              <option v-for="u in users" :key="u.user_id" :value="u.user_id">
                {{ u.full_name }} ({{ u.username }})
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Status</label>
            <select v-model="filters.statusId" class="filter-input">
              <option value="">Click to Add</option>
              <option v-for="s in statuses" :key="s.case_status_id" :value="s.case_status_id">
                {{ s.status_desc }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Court Booking</label>
            <select v-model="filters.courtBookingId" class="filter-input">
              <option value="">Select</option>
              <option v-for="b in bookings" :key="b.court_booking_id" :value="b.court_booking_id">
                {{ b.label }}
              </option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Non-reconciled Notices</label>
            <input v-model="filters.nonReconciled" type="checkbox" class="filter-checkbox" />
          </div>
        </div>

        <!-- Column 3: date range + contact + misc -->
        <div class="filter-col">
          <div class="filter-row">
            <label class="filter-label">Date From</label>
            <input v-model="filters.dateFrom" type="date" class="filter-input" />
          </div>
          <div class="filter-row">
            <label class="filter-label">Date Search By</label>
            <select v-model="filters.dateSearchBy" class="filter-input">
              <option value="case_dt">Offence Date</option>
              <option value="created_dt">Added Date</option>
            </select>
          </div>
          <div class="filter-row">
            <label class="filter-label">Date To</label>
            <input v-model="filters.dateTo" type="date" class="filter-input" />
          </div>
          <div class="filter-row">
            <label class="filter-label">Contact</label>
            <input
              v-model="filters.contact"
              type="text"
              placeholder="Contact Number"
              maxlength="50"
              class="filter-input"
              @keyup.enter="applyFilter"
            />
          </div>
          <div class="filter-row">
            <label class="filter-label">Cases fully paid prior to stage 1</label>
            <input v-model="filters.fullyPaid" type="checkbox" class="filter-checkbox" />
          </div>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn-action-green" :disabled="loading" @click="applyFilter">SEARCH</button>
        <button class="btn-action-red"   :disabled="loading" @click="resetFilter">RESET</button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="loadError" class="alert alert-danger mb-md" role="alert"
         style="padding:0.75rem 1rem;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
      {{ loadError }}
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Results card — green action toolbar + paginated table.
         Action buttons are UI placeholders until their endpoints land.
         ─────────────────────────────────────────────────────────────── -->
    <div class="card card-padded">
      <div class="card-section-head">
        <strong class="ch-heading">MATCHING CASE LIST</strong>
      </div>

      <!-- Action toolbar — mirrors legacy "Actions" row above the table.
           Buttons stay fully coloured at rest (legacy parity); the click
           handler validates that at least one row is checked and alerts
           otherwise. -->
      <div class="action-toolbar">
        <span class="action-toolbar-label">Actions</span>
        <div class="action-toolbar-buttons">
          <button class="btn-action-green" @click="exportPayments">EXPORT PAYMENTS</button>
          <button class="btn-action-green" @click="exportCases">EXPORT CASES</button>
          <button class="btn-action-green" @click="zipAttachment">ZIP ATTACHMENT</button>
          <button class="btn-action-green" @click="assignCourtBookings">ASSIGN COURT BOOKINGS</button>
          <button class="btn-action-green" @click="createLetter">CREATE LETTER</button>
          <button class="btn-action-green" @click="printLabel">PRINT LABEL</button>
          <button class="btn-action-green" @click="updateStatus">UPDATE STATUS</button>
          <button class="btn-action-green" @click="enterCourtResults">ENTER COURT RESULTS</button>
        </div>
      </div>

      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model.number="perPage" class="rows-select" @change="onPageSizeChange">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
        <span class="toolbar-text">updated at {{ lastUpdated }}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-icon">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" aria-label="Select all" />
              </th>
              <th>Case Number</th>
              <th @click="toggleDateSort" class="sortable">
                Offence Date <span>{{ ordering === '-case_dt' ? '↓' : ordering === 'case_dt' ? '↑' : '' }}</span>
              </th>
              <th>Case Type</th>
              <th>Status</th>
              <th>Customer Name</th>
              <th>Age</th>
              <th>Post Code</th>
              <th>Outstanding</th>
              <th>Court</th>
              <th>Court Booking</th>
              <th>Court Result</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="13"><div class="empty-state" style="padding:1.5rem 0;color:#6b7280;">Loading…</div></td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="13">
                <div class="empty-state">
                  <div class="empty-state-icon">🔍</div>
                  <p class="empty-state-title">No cases found</p>
                  <p class="empty-state-desc">Try adjusting your filters or clearing them to see all cases.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in rows" v-else :key="row.case_id">
              <td class="col-icon">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(row.case_id)"
                  @change="toggleSelect(row.case_id)"
                  :aria-label="`Select ${row.case_num}`"
                />
              </td>
              <td>
                <span class="link-cell" @click="viewCase(row.case_id)">{{ row.case_num || '—' }}</span>
              </td>
              <td>{{ fmtDate(row.case_dt) }}</td>
              <td>{{ row.case_type_code || '—' }}</td>
              <td>
                <span :class="`badge badge-${statusColor(row.case_status_desc)}`">
                  {{ row.case_status_desc || '—' }}
                </span>
              </td>
              <td>{{ row.offender_name || '—' }}</td>
              <td>{{ row.customer_age || '—' }}</td>
              <td>{{ row.post_code || '—' }}</td>
              <td>
                <span v-if="row.outstanding > 0" class="outstanding-cell">£ {{ fmtMoney(row.outstanding) }}</span>
                <span v-else>£ 0.00</span>
              </td>
              <td>{{ row.court_name || '—' }}</td>
              <td>{{ row.court_booking || '—' }}</td>
              <td>{{ row.court_result || '—' }}</td>
              <td class="actions-cell">
                <a href="#" class="action-link" @click.prevent="viewCase(row.case_id)">View</a>
                <span class="action-sep">|</span>
                <a href="#" class="action-link" @click.prevent="editCase(row.case_id)">Edit</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="page-btn" :disabled="loading || currentPage === 1" @click="changePage(currentPage - 1)">‹ Prev</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="page-btn"
          :class="{ active: p === currentPage }"
          :disabled="loading"
          @click="changePage(p)"
        >{{ p }}</button>
        <button class="page-btn" :disabled="loading || currentPage === totalPages" @click="changePage(currentPage + 1)">Next ›</button>
        <span class="page-meta">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}</span>
      </div>
    </div>

    <!-- EXPORT PAYMENTS modal — date range picker + optional Use Case List filter -->
    <div v-if="exportPaymentsModal.open" class="modal-backdrop" @click.self="closeExportPaymentsModal"
         style="position:fixed;inset:0;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;z-index:1000">
      <div class="modal-card"
           style="background:#fff;border-radius:6px;width:460px;max-width:92vw;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e5e7eb">
          <h3 style="margin:0;font-size:1rem">Export Payment Data</h3>
          <button @click="closeExportPaymentsModal" :disabled="exportPaymentsModal.busy"
                  style="border:none;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer;color:#6b7280">×</button>
        </div>
        <div style="padding:16px 18px">
          <fieldset style="border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;margin-bottom:12px">
            <legend style="padding:0 6px;font-size:0.85rem;font-weight:600;color:#374151">Payment Date</legend>
            <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <label class="form-label" style="width:60px;margin:0">From</label>
              <input v-model="exportPaymentsModal.paymentFrom" type="date" style="flex:1" />
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-bottom:0">
              <label class="form-label" style="width:60px;margin:0">To</label>
              <input v-model="exportPaymentsModal.paymentTo" type="date" style="flex:1" />
            </div>
          </fieldset>
          <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem">
            <input type="checkbox" v-model="exportPaymentsModal.useCaseListFilter" />
            Use Case List filter
          </label>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #e5e7eb;background:#f9fafb">
          <button class="btn btn-danger" @click="closeExportPaymentsModal" :disabled="exportPaymentsModal.busy">CANCEL</button>
          <button class="btn btn-primary" @click="submitExportPayments" :disabled="exportPaymentsModal.busy">
            {{ exportPaymentsModal.busy ? 'Exporting…' : 'OK' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE LETTER modal -->
    <div v-if="letterModal.open" class="cl-modal-backdrop" @click.self="closeLetterModal">
      <div class="cl-modal-card">
        <div class="cl-modal-header">
          <h3>Create Letter</h3>
          <button @click="closeLetterModal" :disabled="letterModal.saving" class="cl-modal-x">×</button>
        </div>
        <div class="cl-modal-body">
          <p class="text-light" style="margin:0 0 12px 0">For <strong>{{ selectedIds.size }}</strong> selected case<span v-if="selectedIds.size !== 1">s</span>.</p>
          <div class="form-group">
            <label class="form-label">Letter template *</label>
            <select v-model="letterModal.templateId" :disabled="letterModal.loadingTemplates">
              <option value="">
                {{ letterModal.loadingTemplates ? 'Loading templates…' : 'Select a template…' }}
              </option>
              <option v-for="t in letterModal.templates" :key="t.letter_template_id" :value="t.letter_template_id">{{ t.title }}</option>
            </select>
            <p v-if="!letterModal.loadingTemplates && letterModal.templates.length === 0"
               class="text-light" style="font-size:0.8rem;margin:4px 0 0">
              No letter template is valid for every case type you selected.
              Tick cases of a single type, or ask an admin to map a template to this combination.
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
          <div v-if="letterModal.error" class="cl-error">{{ letterModal.error }}</div>
        </div>
        <div class="cl-modal-footer">
          <button class="btn btn-secondary" @click="closeLetterModal" :disabled="letterModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitCreateLetter" :disabled="letterModal.saving || !letterModal.templateId">
            {{ letterModal.saving ? 'Queuing…' : 'Queue letter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ASSIGN COURT BOOKINGS modal -->
    <div v-if="courtModal.open" class="cl-modal-backdrop" @click.self="closeCourtModal">
      <div class="cl-modal-card" style="width:640px">
        <div class="cl-modal-header">
          <h3>Assign Court Bookings</h3>
          <button @click="closeCourtModal" :disabled="courtModal.saving" class="cl-modal-x">×</button>
        </div>
        <div class="cl-modal-body" style="max-height:60vh;overflow:auto">
          <p v-if="courtModal.loading" class="text-light">Loading…</p>
          <p v-else-if="courtModal.groups.length === 0" class="text-light">
            None of the selected cases is in the Court Queue with an unbooked slot.
            Cases need <code>court_id</code> set and <code>court_booking_id</code> empty.
          </p>
          <div v-for="g in courtModal.groups" :key="g.court_id" class="cl-court-group">
            <div class="cl-court-group-head">{{ g.court_name || g.court_id }}</div>
            <div class="cl-court-group-body">
              <div>
                <div class="text-light" style="font-size:0.8em">Cases ({{ g.cases.length }})</div>
                <ul style="margin:4px 0 0;padding-left:18px;font-size:0.85em">
                  <li v-for="c in g.cases" :key="c.case_id">{{ c.case_num }}</li>
                </ul>
              </div>
              <div>
                <label class="form-label">Booking slot</label>
                <select v-model="courtModal.choice[g.court_id]">
                  <option value="">— None —</option>
                  <option v-for="b in g.bookings" :key="b.court_booking_id" :value="b.court_booking_id">
                    {{ fmtDateTime(b.start_dt) }} · cap {{ b.capacity }} · {{ b.duration }}min
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="courtModal.error" class="cl-error">{{ courtModal.error }}</div>
        </div>
        <div class="cl-modal-footer">
          <button class="btn btn-secondary" @click="closeCourtModal" :disabled="courtModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitCourtBooking" :disabled="courtModal.saving || !anyCourtChoiceMade">
            {{ courtModal.saving ? 'Saving…' : 'Assign slots' }}
          </button>
        </div>
      </div>
    </div>

    <!-- UPDATE STATUS modal -->
    <div v-if="statusModal.open" class="cl-modal-backdrop" @click.self="closeStatusModal">
      <div class="cl-modal-card">
        <div class="cl-modal-header">
          <h3>Update Case Status</h3>
          <button @click="closeStatusModal" :disabled="statusModal.saving" class="cl-modal-x">×</button>
        </div>
        <div class="cl-modal-body">
          <p class="text-light" style="margin:0 0 12px 0">For <strong>{{ selectedIds.size }}</strong> selected case<span v-if="selectedIds.size !== 1">s</span>.</p>
          <div class="form-group">
            <label class="form-label">New status *</label>
            <select v-model="statusModal.newStatusId">
              <option value="">Select…</option>
              <option v-for="s in statusModal.statuses" :key="s.case_status_id" :value="s.case_status_id">
                {{ s.status_desc }}
              </option>
            </select>
          </div>
          <template v-if="showClosureFields">
            <div class="form-group">
              <label class="form-label">Closure Reason *</label>
              <select v-model="statusModal.closureReason">
                <option value="">Closure Reason</option>
                <option v-for="r in statusModal.closureReasons" :key="r.id" :value="r.value">
                  {{ r.value }}
                </option>
              </select>
              <p v-if="statusModal.closureReasons.length === 0" class="text-light"
                 style="font-size:0.8rem;margin:4px 0 0">
                No closure reasons in the lookup yet — ask an admin to seed NOTICE_CLOSURE_REASON.
              </p>
            </div>
            <div class="form-group">
              <label class="form-label">Closure Notes</label>
              <textarea v-model="statusModal.closureNotes" rows="3" />
            </div>
          </template>
          <template v-if="showCourtField">
            <div class="form-group">
              <label class="form-label">Court *</label>
              <select v-model="statusModal.courtId">
                <option value="">Select the court that will hear the case…</option>
                <option v-for="c in courts" :key="c.court_id" :value="c.court_id">{{ c.name }}</option>
              </select>
              <p class="text-light" style="font-size:0.8rem;margin:4px 0 0">
                Setting the court here makes the case eligible for "Assign Court Bookings" afterwards.
              </p>
            </div>
          </template>
          <div v-if="statusModal.error" class="cl-error">{{ statusModal.error }}</div>
        </div>
        <div class="cl-modal-footer">
          <button class="btn btn-secondary" @click="closeStatusModal" :disabled="statusModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitUpdateStatus" :disabled="statusModal.saving || !statusModal.newStatusId">
            {{ statusModal.saving ? 'Saving…' : 'Update status' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ENTER COURT RESULTS modal -->
    <div v-if="courtResultModal.open" class="cl-modal-backdrop" @click.self="closeCourtResultModal">
      <div class="cl-modal-card" style="width:780px">
        <div class="cl-modal-header">
          <h3>Enter Court Results</h3>
          <button @click="closeCourtResultModal" :disabled="courtResultModal.saving" class="cl-modal-x">×</button>
        </div>
        <div class="cl-modal-body" style="max-height:65vh;overflow:auto">
          <p v-if="courtResultModal.loading" class="text-light">Loading…</p>
          <p v-else-if="courtResultModal.groups.length === 0" class="text-light">
            None of the selected cases is in the "Court Booked" status. Result entry is only available once a case has been heard.
          </p>
          <div v-for="g in courtResultModal.groups" :key="g.court_id" class="cl-court-group">
            <div class="cl-court-group-head">{{ g.court_name || g.court_id }} ({{ g.cases.length }} case<span v-if="g.cases.length !== 1">s</span>)</div>
            <table class="cl-court-result-table">
              <thead>
                <tr><th>Case</th><th>Fine (£)</th><th>Costs (£)</th><th>Victim Surcharge (£)</th><th>Compensation (£)</th></tr>
              </thead>
              <tbody>
                <tr v-for="c in g.cases" :key="c.case_id">
                  <td>{{ c.case_num }}</td>
                  <td><input v-model.number="c.fine" type="number" step="0.01" min="0" /></td>
                  <td><input v-model.number="c.costs" type="number" step="0.01" min="0" /></td>
                  <td><input v-model.number="c.surcharge" type="number" step="0.01" min="0" /></td>
                  <td><input v-model.number="c.compensation" type="number" step="0.01" min="0" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="courtResultModal.error" class="cl-error">{{ courtResultModal.error }}</div>
        </div>
        <div class="cl-modal-footer">
          <button class="btn btn-secondary" @click="closeCourtResultModal" :disabled="courtResultModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitCourtResult" :disabled="courtResultModal.saving || courtResultModal.groups.length === 0">
            {{ courtResultModal.saving ? 'Saving…' : 'Save results' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ZIP ATTACHMENT modal -->
    <div v-if="zipModal.open" class="cl-modal-backdrop" @click.self="closeZipModal">
      <div class="cl-modal-card" style="width:760px">
        <div class="cl-modal-header">
          <h3>Zip Case Attachments</h3>
          <button @click="closeZipModal" :disabled="zipModal.saving" class="cl-modal-x">×</button>
        </div>
        <div class="cl-modal-body" style="max-height:65vh;overflow:auto">
          <p v-if="zipModal.loading" class="text-light">Loading attachments…</p>
          <p v-else-if="zipModal.rows.length === 0" class="text-light">No attachments on any selected case.</p>
          <table v-else class="cl-zip-table">
            <thead>
              <tr>
                <th style="width:32px">
                  <input type="checkbox" :checked="zipAllSelected" @change="toggleZipAll" />
                </th>
                <th>Case</th><th>Filename</th><th>Size (KB)</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in zipModal.rows" :key="r.attachment_id">
                <td>
                  <input type="checkbox" :checked="zipModal.selected.has(r.attachment_id)" @change="toggleZipRow(r.attachment_id)" />
                </td>
                <td>{{ r.case_num }}</td>
                <td>{{ r.filename || '—' }}</td>
                <td>{{ r.filesize || 0 }}</td>
                <td>{{ fmtDateTime(r.created_dt) || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="zipModal.error" class="cl-error">{{ zipModal.error }}</div>
        </div>
        <div class="cl-modal-footer">
          <button class="btn btn-secondary" @click="closeZipModal" :disabled="zipModal.saving">Cancel</button>
          <button class="btn btn-primary" @click="submitZipDownload" :disabled="zipModal.saving || zipModal.selected.size === 0">
            {{ zipModal.saving ? 'Zipping…' : `Download (${zipModal.selected.size} file${zipModal.selected.size === 1 ? '' : 's'})` }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { sanitizeString } from '@/utils/security.js'
import { useCasesStore } from '@/store/cases.store.js'
import { courtsService } from '@/services/courts.service.js'
import { apiDownload, apiDownloadPost } from '@/services/api.js'
import { actionsService } from '@/services/actions.service.js'
import { casesService } from '@/services/cases.service.js'

const router = useRouter()

// Cases store — owns `cases`, `total`, `listLoading`, `listError` and the
// dropdown reference data (caseTypes, statuses, issuers). The view reads
// state via storeToRefs (preserves reactivity) and calls store actions
// to fetch. Filter UI + selection state stay local to the view.
const casesStore = useCasesStore()
const {
  cases:       rows,
  total,
  listLoading: loading,
  listError:   storeError,
  caseTypes,
  statuses,
  issuers:     users,
} = storeToRefs(casesStore)

// View opens the case in read-only mode (the default). Edit appends
// `?mode=edit` so the Case Detail view can unlock the EDIT controls.
// Clicking the case number itself is a View action — anywhere in the
// system that opens a case from a link defaults to view-only, by design.
function viewCase(caseId) {
  router.push({ name: 'case-details', params: { caseid: caseId } })
}
function editCase(caseId) {
  router.push({
    name: 'case-details',
    params: { caseid: caseId },
    query: { mode: 'edit' },
  })
}

// ── Filter state ──────────────────────────────────────────────────────────────
// `filters` is what the inputs bind to; `applied` is what was last submitted
// to the server. Keeping them separate stops every keystroke from refetching.
const emptyFilters = () => ({
  caseNo:         '',
  caseType:       '',
  courtId:        '',
  closureReason:  '',
  addedBy:        '',
  statusId:       '',
  courtBookingId: '',
  nonReconciled:  false,
  dateFrom:       defaultDateFrom(),
  dateSearchBy:   'case_dt',
  dateTo:         defaultDateTo(),
  contact:        '',
  fullyPaid:      false,
})
const filters = reactive(emptyFilters())
const applied = reactive(emptyFilters())

// Default the visible date range to "last 90 days" so the screen lands on
// a useful slice instead of every case ever issued.
function defaultDateFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().slice(0, 10)
}
function defaultDateTo() {
  return new Date().toISOString().slice(0, 10)
}

const perPage     = ref(50)
const currentPage = ref(1)
const ordering    = ref('-case_dt')
const lastUpdated = ref(currentTime())

// Local error mirror — `storeError` (from the store) is the source of
// truth; `loadError` exposes the same value to the template + lets the
// view clear it locally without mutating store state.
const loadError = computed(() => storeError.value ?? '')

// Lookup dropdowns NOT yet owned by a store — courts + bookings will move
// to courts.store.js in the next pass.
const courts         = ref([])
const bookings       = ref([])
// Closure reasons aren't yet exposed via a list endpoint; the legacy DB
// stores them as free text. Surface a small static list until the backend
// adds /revp/cases/closure-reasons/.
const closureReasons = ref([])

// Selection state for the action toolbar — every action button operates on
// the checked rows. The buttons stay enabled regardless; click handlers
// validate that at least one row is selected.
const selectedIds = ref(new Set())
const allSelected = computed(() =>
  rows.value.length > 0 && rows.value.every(r => selectedIds.value.has(r.case_id))
)

function toggleSelect(id) {
  // Re-assigning a fresh Set so Vue reactivity picks up the change.
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(rows.value.map(r => r.case_id))
  }
}

// ── Pagination helpers ────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)))
const rangeStart = computed(() => total.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd   = computed(() => Math.min(currentPage.value * perPage.value, total.value))
const pageNumbers = computed(() => {
  const out = []
  const cur = currentPage.value
  const last = totalPages.value
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= cur - 1 && i <= cur + 1)) out.push(i)
  }
  return out
})

// ── Fetchers ──────────────────────────────────────────────────────────────────
// The store owns the request itself (loading flags, error capture, state
// updates). The view's job is to pass the current filter/page snapshot
// and stamp lastUpdated when the call returns.
// Shift a YYYY-MM-DD string forward by one day so the backend's __lte
// comparison on a DateTimeField includes the full selected day, not just
// up to midnight. e.g. user picks '2026-06-05' → we send '2026-06-06'.
function shiftDateToEndOfDay(dateStr) {
  if (!dateStr) return dateStr
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function loadRows() {
  await casesStore.fetchCases({
    page:           currentPage.value,
    pageSize:       perPage.value,
    search:         applied.caseNo,
    offenderName:   '',
    status:         applied.statusId,
    caseType:       applied.caseType,
    courtId:        applied.courtId,
    courtBookingId: applied.courtBookingId,
    closureReason:  applied.closureReason,
    addedBy:        applied.addedBy,
    contact:        applied.contact,
    dateFrom:       applied.dateFrom,
    dateTo:         shiftDateToEndOfDay(applied.dateTo),
    dateSearchBy:   applied.dateSearchBy,
    ordering:       ordering.value,
  })
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  lastUpdated.value = currentTime()
}

async function loadDropdowns() {
  // Case-related lookups (types / statuses / issuers) come from the cases
  // store in one parallel batch. Courts + bookings still come from the
  // courts service directly until courts.store.js lands.
  const [, courtsResult, bookingsResult] = await Promise.allSettled([
    casesStore.fetchReferenceData(),
    courtsService.getAll(),
    courtsService.listBookings(),
  ])
  if (courtsResult.status === 'fulfilled') {
    const data = courtsResult.value
    courts.value = (data?.results ?? data ?? []).filter(c => c.active)
  }
  if (bookingsResult.status === 'fulfilled') {
    const data = bookingsResult.value
    const list = data?.results ?? data ?? []
    bookings.value = list.map(b => ({
      court_booking_id: b.court_booking_id,
      label: [b.court_name, b.start_dt ? fmtDateTime(b.start_dt) : '']
        .filter(Boolean).join(' — '),
    }))
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
function applyFilter() {
  Object.assign(applied, {
    ...filters,
    caseNo:  sanitizeString(filters.caseNo),
    contact: sanitizeString(filters.contact),
  })
  currentPage.value = 1
  selectedIds.value = new Set()
  loadRows()
}
function resetFilter() {
  const fresh = emptyFilters()
  Object.assign(filters, fresh)
  Object.assign(applied, fresh)
  currentPage.value = 1
  selectedIds.value = new Set()
  loadRows()
}
function changePage(p) {
  if (p < 1 || p > totalPages.value || p === currentPage.value) return
  currentPage.value = p
  loadRows()
}
function onPageSizeChange() {
  currentPage.value = 1
  loadRows()
}
function toggleDateSort() {
  ordering.value = ordering.value === '-case_dt' ? 'case_dt' : '-case_dt'
  loadRows()
}

// Action-toolbar handlers.
//
// Build the case-list filter dict that the backend export endpoints reuse.
// Mirrors loadRows() above so the export covers exactly the rows the operator
// sees on screen, not just the ticked ones. (Legacy semantics — every Export
// button there carries the on-screen filter, not the selection.)
function _appliedFilterParams() {
  const p = new URLSearchParams()
  if (applied.caseNo)         p.set('search',           applied.caseNo)
  if (applied.statusId)       p.set('status',           applied.statusId)
  if (applied.caseType)       p.set('case_type',        applied.caseType)
  if (applied.courtId)        p.set('court_id',         applied.courtId)
  if (applied.courtBookingId) p.set('court_booking_id', applied.courtBookingId)
  if (applied.closureReason)  p.set('closure_reason',   applied.closureReason)
  if (applied.addedBy)        p.set('added_by',         applied.addedBy)
  if (applied.contact)        p.set('contact',          applied.contact)
  if (applied.dateFrom)       p.set('date_from',        applied.dateFrom)
  if (applied.dateTo)         p.set('date_to',          shiftDateToEndOfDay(applied.dateTo))
  if (applied.dateSearchBy)   p.set('date_search_by',   applied.dateSearchBy)
  p.set('ordering', ordering.value)
  return p
}

async function exportCases() {
  const p = _appliedFilterParams()
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  try {
    await apiDownload(`/revp/cases/export/?${p.toString()}`, `${stamp}_Cases.xlsx`)
  } catch (e) {
    console.error('[case-list] export-cases failed', e)
    alert(e?.data?.detail || e?.message || 'Export failed.')
  }
}

// EXPORT PAYMENTS opens a date-range modal first (matches legacy UX).
// Defaults: payment_from = today-30 days, payment_to = today.
function _dateNDaysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const exportPaymentsModal = reactive({
  open: false,
  paymentFrom: '',
  paymentTo:   '',
  useCaseListFilter: false,
  busy: false,
})
function exportPayments() {
  exportPaymentsModal.paymentFrom = _dateNDaysAgo(30)
  exportPaymentsModal.paymentTo   = _dateNDaysAgo(0)
  exportPaymentsModal.useCaseListFilter = false
  exportPaymentsModal.busy = false
  exportPaymentsModal.open = true
}
function closeExportPaymentsModal() {
  if (exportPaymentsModal.busy) return
  exportPaymentsModal.open = false
}
async function submitExportPayments() {
  // Start from the case-list filter params only when the user opted in.
  // Otherwise build a clean URL with just the payment date range.
  const p = exportPaymentsModal.useCaseListFilter
    ? _appliedFilterParams()
    : new URLSearchParams()
  if (exportPaymentsModal.paymentFrom) p.set('payment_from', exportPaymentsModal.paymentFrom)
  if (exportPaymentsModal.paymentTo)   p.set('payment_to',   exportPaymentsModal.paymentTo)
  if (exportPaymentsModal.useCaseListFilter) p.set('use_case_list_filter', 'true')

  exportPaymentsModal.busy = true
  try {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    await apiDownload(`/revp/cases/export-payments/?${p.toString()}`, `${stamp}_Payments.xlsx`)
    exportPaymentsModal.open = false
  } catch (e) {
    console.error('[case-list] export-payments failed', e)
    alert(e?.data?.detail || e?.message || 'Payments export failed.')
  } finally {
    exportPaymentsModal.busy = false
  }
}
// ── Bulk selection guard — every action button needs ≥1 row ticked ──────
function _ensureSelection() {
  if (selectedIds.value.size === 0) {
    alert('Tick at least one case first.')
    return null
  }
  return [...selectedIds.value]
}

// ── CREATE LETTER ──────────────────────────────────────────────────────
const letterModal = reactive({
  open: false, templateId: '', copies: 1, language: 'English', saving: false, error: '',
  templates: [],
  loadingTemplates: false,
  // Tracks the case_type_ids that the currently-cached `templates` was
  // fetched for. We re-fetch when the operator opens the modal with a
  // different mix of case types (e.g. previously ticked PCN + UFN, now
  // ticks just MG11 — the cached intersection is wrong).
  cachedForCaseTypeIds: '',
})
async function createLetter() {
  const caseIds = _ensureSelection()
  if (!caseIds) return
  letterModal.open = true
  letterModal.templateId = ''
  letterModal.copies = 1
  letterModal.language = 'English'
  letterModal.saving = false
  letterModal.error = ''

  // Derive the distinct case_type_ids from the ticked rows. The backend
  // intersection filter then returns only templates valid for ALL of them.
  const ticked = new Set(caseIds)
  const caseTypeIds = [
    ...new Set(rows.value.filter(r => ticked.has(r.case_id))
                          .map(r => r.case_type_id)
                          .filter(Boolean)),
  ]
  const fingerprint = caseTypeIds.slice().sort().join(',')

  // Re-fetch when the case-type mix differs from the last cached call.
  if (letterModal.templates.length === 0 || letterModal.cachedForCaseTypeIds !== fingerprint) {
    letterModal.loadingTemplates = true
    try {
      const data = await actionsService.letterTemplates({ caseTypeIds })
      letterModal.templates = data?.results ?? (Array.isArray(data) ? data : [])
      letterModal.cachedForCaseTypeIds = fingerprint
    } catch (e) {
      console.error('[create-letter] template load failed', e)
      letterModal.error = 'Failed to load letter templates.'
    } finally {
      letterModal.loadingTemplates = false
    }
  }
}
function closeLetterModal() { if (!letterModal.saving) letterModal.open = false }
async function submitCreateLetter() {
  const caseIds = _ensureSelection()
  if (!caseIds || !letterModal.templateId) return
  letterModal.saving = true
  letterModal.error = ''
  try {
    const res = await actionsService.createLetter({
      caseIds,
      letterTemplateId: letterModal.templateId,
      copies: letterModal.copies || 1,
      language: letterModal.language || 'English',
    })
    const created = res?.created ?? 0
    const skipped = res?.skipped ?? []
    if (skipped.length) console.warn('[create-letter] skipped', skipped)
    alert(`Queued ${created} letter${created === 1 ? '' : 's'}${skipped.length ? `, skipped ${skipped.length}` : ''}`)
    letterModal.open = false
    selectedIds.value = new Set()
  } catch (e) {
    console.error('[create-letter] save failed', e)
    letterModal.error = e?.data?.detail || e?.message || 'Save failed.'
  } finally {
    letterModal.saving = false
  }
}

// ── ASSIGN COURT BOOKINGS ──────────────────────────────────────────────
const courtModal = reactive({
  open: false, loading: false, saving: false, error: '', groups: [], choice: {},
})
async function assignCourtBookings() {
  const caseIds = _ensureSelection()
  if (!caseIds) return
  courtModal.open = true
  courtModal.loading = true
  courtModal.error = ''
  courtModal.groups = []
  courtModal.choice = {}
  try {
    const data = await actionsService.courtBookingOptions(caseIds)
    courtModal.groups = Array.isArray(data) ? data : []
    courtModal.groups.forEach(g => { courtModal.choice[g.court_id] = '' })
  } catch (e) {
    console.error('[court-booking] options failed', e)
    courtModal.error = e?.message || 'Failed to load court options.'
  } finally {
    courtModal.loading = false
  }
}
function closeCourtModal() { if (!courtModal.saving) courtModal.open = false }
const anyCourtChoiceMade = computed(() => Object.values(courtModal.choice).some(v => !!v))
async function submitCourtBooking() {
  const assignments = []
  courtModal.groups.forEach(g => {
    const bookingId = courtModal.choice[g.court_id]
    if (!bookingId) return
    g.cases.forEach(c => assignments.push({ case_id: c.case_id, court_booking_id: bookingId }))
  })
  if (!assignments.length) return
  courtModal.saving = true
  courtModal.error = ''
  try {
    const res = await actionsService.assignCourtBookings(assignments)
    alert(`Assigned ${res?.assigned ?? 0} case(s) to court bookings`)
    courtModal.open = false
    selectedIds.value = new Set()
    await loadRows()
  } catch (e) {
    console.error('[court-booking] assign failed', e)
    courtModal.error = e?.data?.detail || e?.message || 'Assignment failed.'
  } finally {
    courtModal.saving = false
  }
}

// ── PRINT LABEL ────────────────────────────────────────────────────────
async function printLabel() {
  const caseIds = _ensureSelection()
  if (!caseIds) return
  try {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    await apiDownloadPost(actionsService.printLabelPath, { case_ids: caseIds }, `address-labels-${stamp}.pdf`)
  } catch (e) {
    console.error('[print-label] failed', e)
    alert(e?.data?.detail || e?.message || 'Print label failed.')
  }
}

// ── UPDATE STATUS ──────────────────────────────────────────────────────
const statusModal = reactive({
  open: false,
  newStatusId: '',
  closureReason: '',
  closureNotes: '',
  courtId: '',          // populated when the chosen status is Court Queue
  saving: false,
  error: '',
  statuses: [],
  // Closure reasons sourced from the NOTICE_CLOSURE_REASON lookup. Legacy
  // pinned three preferred values at the top — we replicate that ordering
  // so muscle memory carries over.
  closureReasons: [],
})

// Legacy ordering hint — these three are surfaced first inside the dropdown,
// the remaining values follow alphabetically by `lookup_data_value`.
const PINNED_CLOSURE_REASONS = [
  'Closed - Paid',
  'Closed - Paid on train',
  'Closed - Successful Appeal',
]
const pickedStatusDesc = computed(() => {
  const s = statusModal.statuses.find(x => x.case_status_id === statusModal.newStatusId)
  return (s?.status_desc || '').toLowerCase()
})
const showClosureFields = computed(() => pickedStatusDesc.value.includes('closed'))
// Mirrors the legacy guard: choosing Court Queue requires picking the court
// that will hear the case. Without it the case never appears in the Assign
// Court Bookings modal afterwards.
const showCourtField = computed(() => pickedStatusDesc.value.includes('court queue'))

async function updateStatus() {
  if (!_ensureSelection()) return
  statusModal.open = true
  statusModal.newStatusId = ''
  statusModal.closureReason = ''
  statusModal.closureNotes = ''
  statusModal.courtId = ''
  statusModal.saving = false
  statusModal.error = ''
  if (!statusModal.statuses.length) {
    try {
      const data = await casesService.listStatuses?.()
        ?? await import('@/services/api.js').then(m => m.api.get('/revp/cases/statuses/'))
      statusModal.statuses = Array.isArray(data) ? data : (data?.results ?? [])
    } catch (e) {
      console.error('[update-status] statuses load failed', e)
      statusModal.error = 'Failed to load statuses.'
    }
  }
  // Courts list — reuse the page-level `courts` ref (already loaded for the
  // filter row). If it's empty (rare race on first load), trigger a refetch.
  if (courts.value.length === 0) {
    try {
      const data = await courtsService.getAll()
      const list = data?.results ?? data ?? []
      courts.value = list.filter(c => c.active)
    } catch { /* surface as empty dropdown */ }
  }
  // Closure reasons — lazy-load on first open, then keep around for the
  // lifetime of the page. Source: NOTICE_CLOSURE_REASON lookup type, tenant-
  // scoped via /revp/lookup/by-type/. Same endpoint already used elsewhere.
  if (statusModal.closureReasons.length === 0) {
    try {
      const { api } = await import('@/services/api.js')
      const rows = await api.get('/revp/lookup/by-type/?name=NOTICE_CLOSURE_REASON')
      // De-dup on value (some rows in the legacy data ship duplicated), then
      // split into pinned-first and the rest alphabetised. Persist as
      // [{ id, value }] — we submit the value, not the id, because the
      // backend column is a text field, matching legacy behaviour.
      const seenValues = new Set()
      const cleaned = []
      for (const r of rows) {
        const value = (r.lookup_data_value || '').trim()
        if (!value || seenValues.has(value)) continue
        seenValues.add(value)
        cleaned.push({ id: r.lookup_data_id, value })
      }
      const pinned = []
      const rest = []
      for (const r of cleaned) {
        (PINNED_CLOSURE_REASONS.includes(r.value) ? pinned : rest).push(r)
      }
      // Pinned in the legacy order, rest alphabetised.
      pinned.sort((a, b) =>
        PINNED_CLOSURE_REASONS.indexOf(a.value) - PINNED_CLOSURE_REASONS.indexOf(b.value)
      )
      rest.sort((a, b) => a.value.localeCompare(b.value))
      statusModal.closureReasons = [...pinned, ...rest]
    } catch (e) {
      console.error('[update-status] closure reasons load failed', e)
      // Soft-fail — operator can still type a custom value if we keep the
      // editable-on-error fallback in the template (datalist).
    }
  }
}
function closeStatusModal() { if (!statusModal.saving) statusModal.open = false }
async function submitUpdateStatus() {
  const caseIds = _ensureSelection()
  if (!caseIds || !statusModal.newStatusId) return
  if (showClosureFields.value && !statusModal.closureReason.trim()) {
    statusModal.error = 'Closure Reason is required when closing.'
    return
  }
  if (showCourtField.value && !statusModal.courtId) {
    statusModal.error = 'Pick the court that will hear the case.'
    return
  }
  statusModal.saving = true
  statusModal.error = ''
  try {
    const { api } = await import('@/services/api.js')
    const res = await api.post('/revp/cases/bulk-status/', {
      case_ids: caseIds,
      case_status_id: statusModal.newStatusId,
      closure_reason: showClosureFields.value ? statusModal.closureReason.trim() : '',
      closure_notes:  showClosureFields.value ? (statusModal.closureNotes || '').trim() : '',
      court_id:       showCourtField.value   ? statusModal.courtId : '',
    })
    alert(`Updated ${res?.updated ?? 0} case(s)${res?.skipped?.length ? `, skipped ${res.skipped.length}` : ''}`)
    statusModal.open = false
    selectedIds.value = new Set()
    await loadRows()
  } catch (e) {
    console.error('[update-status] save failed', e)
    statusModal.error = e?.data?.detail || e?.message || 'Update failed.'
  } finally {
    statusModal.saving = false
  }
}

// ── ENTER COURT RESULTS ────────────────────────────────────────────────
const courtResultModal = reactive({
  open: false, loading: false, saving: false, error: '', groups: [],
})
async function enterCourtResults() {
  const caseIds = _ensureSelection()
  if (!caseIds) return
  courtResultModal.open = true
  courtResultModal.loading = true
  courtResultModal.error = ''
  courtResultModal.groups = []
  try {
    const { api } = await import('@/services/api.js')
    const data = await api.get(`/revp/cases/court-result-options/?case_ids=${encodeURIComponent(caseIds.join(','))}`)
    // Each group: { court_id, court_name, cases: [{case_id, case_num, fine: 0, costs: 0, surcharge: 0, compensation: 0}] }
    courtResultModal.groups = (Array.isArray(data) ? data : []).map(g => ({
      ...g,
      cases: (g.cases || []).map(c => ({
        ...c, fine: 0, costs: 0, surcharge: 0, compensation: 0,
      })),
    }))
  } catch (e) {
    console.error('[court-result] options failed', e)
    courtResultModal.error = e?.message || 'Failed to load eligible cases.'
  } finally {
    courtResultModal.loading = false
  }
}
function closeCourtResultModal() { if (!courtResultModal.saving) courtResultModal.open = false }
async function submitCourtResult() {
  const results = []
  courtResultModal.groups.forEach(g => g.cases.forEach(c => {
    results.push({
      case_id: c.case_id,
      court_fine:        Number(c.fine || 0),
      court_costs:       Number(c.costs || 0),
      victim_surcharge:  Number(c.surcharge || 0),
      court_restitution: Number(c.compensation || 0),
    })
  }))
  if (!results.length) return
  courtResultModal.saving = true
  courtResultModal.error = ''
  try {
    const { api } = await import('@/services/api.js')
    const res = await api.post('/revp/cases/court-results/', { results })
    alert(`Saved court results for ${res?.updated ?? 0} case(s)`)
    courtResultModal.open = false
    selectedIds.value = new Set()
    await loadRows()
  } catch (e) {
    console.error('[court-result] save failed', e)
    courtResultModal.error = e?.data?.detail || e?.message || 'Save failed.'
  } finally {
    courtResultModal.saving = false
  }
}

// ── ZIP ATTACHMENT ─────────────────────────────────────────────────────
const zipModal = reactive({
  open: false, loading: false, saving: false, error: '', rows: [], selected: new Set(),
})
async function zipAttachment() {
  const caseIds = _ensureSelection()
  if (!caseIds) return
  zipModal.open = true
  zipModal.loading = true
  zipModal.error = ''
  zipModal.rows = []
  zipModal.selected = new Set()
  try {
    const { api } = await import('@/services/api.js')
    const data = await api.get(`/revp/cases/attachments-bundle/?case_ids=${encodeURIComponent(caseIds.join(','))}`)
    zipModal.rows = Array.isArray(data) ? data : (data?.results ?? [])
    // Pre-select everything
    zipModal.selected = new Set(zipModal.rows.map(r => r.attachment_id))
  } catch (e) {
    console.error('[zip-attachment] list failed', e)
    zipModal.error = e?.message || 'Failed to load attachments.'
  } finally {
    zipModal.loading = false
  }
}
function closeZipModal() { if (!zipModal.saving) zipModal.open = false }
function toggleZipRow(id) {
  const next = new Set(zipModal.selected)
  next.has(id) ? next.delete(id) : next.add(id)
  zipModal.selected = next
}
const zipAllSelected = computed(() =>
  zipModal.rows.length > 0 && zipModal.rows.every(r => zipModal.selected.has(r.attachment_id))
)
function toggleZipAll() {
  zipModal.selected = zipAllSelected.value
    ? new Set()
    : new Set(zipModal.rows.map(r => r.attachment_id))
}
async function submitZipDownload() {
  if (zipModal.selected.size === 0) return
  zipModal.saving = true
  zipModal.error = ''
  try {
    const ids = [...zipModal.selected]
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    await apiDownloadPost(
      '/revp/cases/attachments-bundle/zip/',
      { attachment_ids: ids },
      `case-attachments-${stamp}.zip`,
    )
    zipModal.open = false
    selectedIds.value = new Set()
  } catch (e) {
    console.error('[zip-attachment] download failed', e)
    zipModal.error = e?.data?.detail || e?.message || 'Zip download failed.'
  } finally {
    zipModal.saving = false
  }
}


// ── Display helpers ───────────────────────────────────────────────────────────
function currentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtMoney(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0.00'
  return v.toFixed(2)
}
function statusColor(desc) {
  if (!desc) return 'neutral'
  const map = {
    'open': 'info',
    'closed': 'success',
    'court queue': 'warning',
    'court booked': 'info',
    'under appeal': 'danger',
    'under investigation': 'purple',
  }
  return map[desc.toLowerCase()] ?? 'neutral'
}

onMounted(() => {
  // Seed `applied` with the initial filter defaults so the first load
  // honours the default date range.
  Object.assign(applied, emptyFilters())
  loadDropdowns()
  loadRows()
})
</script>

<style scoped>
.case-list-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 32px;
  padding: 12px 4px;
}
.filter-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 12px;
}
.filter-label {
  font-size: 12px;
  color: #4b5563;
}
.filter-input {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  width: 100%;
  background: #fff;
}
.filter-checkbox {
  justify-self: start;
}
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.action-toolbar {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px 12px;
  margin: 8px 0 12px;
}
.action-toolbar-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 6px;
}
.action-toolbar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Solid teal action buttons — legacy parity. Styles are duplicated from
   CaseDetailsView's scoped block because <style scoped> does not leak
   across components. */
.btn-action-green {
  padding: 7px 14px;
  background: #15a982;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background var(--transition);
}
.btn-action-green:hover { background: #128968; }
.btn-action-red {
  padding: 7px 14px;
  background: #fee2e2;
  color: var(--danger);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-action-red:hover { background: var(--danger); color: #fff; }

/* Toolbar row above the table: "10 / records per page" left, timestamp right. */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select {
  width: auto;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
}
.toolbar-text { font-size: 12px; color: var(--text-muted); }

/* The global stylesheet uppercases every `thead th`; the legacy case list
   uses normal Title Case for column labels, so undo it just for this
   table. `:deep()` is required because <style scoped> hashes selectors
   and the rule wouldn't otherwise reach descendants. */
:deep(thead th) {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}

.actions-cell {
  white-space: nowrap;
}
.action-link {
  color: #047857;
  font-weight: 600;
  text-decoration: none;
  font-size: 12px;
}
.action-link:hover { text-decoration: underline; }
.action-sep {
  color: #9ca3af;
  margin: 0 6px;
}
.outstanding-cell {
  display: inline-block;
  padding: 2px 8px;
  background: #ef4444;
  color: #fff;
  border-radius: 3px;
  font-weight: 600;
  font-size: 11px;
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--text-strong); }

/* Shared modal shell for all action-toolbar modals */
.cl-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.cl-modal-card {
  background: #fff;
  border-radius: 6px;
  width: 480px;
  max-width: 92vw;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
}
.cl-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.cl-modal-header h3 { margin: 0; font-size: 1rem; }
.cl-modal-x {
  border: none; background: transparent;
  font-size: 1.5rem; line-height: 1;
  cursor: pointer; color: #6b7280;
}
.cl-modal-body { padding: 16px 18px; }
.cl-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}
.cl-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 4px;
  font-size: 0.875rem;
}
.cl-court-group {
  border: 1px solid #e5e7eb; border-radius: 4px;
  padding: 10px 12px; margin-bottom: 12px;
}
.cl-court-group-head { font-weight: 600; margin-bottom: 6px; }
.cl-court-group-body {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; align-items: start;
}
.cl-court-result-table, .cl-zip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.cl-court-result-table th, .cl-court-result-table td,
.cl-zip-table th, .cl-zip-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 6px 8px;
  text-align: left;
}
.cl-court-result-table input {
  width: 90px; padding: 4px 6px;
  border: 1px solid #d1d5db; border-radius: 4px;
}
</style>
