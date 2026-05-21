<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Case Details</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Case Details</span>
      </div>
    </div>

    <!-- Case Details header card -->
    <div class="card card-padded mb-lg">
      <div class="card-section-head">
        <div class="flex items-center gap-sm">
          <strong class="ch-heading">Case Details |</strong>
          <button class="refresh-btn" @click="refresh" aria-label="Refresh">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span class="updated-time">updated at {{ lastUpdated }}</span>
          </button>
        </div>
        <button class="collapse-btn" @click="headerOpen = !headerOpen" :aria-expanded="headerOpen">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="{ transform: headerOpen ? 'none' : 'rotate(-90deg)' }">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <div v-show="headerOpen">
        <div class="case-header-grid">
          <div class="ch-field"><label>Customer Name</label><span class="readonly-text">{{ caseDetails.customerName }}</span></div>
          <div class="ch-field" aria-hidden="true"></div>
          <div class="ch-field"><label>Case Number</label><span class="readonly-text">{{ caseDetails.caseNumber }}</span></div>

          <div class="ch-field"><label>Offence Date</label><input :value="caseDetails.offenceDate" readonly class="field-readonly" /></div>
          <div class="ch-field"><label>Case Status</label>
            <select :value="caseDetails.caseStatus" disabled class="field-readonly">
              <option>{{ caseDetails.caseStatus }}</option>
            </select>
          </div>
          <div class="ch-field"><label>Case Issuer</label><input :value="caseDetails.caseIssuer" readonly class="field-readonly" /></div>

          <div class="ch-field"><label>Closure Reason</label>
            <select :value="caseDetails.closureReason" disabled class="field-readonly">
              <option value="">Closure Reason</option>
            </select>
          </div>
          <div class="ch-field"><label>Closure Date</label><input :value="caseDetails.closureDate" readonly placeholder="Closure Date" class="field-readonly" /></div>
          <div class="ch-field"><label>Case Type</label>
            <select :value="caseDetails.caseType" disabled class="field-readonly">
              <option>{{ caseDetails.caseType }}</option>
            </select>
          </div>
        </div>

        <div class="mt-md">
          <button class="btn-edit" @click="editCase">EDIT</button>
        </div>
      </div>
    </div>

    <!-- Tab nav -->
    <div class="tabs tabs-scroll">
      <button v-for="t in tabs" :key="t.id" class="tab" :class="{ active: activeTab === t.id }" @click="activeTab = t.id">
        {{ t.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="card card-padded tab-pane">
      <!-- ACTIONS -->
      <div v-show="activeTab === 'actions'">
        <div class="actions-section">
          <p class="actions-label">Actions</p>
          <div class="action-btns">
            <button class="btn-action-light" @click="closeAction">CLOSE &amp; ACTION</button>
            <button class="btn-action-light" @click="editAction">EDIT ACTION</button>
            <button class="btn-action-light" @click="addNewAction">ADD NEW ACTION</button>
            <button class="btn-action-green" @click="exportExcel('actions')">EXPORT EXCEL</button>
          </div>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon"><input type="checkbox" aria-label="Select all actions" /></th>
                <th>Holder</th>
                <th>Action</th>
                <th>Target Date</th>
                <th>Actioned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in actions" :key="row.id" :class="{ 'row-faded': row.status === 'PENDING' }">
                <td class="col-icon"><input type="checkbox" :aria-label="`Select action ${row.id}`" /></td>
                <td>{{ row.holder }}</td>
                <td>{{ row.action }}</td>
                <td>{{ row.targetDate }}</td>
                <td>{{ row.actioned }}</td>
                <td>{{ row.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 1 to {{ actions.length }} of {{ actions.length }} entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn active">1</button>
          <button class="page-btn" disabled>Next ›</button>
        </div>
      </div>

      <!-- CUSTOMER DETAILS -->
      <div v-show="activeTab === 'customer'">
        <div class="two-col">
          <fieldset class="legend-group">
            <legend>Customer</legend>
            <div class="form-row-left">
              <label class="form-label-left">Title</label>
              <select :value="customer.title" disabled class="field-readonly"><option>{{ customer.title }}</option></select>

              <label class="form-label-left">First Name</label>
              <input :value="customer.firstName" readonly class="field-readonly" />

              <label class="form-label-left">Last Name</label>
              <input :value="customer.lastName" readonly class="field-readonly" />

              <label class="form-label-left">Date of Birth</label>
              <input :value="customer.dob" readonly class="field-readonly" />

              <label class="form-label-left">Age</label>
              <input :value="customer.age" readonly class="field-readonly" />

              <label class="form-label-left">Gender</label>
              <div class="radio-row">
                <label class="radio-item"><input type="radio" :checked="customer.gender === 'Male'" disabled /> Male</label>
                <label class="radio-item"><input type="radio" :checked="customer.gender === 'Female'" disabled /> Female</label>
                <label class="radio-item"><input type="radio" :checked="customer.gender === 'Other'" disabled /> Other</label>
              </div>

              <label class="form-label-left">Telephone</label>
              <input :value="customer.telephone" readonly class="field-readonly" />

              <label class="form-label-left">Mobile Telephone</label>
              <input :value="customer.mobileTelephone" readonly placeholder="Mobile Number" class="field-readonly" />

              <label class="form-label-left">E-mail Address</label>
              <input :value="customer.email" readonly class="field-readonly" />

              <label class="form-label-left">Employment Status</label>
              <select :value="customer.employmentStatus" disabled class="field-readonly"><option>{{ customer.employmentStatus }}</option></select>

              <label class="form-label-left">Parent/Guardian</label>
              <input :value="customer.parentGuardian" readonly class="field-readonly" />
            </div>
            <button class="btn-action-light mt-md" @click="showDescription">SHOW DESCRIPTION</button>
          </fieldset>

          <div class="right-stack">
            <fieldset class="legend-group">
              <legend>Address</legend>
              <div class="form-row-left">
                <label class="form-label-left">Postcode</label>
                <div class="input-with-icon">
                  <input :value="customer.postcode" readonly class="field-readonly" />
                  <span class="help-icon" title="Postcode lookup">?</span>
                </div>

                <label class="form-label-left">Address 1</label>
                <input :value="customer.address1" readonly class="field-readonly" />

                <label class="form-label-left">Address 2</label>
                <input :value="customer.address2" readonly placeholder="Address 2" class="field-readonly" />

                <label class="form-label-left">Town</label>
                <input :value="customer.town" readonly class="field-readonly" />
              </div>
              <div class="flex gap-sm mt-md" style="justify-content: space-between">
                <button class="btn-action-light" @click="enterAddressSearchReference">ENTER ADDRESS SEARCH REFERENCE</button>
                <button class="btn-action-light" @click="performAddressSearch">PERFORM ADDRESS SEARCH</button>
              </div>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Manual Verification</legend>
              <div class="form-row-left">
                <label class="form-label-left">Verification Type</label>
                <select :value="customer.verificationType" disabled class="field-readonly"><option>{{ customer.verificationType }}</option></select>

                <label class="form-label-left">Verification Notes</label>
                <input :value="customer.verificationNotes" readonly class="field-readonly" />
              </div>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Customer signature</legend>
              <div class="form-row-left">
                <label class="form-label-left">Customer Signature</label>
                <select :value="customer.customerSignature" disabled class="field-readonly"><option>{{ customer.customerSignature }}</option></select>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- JOURNEY DETAILS -->
      <div v-show="activeTab === 'journey'">
        <div class="two-col">
          <div class="form-row-left">
            <label class="form-label-left">Reason for Issue</label>
            <select :value="journey.reasonForIssue" disabled class="field-readonly"><option>{{ journey.reasonForIssue }}</option></select>

            <label class="form-label-left">Rail Card</label>
            <select :value="journey.railCard" disabled class="field-readonly"><option>Please Select</option></select>

            <label class="form-label-left">Place</label>
            <input :value="journey.place" readonly class="field-readonly" />

            <label class="form-label-left">Journey From</label>
            <input :value="journey.journeyFrom" readonly class="field-readonly" />

            <label class="form-label-left">Journey To</label>
            <input :value="journey.journeyTo" readonly class="field-readonly" />

            <label class="form-label-left">Time &amp; Date of Travel</label>
            <div class="datetime-pair">
              <input :value="journey.travelTime" readonly class="field-readonly" />
              <input :value="journey.travelDate" readonly class="field-readonly" />
            </div>

            <label class="form-label-left">Train Service Id</label>
            <input :value="journey.trainServiceId" readonly placeholder="Train Service Id" class="field-readonly" />
          </div>

          <div class="form-row-left">
            <label class="form-label-left">Smartcard Number</label>
            <input :value="journey.smartcardNumber" readonly placeholder="Card Number" class="field-readonly" />

            <label class="form-label-left">Fare Due</label>
            <div class="input-currency"><span class="prefix">£</span><input :value="journey.fareDue" readonly class="field-readonly" /></div>

            <label class="form-label-left">Additional Penalty</label>
            <div class="input-currency"><span class="prefix">£</span><input :value="journey.additionalPenalty" readonly class="field-readonly" /></div>

            <label class="form-label-left">Total Due</label>
            <div class="input-currency"><span class="prefix">£</span><input :value="journey.totalDue" readonly class="field-readonly" /></div>

            <label class="form-label-left">Already Paid</label>
            <div class="input-currency"><span class="prefix">£</span><input :value="journey.alreadyPaid" readonly class="field-readonly" /></div>

            <label class="form-label-left outstanding-label">Outstanding Balance</label>
            <div class="input-currency"><span class="prefix">£</span><input :value="journey.outstanding" readonly class="field-readonly" /></div>
          </div>
        </div>
      </div>

      <!-- OFFENCES -->
      <div v-show="activeTab === 'offences'">
        <div class="flex" style="justify-content: flex-end; margin-bottom: 12px">
          <button class="btn-action-light" @click="addOffence">ADD</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Offence</th>
                <th>Charge</th>
                <th>Statement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="3"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td>
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

      <!-- COURT / SUMMONS DETAILS -->
      <div v-show="activeTab === 'court'">
        <div class="two-col">
          <div>
            <fieldset class="legend-group">
              <legend>Court</legend>
              <div class="form-row-left">
                <label class="form-label-left">Court</label>
                <select :value="court.court" disabled class="field-readonly"><option>Please Select Court</option></select>

                <label class="form-label-left">Court Booking</label>
                <select :value="court.courtBooking" disabled class="field-readonly"><option>Please Select Court Booking</option></select>

                <label class="form-label-left">Court Reference</label>
                <input :value="court.courtReference" readonly class="field-readonly" />
              </div>
            </fieldset>

            <fieldset class="legend-group mt-lg">
              <legend>Result</legend>
              <div class="form-row-left">
                <label class="form-label-left">Court Result</label>
                <select :value="court.courtResult" disabled class="field-readonly"><option>Please Select</option></select>

                <label class="form-label-left">Costs</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="court.costs" readonly class="field-readonly" /></div>

                <label class="form-label-left">Compensation</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="court.compensation" readonly class="field-readonly" /></div>

                <label class="form-label-left">Fine</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="court.fine" readonly class="field-readonly" /></div>

                <label class="form-label-left">Victim</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="court.victim" readonly class="field-readonly" /></div>
              </div>
              <div class="flex items-center gap-sm mt-md">
                <input type="checkbox" :checked="court.preventRailPay" disabled />
                <label class="text-sm">Prevent this case being paid through the RailPay Portal</label>
              </div>
            </fieldset>
          </div>

          <div>
            <fieldset class="legend-group">
              <legend>Settlement</legend>
              <div class="form-row-left">
                <label class="form-label-left">Outstanding Fare</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.outstandingFare" readonly class="field-readonly" /></div>

                <label class="form-label-left">Administrative Costs</label>
                <div class="flex items-center gap-sm">
                  <div class="input-currency" style="flex:1"><span class="prefix">£</span><input :value="settlement.adminCosts" readonly class="field-readonly" /></div>
                  <button class="btn-action-light" @click="overrideAdmin">OVERRIDE</button>
                </div>

                <label class="form-label-left" style="font-weight:700">Automatic Dues</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.automaticDues" readonly class="field-readonly" /></div>

                <label class="form-label-left">Manual Settlements</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.manualSettlements" readonly class="field-readonly" /></div>

                <label class="form-label-left">OOCS Amount</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.oocsAmount" readonly class="field-readonly" /></div>

                <label class="form-label-left" style="font-weight:700">Manual Dues</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.manualDues" readonly class="field-readonly" /></div>

                <label class="form-label-left">Total Admin Cost</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.totalAdminCost" readonly class="field-readonly" /></div>
              </div>
            </fieldset>

            <fieldset class="legend-group mt-lg">
              <legend>Notes</legend>
              <textarea :value="settlement.notes" readonly rows="5" class="field-readonly"></textarea>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- PAYMENT / DUE -->
      <div v-show="activeTab === 'payment'">
        <fieldset class="legend-group">
          <legend>Payments</legend>
          <div class="flex gap-sm mb-md">
            <button class="btn-action-light" @click="registerPayment">REGISTER PAYMENT</button>
            <button class="btn-action-red" @click="deletePayment">DELETE PAYMENT</button>
          </div>
          <div class="payment-grid">
            <div class="ch-field"><label>Amount Due</label><div class="input-currency"><span class="prefix">£</span><input :value="payment.amountDue" readonly class="field-readonly" /></div></div>
            <div class="ch-field"><label>Paid</label><div class="input-currency"><span class="prefix">£</span><input :value="payment.paid" readonly class="field-readonly" /></div></div>
            <div class="ch-field"><label>Outstanding</label><div class="input-currency"><span class="prefix">£</span><input :value="payment.outstanding" readonly class="field-readonly" /></div></div>
            <div class="ch-field"><label>Discounted Amount</label><input :value="payment.discounted" readonly class="field-readonly" /></div>
          </div>
        </fieldset>

        <div class="flex mt-lg" style="justify-content: flex-start">
          <button class="btn-action-green" @click="exportExcel('payments')">EXPORT EXCEL</button>
        </div>

        <div class="toolbar mt-md">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon"><input type="checkbox" aria-label="Select all payments" /></th>
                <th>Date Taken</th>
                <th>Payment Type</th>
                <th>Payment Method</th>
                <th>Reference</th>
                <th>Amount (£)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="7"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td>
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

      <!-- APPEAL -->
      <div v-show="activeTab === 'appeal'">
        <div class="card-inline mb-lg">
          <button class="btn-action-light" @click="startAppeal">START APPEAL</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Appeal Date</th>
                <th>Appeal Reason</th>
                <th>Decline Date</th>
                <th>Decline Reason</th>
                <th>Reopen Date</th>
                <th>Reopen Reason</th>
                <th>Acceptance Date</th>
                <th>Acceptance Reason</th>
                <th>Attachment</th>
                <th>Actions</th>
                <th>Print</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="11"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td>
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

      <!-- NOTES -->
      <div v-show="activeTab === 'notes'">
        <div class="flex gap-sm" style="justify-content: flex-end; margin-bottom: 12px">
          <button class="btn-action-light" @click="printAllNotes">PRINT ALL NOTES</button>
          <button class="btn-action-light" @click="addNote">ADD</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
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
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 1 to {{ notes.length }} of {{ notes.length }} entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn active">1</button>
          <button class="page-btn" disabled>Next ›</button>
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
                <th class="col-icon"><input type="checkbox" aria-label="Select all attachments" /></th>
                <th>Date&amp;time</th>
                <th>Uploader</th>
                <th>Filename</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in attachments" :key="a.id">
                <td class="col-icon"><input type="checkbox" :checked="selectedAttachments.includes(a.id)" @change="toggleAttachment(a.id)" /></td>
                <td>{{ a.datetime }}</td>
                <td>{{ a.uploader }}</td>
                <td>{{ a.filename }}</td>
                <td>{{ a.size }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- AUDIT -->
      <div v-show="activeTab === 'audit'">
        <div class="flex mb-md">
          <button class="btn-action-green" @click="exportExcel('audit')">EXPORT EXCEL</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
          <button class="refresh-btn" @click="refresh">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th @click="sort('datetime')" class="sortable">Date &amp; Time {{ sortIcon('datetime') }}</th>
                <th>User</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in auditLog" :key="row.id">
                <td>{{ row.datetime }}</td>
                <td>{{ row.user }}</td>
                <td>{{ row.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EMAIL -->
      <div v-show="activeTab === 'email'">
        <div class="flex gap-sm" style="margin-bottom: 12px">
          <button class="btn-action-light" @click="openEmail">OPEN EMAIL</button>
          <button class="btn-action-light" @click="previewEmail">PREVIEW EMAIL</button>
          <button class="btn-action-light" @click="addEmail">ADD EMAIL</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon"><input type="checkbox" aria-label="Select all emails" /></th>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>Edited</th>
                <th>Sent</th>
                <th>Created By</th>
                <th>Edited By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="9"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 0 to 0 of 0 entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn" disabled>Next ›</button>
        </div>
      </div>

      <!-- LETTERS -->
      <div v-show="activeTab === 'letters'">
        <div class="flex gap-sm" style="margin-bottom: 12px">
          <button class="btn-action-light" @click="openLetter">OPEN LETTER</button>
          <button class="btn-action-light" @click="previewLetter">PREVIEW LETTER</button>
          <button class="btn-action-light" @click="editLetter">EDIT LETTER</button>
          <button class="btn-action-light" @click="addLetter">ADD LETTER</button>
          <button class="btn-action-light" @click="updateLetterStatus">UPDATE STATUS</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon"><input type="checkbox" aria-label="Select all letters" /></th>
                <th>Title</th>
                <th>Status</th>
                <th>Copies</th>
                <th>Created</th>
                <th>Edited</th>
                <th>Printed</th>
                <th>Created By</th>
                <th>Edited By</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="9"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 0 to 0 of 0 entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn" disabled>Next ›</button>
        </div>
      </div>

      <!-- LINKED CASES -->
      <div v-show="activeTab === 'linked'">
        <div class="flex gap-sm" style="margin-bottom: 12px">
          <button class="btn-action-green" @click="linkAdditionalCase">LINK ADDITIONAL CASE</button>
          <button class="btn-action-light" @click="unlinkSelectedCase">UNLINK SELECTED CASE</button>
          <button class="btn-action-light" @click="openSelectedLinkedCase">OPEN SELECTED CASE</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model="perPage" class="rows-select">
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
          <button class="refresh-btn" @click="refresh">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon"><input type="checkbox" aria-label="Select all linked" /></th>
                <th>Case Number</th>
                <th>Offence Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Offender</th>
                <th>Post Code</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="7"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 0 to 0 of 0 entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn" disabled>Next ›</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const headerOpen = ref(true)
const activeTab = ref('actions')
const perPage = ref(10)
const sortKey = ref('datetime')
const sortDir = ref('desc')
const lastUpdated = ref(currentTime())

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
function refresh() { lastUpdated.value = currentTime() }

const caseDetails = reactive({
  customerName:  'MISS SORAYA DONNELLY',
  offenceDate:   '15/05/2026',
  closureReason: '',
  caseStatus:    'Open',
  closureDate:   '',
  caseNumber:    route.params.caseid ? `AGT/PFN/${String(route.params.caseid).padStart(6, '0')}` : 'AGT/PFN/122855',
  caseIssuer:    '3626 (Katarzyna Jacak)',
  caseType:      'PFN'
})

const customer = reactive({
  title: 'MISS',
  firstName: 'SORAYA',
  lastName: 'DONNELLY',
  dob: '18/02/2008',
  age: 18,
  gender: '',
  telephone: '',
  mobileTelephone: '',
  email: 'raydonnelly18@gmail.com',
  employmentStatus: 'Please Select Occupation',
  parentGuardian: '',
  postcode: 'WD18 7DN',
  address1: '298 Hagden Lane',
  address2: '',
  town: 'Watford',
  verificationType: 'Other',
  verificationNotes: 'apple id',
  customerSignature: 'Signature provided'
})

const journey = reactive({
  reasonForIssue: 'No Ticket',
  railCard: '',
  place: 'On Train',
  journeyFrom: 'Bedford',
  journeyTo: 'London St. Pancras',
  travelTime: '19:46',
  travelDate: '15/05/2026',
  trainServiceId: '',
  smartcardNumber: '',
  fareDue: '31.30',
  additionalPenalty: '50.00',
  totalDue: '81.30',
  alreadyPaid: '0.00',
  outstanding: '81.30'
})

const court = reactive({
  court: '', courtBooking: '', courtReference: '',
  courtResult: '', costs: '0.00', compensation: '31.30', fine: '0.00', victim: '0.00',
  preventRailPay: false
})
const settlement = reactive({
  outstandingFare: '81.30',
  adminCosts: '0.00',
  automaticDues: '81.30',
  manualSettlements: '0.00',
  oocsAmount: '0.00',
  manualDues: '0.00',
  totalAdminCost: '0.00',
  notes: ''
})

const payment = reactive({
  amountDue: '81.30',
  paid: '0.00',
  outstanding: '81.30',
  discounted: '50.00'
})

const actions = ref([
  { id: 1, holder: 'Prosecution Clerk',   action: 'Send PFN Reminder Letter',       targetDate: '08/06/2026', actioned: '', status: 'OPEN' },
  { id: 2, holder: 'Prosecution Clerk',   action: 'Summon Served',                  targetDate: '',           actioned: '', status: 'PENDING' },
  { id: 3, holder: 'Prosecution Clerk',   action: 'Book Court',                     targetDate: '',           actioned: '', status: 'PENDING' },
  { id: 4, holder: 'Prosecution Clerk',   action: 'Send Final PFN Reminder Letter', targetDate: '',           actioned: '', status: 'PENDING' },
  { id: 5, holder: 'Prosecution Manager', action: 'Witness Statement Signature',    targetDate: '',           actioned: '', status: 'PENDING' }
])

const notes = ref([
  { id: 1, datetime: '15/05/2026 19:51', author: '3626', note: 'No extra notes were supplied by Katarzyna Jacak' }
])

const attachments = ref([
  { id: 1, datetime: '15/05/2026 19:52', uploader: 'Katarzyna Jacak', filename: 'evidence-photo.jpg', size: '1.2 MB' },
  { id: 2, datetime: '15/05/2026 19:55', uploader: 'Katarzyna Jacak', filename: 'witness-statement.pdf', size: '480 KB' }
])
const selectedAttachments = ref([])
function toggleAttachment(id) {
  const idx = selectedAttachments.value.indexOf(id)
  idx === -1 ? selectedAttachments.value.push(id) : selectedAttachments.value.splice(idx, 1)
}

const auditLog = ref([
  { id: 1,  datetime: '16/05/2026 10:27', user: 'admin', description: 'Open Case Attachments' },
  { id: 2,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Notes' },
  { id: 3,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Appeal' },
  { id: 4,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Payment' },
  { id: 5,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Court' },
  { id: 6,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Offences' },
  { id: 7,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Journey' },
  { id: 8,  datetime: '16/05/2026 10:26', user: 'admin', description: 'Open Case Offender Details' },
  { id: 9,  datetime: '16/05/2026 10:25', user: 'admin', description: 'Open Case Action' },
  { id: 10, datetime: '16/05/2026 10:25', user: 'admin', description: 'Open Case Offender Details' }
])

const tabs = computed(() => [
  { id: 'actions',     label: 'ACTIONS' },
  { id: 'customer',    label: 'CUSTOMER DETAILS' },
  { id: 'journey',     label: 'JOURNEY DETAILS' },
  { id: 'offences',    label: 'OFFENCES' },
  { id: 'court',       label: 'COURT/SUMMONS DETAILS' },
  { id: 'payment',     label: 'PAYMENT / DUE' },
  { id: 'appeal',      label: 'APPEAL' },
  { id: 'notes',       label: `NOTES (${notes.value.length})` },
  { id: 'attachments', label: `ATTACHMENTS (${attachments.value.length})` },
  { id: 'audit',       label: 'AUDIT' },
  { id: 'email',       label: 'EMAIL' },
  { id: 'letters',     label: 'LETTERS (0)' },
  { id: 'linked',      label: 'LINKED CASES (0)' }
])

function sort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key) { return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : '' }

function editCase()                  { /* TODO: enable edit mode */ }
function closeAction()               { /* TODO */ }
function editAction()                { /* TODO */ }
function addNewAction()              { /* TODO */ }
function exportExcel(_section)       { /* TODO */ }
function showDescription()           { /* TODO */ }
function enterAddressSearchReference(){ /* TODO */ }
function performAddressSearch()      { /* TODO */ }
function addOffence()                { /* TODO */ }
function overrideAdmin()             { /* TODO */ }
function registerPayment()           { /* TODO */ }
function deletePayment()             { /* TODO */ }
function startAppeal()               { /* TODO */ }
function printAllNotes()             { /* TODO */ }
function addNote()                   { /* TODO */ }
function openAttach()                { /* TODO */ }
function addAttach()                 { /* TODO */ }
function deleteAttach()              { /* TODO */ }
function openEmail()                 { /* TODO */ }
function previewEmail()              { /* TODO */ }
function addEmail()                  { /* TODO */ }
function openLetter()                { /* TODO */ }
function previewLetter()             { /* TODO */ }
function editLetter()                { /* TODO */ }
function addLetter()                 { /* TODO */ }
function updateLetterStatus()        { /* TODO */ }
function linkAdditionalCase()        { /* TODO */ }
function unlinkSelectedCase()        { /* TODO */ }
function openSelectedLinkedCase()    { /* TODO */ }
</script>

<style scoped>
.card-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ch-heading {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.refresh-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 12px;
  transition: all var(--transition);
}
.refresh-btn:hover { background: var(--bg-hover); color: var(--text-strong); }
.updated-time { color: var(--text-light); }
.collapse-btn {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}
.collapse-btn:hover { background: var(--bg-hover); color: var(--text-strong); }
.collapse-btn svg { transition: transform var(--transition); }

.case-header-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 24px;
}
.ch-field {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 12px;
}
.ch-field label {
  font-size: 13px;
  color: var(--text-default);
}
.readonly-text {
  font-size: 13px;
  color: var(--text-strong);
  font-weight: 500;
}
@media (max-width: 1100px) {
  .case-header-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .case-header-grid { grid-template-columns: 1fr; }
}

.field-readonly {
  background: var(--bg-page);
  color: var(--text-strong);
  cursor: default;
  border-color: var(--border);
}
.field-readonly:focus, .field-readonly:hover { border-color: var(--border); box-shadow: none; }

.tabs-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
}
.tabs-scroll .tab { white-space: nowrap; flex-shrink: 0; }

.tab-pane { border-top-left-radius: 0; border-top-right-radius: 0; }

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
  grid-template-columns: 180px 1fr;
  row-gap: 12px;
  column-gap: 14px;
  align-items: center;
}
.form-label-left {
  font-size: 13px;
  color: var(--text-default);
  font-weight: 500;
}
.outstanding-label { color: var(--danger); font-weight: 700; }

.datetime-pair { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; }

.radio-row { display: flex; gap: 14px; align-items: center; }
.radio-item { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-default); }

.input-with-icon { position: relative; }
.input-with-icon input { padding-right: 36px; }
.help-icon {
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  width: 18px; height: 18px;
  background: var(--text-muted);
  color: #fff;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  cursor: help;
}

.input-currency {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
}
.input-currency .prefix {
  padding: 0 10px;
  background: var(--bg-page);
  color: var(--text-muted);
  font-size: 13px;
  align-self: stretch;
  display: flex; align-items: center;
  border-right: 1px solid var(--border);
}
.input-currency input { border: none; border-radius: 0; flex: 1; }

.payment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
}

.actions-section { margin-bottom: 14px; }
.actions-label { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
.action-btns { display: flex; gap: 10px; flex-wrap: wrap; }

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }

.row-faded { color: var(--text-light); }
.row-faded td { color: var(--text-light); }

.card-inline {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.btn-edit {
  padding: 7px 18px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-edit:hover { background: #128968; }

.btn-action-light {
  padding: 7px 14px;
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

.btn-action-green {
  padding: 7px 14px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-action-green:hover { background: #128968; }

.btn-action-red {
  padding: 7px 14px;
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

:deep(table) { font-size: 12px; }
:deep(thead th) { padding: 10px 12px 10px 0; }
:deep(tbody td) { padding: 11px 12px 11px 0; }
</style>
