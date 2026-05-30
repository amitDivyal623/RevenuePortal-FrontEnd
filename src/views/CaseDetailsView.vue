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
      <div v-if="loadError" class="case-load-banner case-load-banner-error" role="alert">
        {{ loadError }}
      </div>
      <div class="card-section-head">
        <div class="flex items-center gap-sm">
          <strong class="ch-heading">Case Details |</strong>
          <button class="refresh-btn" @click="refresh" aria-label="Refresh" :disabled="loading">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span class="updated-time">{{ loading ? 'loading…' : `updated at ${lastUpdated}` }}</span>
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

        <!-- EDIT button only renders when the route was opened with ?mode=edit
             (i.e. the user clicked "Edit" in the case list). Plain links
             open the page in view-only mode — agents browsing the case
             cannot mutate it from here. -->
        <div v-if="isEditMode" class="mt-md">
          <button class="btn-edit" @click="editCase">EDIT</button>
        </div>
        <div v-else class="mt-md case-mode-hint">
          <span class="view-only-pill">View only</span>
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
        <!-- Diagnostic banner: tells you why the tab is empty (if it is). -->
        <div v-if="!customerLinked" class="tab-hint tab-hint-info">
          No customer is linked to this case. Customer Details were not filled in when the case was created.
        </div>
        <div v-else-if="customerError" class="tab-hint tab-hint-error">
          Could not load customer details: {{ customerError }}
        </div>
        <div v-else-if="!customerLoaded" class="tab-hint tab-hint-info">
          Loading customer details…
        </div>
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

      <!-- JOURNEY DETAILS / CAR PARK DETAILS -->
      <!-- Legacy parity: a case has either a journey OR a vehicle, never both.
           PCN case types carry vehicle_id and we render the Car Park sub-section
           in place of the journey fields. -->
      <div v-show="activeTab === 'journey'">
        <!-- CAR PARKING DETAILS sub-section — shown when the case row carries vehicle_id.
             Layout mirrors the legacy CarParkingDetails fuseaction: two columns,
             four fieldsets (Vehicle details, Offence Times, Offence Location, POPLA). -->
        <template v-if="hasVehicle">
          <div class="two-col">
            <div>
              <fieldset class="legend-group">
                <legend>Vehicle details</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Registration number</label>
                  <input :value="vehicle.regNum" readonly class="field-readonly" />

                  <label class="form-label-left">Manufacturer</label>
                  <input :value="vehicle.manufacturer" readonly class="field-readonly" />

                  <label class="form-label-left">Model</label>
                  <input :value="vehicle.model" readonly class="field-readonly" />

                  <label class="form-label-left">Colour</label>
                  <input :value="vehicle.colour" readonly class="field-readonly" />
                </div>
              </fieldset>

              <fieldset class="legend-group mt-lg">
                <legend>Offence Times</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Time From</label>
                  <input :value="vehicle.offenceFrom" readonly class="field-readonly" />

                  <label class="form-label-left">Time To</label>
                  <input :value="vehicle.offenceTo" readonly class="field-readonly" />

                  <label class="form-label-left">P&amp;D Ticket</label>
                  <input :value="vehicle.payDisplayTicketNum" readonly class="field-readonly" />

                  <label class="form-label-left">Expiry Time</label>
                  <input :value="vehicle.payDisplayTicketExpiry" readonly class="field-readonly" />
                </div>
              </fieldset>
            </div>

            <div>
              <fieldset class="legend-group">
                <legend>Offence Location</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Reason for Issue</label>
                  <select :value="vehicle.issueReason" disabled class="field-readonly">
                    <option>{{ vehicle.issueReason }}</option>
                  </select>

                  <label class="form-label-left">Car Park Location</label>
                  <select :value="vehicle.carParkLocation" disabled class="field-readonly">
                    <option>{{ vehicle.carParkLocation }}</option>
                  </select>

                  <label class="form-label-left">Extra Details</label>
                  <textarea :value="vehicle.carparkDetails" readonly rows="4" class="field-readonly"></textarea>
                </div>
              </fieldset>

              <fieldset class="legend-group mt-lg">
                <legend>POPLA</legend>
                <div class="form-row-left">
                  <label class="form-label-left">POPLA Appeal</label>
                  <input type="checkbox" :checked="vehicle.poplaAppeal" disabled />

                  <label class="form-label-left">Start Date</label>
                  <input :value="vehicle.poplaStartDate" readonly placeholder="Start Date" class="field-readonly" />

                  <label class="form-label-left">End Date</label>
                  <input :value="vehicle.poplaEndDate" readonly placeholder="End Date" class="field-readonly" />

                  <label class="form-label-left">Reference Number</label>
                  <input :value="vehicle.poplaReference" readonly class="field-readonly" />

                  <label class="form-label-left">Accepted</label>
                  <input type="checkbox" :checked="vehicle.poplaAccepted" disabled />
                </div>
              </fieldset>
            </div>
          </div>
        </template>

        <!-- JOURNEY sub-section — shown for non-PCN cases (no vehicle linked) -->
        <template v-else>
          <div v-if="!journeyLinked" class="tab-hint tab-hint-info">
            No journey is linked to this case. Journey Details were not filled in when the case was created.
          </div>
          <div v-else-if="journeyError" class="tab-hint tab-hint-error">
            Could not load journey details: {{ journeyError }}
          </div>
          <div v-else-if="!journeyLoaded" class="tab-hint tab-hint-info">
            Loading journey details…
          </div>
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
        </template>
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
              <tr v-for="o in offences" :key="o.case_offence_id">
                <td>{{ o.offence_id }}</td>
                <td>{{ o.offence_charge || '—' }}</td>
                <td>{{ o.case_offence_statement || '—' }}</td>
              </tr>
              <tr v-if="offences.length === 0">
                <td colspan="3"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 1 to {{ offences.length }} of {{ offences.length }} entries</span>
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
                <th class="col-icon"></th>
                <th>Case Number</th>
                <th>Offence Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Offender</th>
                <th>Post Code</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in linkedCases" :key="row.linked_id">
                <td class="col-icon">
                  <input
                    type="radio"
                    name="linked-row-select"
                    :value="row.linked_id"
                    v-model="selectedLinkedId"
                    :aria-label="`Select ${row.case_num}`"
                  />
                </td>
                <td>
                  <a href="#" class="link-cell" @click.prevent="openLinkedCase(row)">
                    {{ row.case_num }}
                  </a>
                </td>
                <td>{{ fmtDate(row.case_dt) }}</td>
                <td>{{ row.case_type_code || '—' }}</td>
                <td>{{ row.case_status_desc || '—' }}</td>
                <td>{{ row.customer_name || '—' }}</td>
                <td>{{ row.post_code || '—' }}</td>
              </tr>
              <tr v-if="linkedCases.length === 0">
                <td colspan="7"><div class="empty-state"><p class="empty-state-desc">No linked cases. Click LINK ADDITIONAL CASE to add one.</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">Showing 1 to {{ linkedCases.length }} of {{ linkedCases.length }} entries</span>
          <button class="page-btn" disabled>‹ Previous</button>
          <button class="page-btn" disabled>Next ›</button>
        </div>
      </div>
    </div>

    <!-- LINK ADDITIONAL CASE modal — opens from the Linked Cases tab button.
         Shows auto-detect suggestions from /linkable/, lets the user pick one,
         then POSTs to /linked/ to create the revp_linked row.
         Mirrors legacy `getLinkedCasesRecordCount` (param=1) + linkData.create. -->
    <div v-if="linkModalOpen" class="modal-backdrop" @click.self="linkModalOpen = false">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="link-modal-title"
           style="max-width: 880px; width: 90%;">
        <div class="modal-head">
          <h2 id="link-modal-title" class="modal-title">Link Additional Case</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="linkModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px; max-height: 60vh; overflow-y: auto;">
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
            Cases below share customer details (surname + postcode, contact number, or email)
            with this case. Pick one and click LINK to create the relationship.
          </p>
          <div v-if="linkLoading" style="text-align: center; padding: 1rem; color: #6b7280;">Loading…</div>
          <div v-else-if="linkSuggestions.length === 0" class="empty-state">
            <p class="empty-state-desc">No matching cases found.</p>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="col-icon"></th>
                  <th>Case Number</th>
                  <th>Offence Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Offender</th>
                  <th>Post Code</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in linkSuggestions" :key="s.case_id">
                  <td class="col-icon">
                    <input type="radio" name="link-suggestion"
                           :value="s.case_id" v-model="linkSelectedCaseId" />
                  </td>
                  <td>{{ s.case_num }}</td>
                  <td>{{ fmtDate(s.case_dt) }}</td>
                  <td>{{ s.case_type_code || '—' }}</td>
                  <td>{{ s.case_status_desc || '—' }}</td>
                  <td>{{ s.customer_name || '—' }}</td>
                  <td>{{ s.post_code || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="linkError" class="form-error" role="alert"
             style="color: #b91c1c; font-size: 12px; margin-top: 8px;">
            {{ linkError }}
          </p>
        </div>
        <div class="modal-foot" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn-action-red"   @click="linkModalOpen = false">CANCEL</button>
          <button type="button" class="btn-action-green" :disabled="!linkSelectedCaseId" @click="confirmLink">LINK</button>
        </div>
      </div>
    </div>

    <!-- Add Note modal — opens from Notes tab ADD button. Writes one
         revp_note row + one revp_audit_history row in a single backend
         transaction (mirrors legacy setNotesDetailsByCaseid). -->
    <div v-if="noteModalOpen" class="modal-backdrop" @click.self="noteModalOpen = false">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
        <div class="modal-head">
          <h2 id="note-modal-title" class="modal-title">Add Note</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="noteModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding: 16px 20px;">
          <label class="form-label-left" style="display:block;margin-bottom:6px;">Note text</label>
          <textarea
            v-model="noteText"
            rows="6"
            maxlength="10000"
            placeholder="Type the note here…"
            style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:13px;"
          ></textarea>
          <p v-if="noteError" class="form-error" role="alert" style="color:#b91c1c;font-size:12px;margin-top:6px;">
            {{ noteError }}
          </p>
        </div>
        <div class="modal-foot" style="padding: 12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"   @click="noteModalOpen = false" :disabled="noteSaving">CANCEL</button>
          <button type="button" class="btn-action-green" @click="submitNote"            :disabled="noteSaving">
            {{ noteSaving ? 'SAVING…' : 'SAVE' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { casesService }     from '@/services/cases.service.js'
import { customersService } from '@/services/customers.service.js'
import { journeyService }   from '@/services/journey.service.js'
import { vehiclesService }  from '@/services/vehicles.service.js'
import { actionsService }   from '@/services/actions.service.js'
import { courtsService }    from '@/services/courts.service.js'
import { paymentsService }  from '@/services/payments.service.js'

const route = useRoute()
const router = useRouter()
const headerOpen = ref(true)
const activeTab = ref('actions')

// Edit vs view authority — clicking "Edit" from the case list adds
// ?mode=edit. Every other entry (case-number link, audit drill-in, linked
// case modal, quick search) opens this view read-only, no EDIT button.
const isEditMode = computed(() => route.query.mode === 'edit')
const perPage = ref(10)
const sortKey = ref('datetime')
const sortDir = ref('desc')
const lastUpdated = ref(currentTime())

const loading  = ref(false)
const loadError = ref('')

// Per-related-record diagnostic state. Three flags each:
//   linked    — case row carries the FK (customer_id / journey_id is set)
//   loaded    — the related fetch returned a non-empty record
//   error     — message from a failed related fetch
// These drive the small banners on the Customer Details / Journey Details
// tabs so we can tell "not linked" vs "linked but lookup failed" vs "fine".
const customerLinked = ref(false)
const customerLoaded = ref(false)
const customerError  = ref('')
const journeyLinked  = ref(false)
const journeyLoaded  = ref(false)
const journeyError   = ref('')

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Render an ISO 8601 datetime/date string as DD/MM/YYYY. Returns '' for falsy.
function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Render an ISO 8601 datetime as "DD/MM/YYYY HH:mm" — used for the audit
// log and any other timestamp where the time matters.
function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date} ${time}`
}

// Render an ISO 8601 datetime as HH:mm. Used for the journey travel time.
function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Years between an ISO date and today; '' when input is falsy / invalid
// OR when the date is today/in the future (a 0-year-old isn't a real value
// to display — return '' so the field renders blank instead of misleading).
function ageFromDob(iso) {
  if (!iso) return ''
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  if (age < 1) return ''
  return age
}

const caseDetails = reactive({
  customerName:  '',
  offenceDate:   '',
  closureReason: '',
  caseStatus:    '',
  closureDate:   '',
  caseNumber:    '',
  caseIssuer:    '',
  caseType:      '',
})

async function loadCase() {
  const caseId = route.params.caseid
  if (!caseId) {
    loadError.value = 'No case id in URL.'
    return
  }
  loading.value = true
  loadError.value = ''
  // Reset all per-record diagnostic state before re-fetching.
  customerLinked.value = false
  customerLoaded.value = false
  customerError.value  = ''
  journeyLinked.value  = false
  journeyLoaded.value  = false
  journeyError.value   = ''
  try {
    const c = await casesService.get(caseId)
    // Temp trace — handy when "the details aren't showing" so you can see
    // whether the case row even references a customer / journey.
    // eslint-disable-next-line no-console
    console.debug('[case-detail] loaded case', {
      case_id:     c.case_id,
      case_num:    c.case_num,
      customer_id: c.customer_id,
      journey_id:  c.journey_id,
    })

    caseDetails.caseNumber    = c.case_num || ''
    caseDetails.caseType      = c.case_type_code || c.case_type_description || ''
    caseDetails.caseStatus    = c.case_status_desc || ''
    caseDetails.offenceDate   = fmtDate(c.case_dt)
    caseDetails.closureDate   = fmtDate(c.closure_dt)
    caseDetails.closureReason = c.closure_reason || ''
    caseDetails.caseIssuer    = c.case_issuer || ''

    customerLinked.value = Boolean(c.customer_id)
    journeyLinked.value  = Boolean(c.journey_id)

    // Signature flags live on the case row itself; map to the same control
    // value the Add form uses ('1' = refuse, '2' = unable, '' = signed).
    if (c.refuse_to_sign) customer.customerSignature = 'Refuse to sign'
    else if (c.unable_to_sign) customer.customerSignature = 'Unable to sign'
    else customer.customerSignature = 'Signature provided'

    // Hydrate all related records in parallel — none blocks the others and
    // a failure on one leaves the rest of the page usable. Tabs whose
    // backend already exists (audit / offences / actions / court / payment)
    // are fetched here; missing-backend tabs (notes / attachments / appeal
    // / linked cases / email log / letters log) stay empty for now.
    const [
      custResult, jrnResult, descResult, verResult,
      auditResult, offResult, actsResult, courtResult, bookingResult, payResult,
      notesResult, linkedResult, attResult, vehResult,
    ] = await Promise.allSettled([
      c.customer_id ? customersService.get(c.customer_id)            : Promise.resolve(null),
      c.journey_id  ? journeyService.get(c.journey_id)              : Promise.resolve(null),
      c.customer_id ? customersService.getDescription(c.customer_id) : Promise.resolve(null),
      casesService.getVerification(c.case_id),
      casesService.listAudit(c.case_id),
      casesService.listOffences(c.case_id),
      actionsService.listByCase(c.case_id),
      c.court_id          ? courtsService.get(c.court_id)             : Promise.resolve(null),
      c.court_booking_id  ? courtsService.getBooking(c.court_booking_id)   : Promise.resolve(null),
      paymentsService.listByCase(c.case_id),
      casesService.listNotes(c.case_id),
      casesService.listLinked(c.case_id),
      casesService.listAttachments(c.case_id),
      c.vehicle_id  ? vehiclesService.get(c.vehicle_id)              : Promise.resolve(null),
    ])

    // Description + verification are optional sub-records — a 404 just
    // means the operator didn't fill those fields. Swallow 404s silently;
    // surface other failures on the existing per-tab banners.
    if (descResult.status === 'fulfilled' && descResult.value) {
      hydrateDescription(descResult.value)
    }
    if (verResult.status === 'fulfilled' && verResult.value) {
      hydrateVerification(verResult.value)
    }

    if (custResult.status === 'fulfilled' && custResult.value) {
      hydrateCustomer(custResult.value)
      customerLoaded.value = true
      const fullName = [custResult.value.title, custResult.value.first_name, custResult.value.surname]
        .filter(Boolean).join(' ').trim()
      caseDetails.customerName = fullName || `Customer #${c.customer_id}`
    } else if (custResult.status === 'rejected') {
      customerError.value = custResult.reason?.data?.detail
        || custResult.reason?.message
        || 'Customer lookup failed.'
      caseDetails.customerName = c.customer_id ? `Customer #${c.customer_id}` : '—'
    } else {
      caseDetails.customerName = c.customer_id ? `Customer #${c.customer_id}` : '—'
    }

    if (jrnResult.status === 'fulfilled' && jrnResult.value) {
      hydrateJourney(jrnResult.value)
      journeyLoaded.value = true
    } else if (jrnResult.status === 'rejected') {
      journeyError.value = jrnResult.reason?.data?.detail
        || jrnResult.reason?.message
        || 'Journey lookup failed.'
    }

    // Audit, offences, actions, court+booking, payments — populate the
    // existing reactive shells. Failures stay silent (the tab just shows
    // the empty-state row); we already trace `[case-detail] loaded case`
    // to DevTools so the operator can spot a 404/500 there.
    if (auditResult.status === 'fulfilled' && Array.isArray(auditResult.value)) {
      auditLog.value = auditResult.value.map((a, i) => ({
        id:          a.audit_history_id || i,
        datetime:    fmtDateTime(a.history_dt || a.created_dt),
        user:        a.history_user || a.created_by || '',
        description: a.history_desc || '',
      }))
    }
    if (offResult.status === 'fulfilled' && Array.isArray(offResult.value)) {
      offences.value = offResult.value
    }
    if (actsResult.status === 'fulfilled' && actsResult.value) {
      const rows = actsResult.value.results ?? actsResult.value ?? []
      actions.value = rows.map((a, i) => ({
        id:         a.action_id || i,
        holder:     a.holder || '',
        action:     a.title || a.action_name || a.description || '',
        targetDate: fmtDate(a.action_due_dt),
        actioned:   fmtDate(a.actioned_dt),
        status:     a.action_status_desc || a.action_status_id || '',
      }))
    }
    if (courtResult.status === 'fulfilled' && courtResult.value) {
      court.court           = courtResult.value.name || ''
      court.courtReference  = courtResult.value.court_reference || ''
    }
    if (bookingResult.status === 'fulfilled' && bookingResult.value) {
      court.courtBooking = `${bookingResult.value.court_name || ''} — ${fmtDateTime(bookingResult.value.start_dt)}`.trim()
    }
    if (payResult.status === 'fulfilled' && payResult.value) {
      const rows = payResult.value.results ?? payResult.value ?? []
      const totalPaid = rows.reduce((sum, r) => sum + (Number(r.paid_amount) || 0), 0)
      payment.paid          = totalPaid.toFixed(2)
      // amount_due lives on the case row itself (set on the case header above).
      const due = Number(c.amount_due || 0)
      payment.amountDue     = due ? due.toFixed(2) : ''
      payment.outstanding   = (due ? (due - totalPaid) : 0).toFixed(2)
    }
    if (notesResult.status === 'fulfilled' && Array.isArray(notesResult.value)) {
      notes.value = notesResult.value.map(n => ({
        id:       n.note_id,
        datetime: fmtDateTime(n.created_dt),
        author:   n.author || n.created_by || '',
        note:     n.description || '',
      }))
    }
    if (linkedResult.status === 'fulfilled' && Array.isArray(linkedResult.value)) {
      linkedCases.value = linkedResult.value
    }
    if (vehResult.status === 'fulfilled' && vehResult.value) {
      hydrateVehicle(vehResult.value)
    }
    if (attResult.status === 'fulfilled' && Array.isArray(attResult.value)) {
      // Map backend fields to the keys the existing Attachments tab template
      // already binds to: id / datetime / uploader / filename / size.
      attachments.value = attResult.value.map(a => ({
        id:       a.attachment_id,
        datetime: fmtDateTime(a.created_dt),
        uploader: a.author || a.created_by || '',
        filename: a.filename || '',
        size:     a.filesize_kb != null ? `${a.filesize_kb} KB` : '',
      }))
    }

    lastUpdated.value = currentTime()
  } catch (err) {
    loadError.value = err?.data?.detail || err?.message || 'Failed to load case.'
  } finally {
    loading.value = false
  }
}

function hydrateCustomer(c) {
  customer.title           = c.title          || ''
  customer.firstName       = c.first_name     || ''
  customer.lastName        = c.surname        || ''
  customer.email           = c.email          || ''
  customer.telephone       = c.contact_number || ''
  customer.mobileTelephone = c.contact_number || ''  // single column in legacy schema
  customer.postcode        = c.post_code      || ''
  customer.address1        = c.address1       || ''
  customer.address2        = c.address2       || ''
  customer.town            = c.city_town      || ''
}

function hydrateDescription(d) {
  // DOB is stored on revp_customer_desc; age is derived for display.
  // Suppress DOB rendering when the stored value resolves to today or
  // a future date (legacy artefact from when the form let the user
  // accidentally pick today) — show blank rather than a misleading value.
  const ageVal = ageFromDob(d.date_of_birth)
  customer.dob = ageVal === '' ? '' : fmtDate(d.date_of_birth)
  customer.age = ageVal !== '' ? ageVal : ''
  customer.employmentStatus = d.occupation      || ''
  customer.parentGuardian   = d.parent_guardian || ''
  // gender comes back as 'M' / 'F' / 'O'; the template radios compare to
  // 'Male' / 'Female' / 'Other', so map back to the long form.
  const g = (d.gender || '').toUpperCase()
  customer.gender = g === 'M' ? 'Male' : g === 'F' ? 'Female' : g === 'O' ? 'Other' : ''
}

function hydrateVerification(v) {
  customer.verificationType  = v.verification_type || ''
  customer.verificationNotes = v.additional_info   || ''
}

function hydrateVehicle(v) {
  // Map backend snake_case to the local reactive shape used by the
  // Car Park sub-section. Time fields can come back as 'HH:MM:SS' or
  // 'HH:MM' depending on the storage path — we just display the string.
  vehicle.vehicleId              = v.vehicle_id   || ''
  vehicle.regNum                 = v.reg_num      || ''
  vehicle.colour                 = v.colour       || ''
  vehicle.manufacturer           = v.manufacturer || ''
  vehicle.model                  = v.model        || ''
  vehicle.issueReason            = v.issue_for_reason || ''
  vehicle.carParkLocation        = v.car_park_location || v.station_name || ''
  vehicle.offenceFrom            = v.offence_from || ''
  vehicle.offenceTo              = v.offence_to   || ''
  vehicle.payDisplayTicketNum    = v.pay_display_ticket_num    || ''
  vehicle.payDisplayTicketExpiry = v.pay_display_ticket_expiry || ''
  vehicle.carparkDetails         = v.carpark_details || ''
  // POPLA fields — defensive: backend may not return these yet.
  vehicle.poplaAppeal     = Boolean(v.popla_appeal)
  vehicle.poplaStartDate  = v.popla_start_date || ''
  vehicle.poplaEndDate    = v.popla_end_date   || ''
  vehicle.poplaReference  = v.popla_reference  || ''
  vehicle.poplaAccepted   = Boolean(v.popla_accepted)
}

function hydrateJourney(j) {
  journey.place           = j.place              || ''
  journey.journeyFrom     = j.journey_from       || ''
  journey.journeyTo       = j.journey_to         || ''
  journey.travelDate      = fmtDate(j.travel_dt)
  journey.travelTime      = fmtTime(j.travel_dt)
  journey.trainServiceId  = j.headcode           || ''
  journey.smartcardNumber = j.smartcard_number   || ''
  journey.fareDue         = j.fare_travelled != null ? String(j.fare_travelled) : ''
  journey.alreadyPaid     = j.fare_paid != null     ? String(j.fare_paid)        : ''
  // outstanding = travelled − paid; show '' when neither side has a value
  const t = Number(j.fare_travelled || 0)
  const p = Number(j.fare_paid || 0)
  journey.outstanding = (j.fare_travelled != null || j.fare_paid != null)
    ? (t - p).toFixed(2)
    : ''
  journey.reasonForIssue = j.reason_for_issue || ''
}

function refresh() { loadCase() }

// Customer / journey / court / settlement / payment / actions / notes /
// attachments / auditLog all live in child tables that don't yet have
// dedicated endpoints — see CLAUDE.md plan.md for the backlog. The shells
// below render empty so the UI is honest about what we know vs. what's TBD.
const customer = reactive({
  title: '', firstName: '', lastName: '', dob: '', age: '', gender: '',
  telephone: '', mobileTelephone: '', email: '', employmentStatus: '',
  parentGuardian: '', postcode: '', address1: '', address2: '', town: '',
  verificationType: '', verificationNotes: '', customerSignature: '',
})

const journey = reactive({
  reasonForIssue: '', railCard: '', place: '', journeyFrom: '', journeyTo: '',
  travelTime: '', travelDate: '', trainServiceId: '', smartcardNumber: '',
  fareDue: '', additionalPenalty: '', totalDue: '', alreadyPaid: '', outstanding: '',
})

// Car Park / PCN vehicle data — only populated when the case has
// revp_case.vehicle_id set. Legacy parity: a case has either a journey
// or a vehicle, never both. Surfaced in the Car Park sub-section we
// render conditionally inside the Journey Details tab.
const vehicle = reactive({
  vehicleId: '',
  regNum: '',
  colour: '',
  manufacturer: '',
  model: '',
  issueReason: '',
  carParkLocation: '',
  offenceFrom: '',
  offenceTo: '',
  payDisplayTicketNum: '',
  payDisplayTicketExpiry: '',
  carparkDetails: '',
  // POPLA appeal section — legacy parity placeholders until the backend
  // exposes these columns. Render disabled so the layout matches the
  // legacy Car Parking Details screen even when the data isn't wired.
  poplaAppeal: false,
  poplaStartDate: '',
  poplaEndDate: '',
  poplaReference: '',
  poplaAccepted: false,
})
const hasVehicle = computed(() => Boolean(vehicle.vehicleId))

const court = reactive({
  court: '', courtBooking: '', courtReference: '',
  courtResult: '', costs: '', compensation: '', fine: '', victim: '',
  preventRailPay: false,
})

const settlement = reactive({
  outstandingFare: '', adminCosts: '', automaticDues: '',
  manualSettlements: '', oocsAmount: '', manualDues: '',
  totalAdminCost: '', notes: '',
})

const payment = reactive({
  amountDue: '', paid: '', outstanding: '', discounted: '',
})

const actions = ref([])
const offences = ref([])
const notes = ref([])
const attachments = ref([])
const selectedAttachments = ref([])
function toggleAttachment(id) {
  const idx = selectedAttachments.value.indexOf(id)
  idx === -1 ? selectedAttachments.value.push(id) : selectedAttachments.value.splice(idx, 1)
}

const auditLog = ref([])
const linkedCases = ref([])

// Add-Note modal state — small inline modal triggered from the Notes tab.
const noteModalOpen = ref(false)
const noteText      = ref('')
const noteSaving    = ref(false)
const noteError     = ref('')

onMounted(loadCase)

const tabs = computed(() => [
  { id: 'actions',     label: 'ACTIONS' },
  { id: 'customer',    label: 'CUSTOMER DETAILS' },
  { id: 'journey',     label: hasVehicle.value ? 'CAR PARKING DETAILS' : 'JOURNEY DETAILS' },
  { id: 'offences',    label: 'OFFENCES' },
  { id: 'court',       label: 'COURT/SUMMONS DETAILS' },
  { id: 'payment',     label: 'PAYMENT / DUE' },
  { id: 'appeal',      label: 'APPEAL' },
  { id: 'notes',       label: `NOTES (${notes.value.length})` },
  { id: 'attachments', label: `ATTACHMENTS (${attachments.value.length})` },
  { id: 'audit',       label: 'AUDIT' },
  { id: 'email',       label: 'EMAIL' },
  { id: 'letters',     label: 'LETTERS (0)' },
  { id: 'linked',      label: `LINKED CASES (${linkedCases.value.length})` }
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
function addNote() {
  noteText.value     = ''
  noteError.value    = ''
  noteSaving.value   = false
  noteModalOpen.value = true
}

async function submitNote() {
  const text = (noteText.value || '').trim()
  if (!text) {
    noteError.value = 'Note text is required.'
    return
  }
  noteSaving.value = true
  noteError.value  = ''
  try {
    const created = await casesService.createNote(route.params.caseid, text)
    // Prepend so the new note is visible at the top without re-fetching.
    notes.value.unshift({
      id:       created.note_id,
      datetime: fmtDateTime(created.created_dt),
      author:   created.author || created.created_by || '',
      note:     created.description || '',
    })
    noteModalOpen.value = false
  } catch (err) {
    noteError.value = err?.data?.detail
      || err?.data?.description?.[0]
      || err?.message
      || 'Failed to save note.'
  } finally {
    noteSaving.value = false
  }
}

function openLinkedCase(row) {
  // Jump to the linked case's detail page in the same tab. Vue Router
  // re-mounts CaseDetailsView with the new :caseid, so loadCase fires
  // again and the page repopulates for the new case.
  if (row?.case_id) {
    router.push({ name: 'case-details', params: { caseid: row.case_id } })
  }
}
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
// ── Linked Cases controls ────────────────────────────────────────────────────
// Single-select: the row that's currently checked in the Linked Cases table.
// Drives OPEN SELECTED CASE + UNLINK SELECTED CASE.
const selectedLinkedId = ref('')

// LINK ADDITIONAL CASE modal state — populated from the /linkable/ endpoint
// which mirrors legacy getLinkedCasesRecordCount(param=1).
const linkModalOpen     = ref(false)
const linkSuggestions   = ref([])
const linkSelectedCaseId = ref('')
const linkLoading       = ref(false)
const linkError         = ref('')

function selectedLinkedRow() {
  return linkedCases.value.find(r => r.linked_id === selectedLinkedId.value) || null
}

function openSelectedLinkedCase() {
  const row = selectedLinkedRow()
  if (!row) {
    loadError.value = 'Select a linked case first.'
    setTimeout(() => { if (loadError.value === 'Select a linked case first.') loadError.value = '' }, 2500)
    return
  }
  router.push({ name: 'case-details', params: { caseid: row.case_id } })
}

async function unlinkSelectedCase() {
  const row = selectedLinkedRow()
  if (!row) {
    loadError.value = 'Select a linked case first.'
    setTimeout(() => { if (loadError.value === 'Select a linked case first.') loadError.value = '' }, 2500)
    return
  }
  if (!window.confirm(`Unlink case ${row.case_num} from this case?`)) return
  try {
    await casesService.unlink(route.params.caseid, row.linked_id)
    linkedCases.value = linkedCases.value.filter(r => r.linked_id !== row.linked_id)
    selectedLinkedId.value = ''
  } catch (err) {
    loadError.value = err?.data?.detail || err?.message || 'Failed to unlink case.'
  }
}

async function linkAdditionalCase() {
  linkModalOpen.value   = true
  linkSelectedCaseId.value = ''
  linkError.value       = ''
  linkLoading.value     = true
  try {
    const res = await casesService.listLinkable(route.params.caseid)
    linkSuggestions.value = Array.isArray(res) ? res : []
  } catch (err) {
    linkError.value = err?.data?.detail || err?.message || 'Failed to load suggestions.'
    linkSuggestions.value = []
  } finally {
    linkLoading.value = false
  }
}

async function confirmLink() {
  if (!linkSelectedCaseId.value) {
    linkError.value = 'Select a case to link.'
    return
  }
  linkError.value = ''
  try {
    await casesService.link(route.params.caseid, linkSelectedCaseId.value)
    linkModalOpen.value = false
    // Re-fetch the linked list so the new row + its display fields appear.
    const fresh = await casesService.listLinked(route.params.caseid)
    if (Array.isArray(fresh)) linkedCases.value = fresh
  } catch (err) {
    linkError.value = err?.data?.detail
      || err?.data?.linked_case_id
      || err?.message
      || 'Failed to link case.'
  }
}
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
.refresh-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-strong); }
.refresh-btn:disabled { opacity: 0.6; cursor: progress; }
.updated-time { color: var(--text-light); }
.case-load-banner {
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
}
.case-load-banner-error { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.tab-hint {
  margin: 0 0 14px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
}
.tab-hint-info  { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.tab-hint-error { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
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

.case-mode-hint { display: flex; align-items: center; }
.view-only-pill {
  display: inline-block;
  padding: 4px 12px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
