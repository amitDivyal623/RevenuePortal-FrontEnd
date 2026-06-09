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

          <!-- Offence Date — editable -->
          <div class="ch-field">
            <label>Offence Date</label>
            <input v-if="isEditMode" v-model="editForm.case_dt" type="date" class="field-editable" />
            <input v-else :value="caseDetails.offenceDate" readonly class="field-readonly" />
          </div>

          <!-- Case Status — editable (select bound to id, options from statusOptions) -->
          <div class="ch-field">
            <label>Case Status</label>
            <select v-if="isEditMode" v-model="editForm.case_status_id" class="field-editable">
              <option value="">Please select</option>
              <option v-for="s in statusOptions" :key="s.case_status_id" :value="s.case_status_id">
                {{ s.status_desc }}
              </option>
            </select>
            <select v-else :value="caseDetails.caseStatus" disabled class="field-readonly">
              <option>{{ caseDetails.caseStatus }}</option>
            </select>
          </div>

          <div class="ch-field"><label>Case Issuer</label><input :value="caseDetails.caseIssuer" readonly class="field-readonly" /></div>

          <!-- Closure Reason — editable as free text (no canonical list yet) -->
          <div class="ch-field">
            <label>Closure Reason</label>
            <input
              v-if="isEditMode"
              v-model="editForm.closure_reason"
              type="text"
              maxlength="200"
              placeholder="Closure Reason"
              class="field-editable"
            />
            <input v-else :value="caseDetails.closureReason" readonly placeholder="Closure Reason" class="field-readonly" />
          </div>

          <!-- Closure Date — editable -->
          <div class="ch-field">
            <label>Closure Date</label>
            <input v-if="isEditMode" v-model="editForm.closure_dt" type="date" class="field-editable" />
            <input v-else :value="caseDetails.closureDate" readonly placeholder="Closure Date" class="field-readonly" />
          </div>
          <div class="ch-field"><label>Case Type</label>
            <select :value="caseDetails.caseType" disabled class="field-readonly">
              <option>{{ caseDetails.caseType }}</option>
            </select>
          </div>
        </div>

        <!-- Header action bar: EDIT button only — Save/Cancel live at the
             bottom-right of the page (below the tabs) to match legacy layout. -->
        <div class="mt-md case-mode-hint" style="display:flex;gap:8px;">
          <button v-if="!isEditMode" class="btn-edit" @click="enterEditMode">EDIT</button>
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
            <!-- Disabled until at least one row is checked; busy while the API call runs.
                 Also locked when the case is CLOSED. -->
            <button class="btn-action-light"
                    :disabled="selectedActionCount === 0 || actionBusy || isCaseClosed"
                    @click="closeAction">CLOSE &amp; ACTION</button>
            <!-- Edit requires exactly one row selected; locked on closed cases. -->
            <button class="btn-action-light"
                    :disabled="selectedActionCount !== 1 || isCaseClosed"
                    @click="editAction">EDIT ACTION</button>
            <button class="btn-action-light"
                    :disabled="isCaseClosed"
                    @click="addNewAction">ADD NEW ACTION</button>
            <button class="btn-action-green"
                    :disabled="actions.length === 0"
                    @click="exportExcel('actions')">EXPORT EXCEL</button>
          </div>
        </div>
        <div v-if="actionError" class="tab-hint tab-hint-error" role="alert" style="margin-top:8px;">
          {{ actionError }}
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
                <th class="col-icon">
                  <input type="checkbox"
                         :checked="allActionsSelected"
                         :indeterminate="selectedActionCount > 0 && !allActionsSelected"
                         :disabled="isCaseClosed"
                         @change="toggleAllActions"
                         aria-label="Select all actions" />
                </th>
                <th>Holder</th>
                <th>Action</th>
                <th>Target Date</th>
                <th>Actioned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in actions" :key="row.id"
                  :class="{
                    'row-faded':    (row.status || '').toUpperCase() === 'PENDING',
                    'row-selected': selectedActionIds.has(row.id),
                  }">
                <td class="col-icon">
                  <input type="checkbox"
                         :checked="selectedActionIds.has(row.id)"
                         :disabled="isCaseClosed"
                         @change="toggleAction(row.id)"
                         :aria-label="`Select action ${row.id}`" />
                </td>
                <td>{{ row.holder }}</td>
                <td>{{ row.action }}</td>
                <td>{{ row.targetDate }}</td>
                <td>{{ row.actioned }}</td>
                <td>{{ row.status }}</td>
              </tr>
              <tr v-if="actions.length === 0">
                <td colspan="6">
                  <div class="empty-state"><p class="empty-state-desc">No actions on this case.</p></div>
                </td>
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
              <select v-if="isEditMode" v-model="customerForm.title"
                      @change="onTitleChange(customerForm.title)"
                      class="field-editable">
                <option value="">Please Select</option>
                <option v-for="t in titleOptions" :key="t.lookup_data_id" :value="t.lookup_data_value">{{ t.lookup_data_value }}</option>
              </select>
              <input v-else :value="customer.title" readonly class="field-readonly" />

              <template v-if="isEditMode && customerForm.title === 'Other'">
                <label class="form-label-left">Other Title</label>
                <input v-model="customerForm.other_title" maxlength="20" placeholder="Specify title" class="field-editable" />
              </template>
              <template v-else-if="!isEditMode && customer.title === 'Other' && customer.otherTitle">
                <label class="form-label-left">Other Title</label>
                <input :value="customer.otherTitle" readonly class="field-readonly" />
              </template>

              <label class="form-label-left">First Name</label>
              <input v-if="isEditMode" v-model="customerForm.first_name" maxlength="100" class="field-editable" />
              <input v-else :value="customer.firstName" readonly class="field-readonly" />

              <label class="form-label-left">Last Name</label>
              <input v-if="isEditMode" v-model="customerForm.surname" maxlength="100" class="field-editable" />
              <input v-else :value="customer.lastName" readonly class="field-readonly" />

              <label class="form-label-left">Date of Birth</label>
              <input v-if="isEditMode" v-model="customerForm.date_of_birth" type="date" class="field-editable" />
              <input v-else :value="customer.dob" readonly class="field-readonly" />

              <label class="form-label-left">Age</label>
              <!-- Age is derived from DOB; always read-only. -->
              <input :value="isEditMode ? customerAgeDerived : customer.age" readonly class="field-readonly" />

              <label class="form-label-left">Gender</label>
              <div class="radio-row">
                <label class="radio-item">
                  <input type="radio" value="Male"
                         :checked="isEditMode ? customerForm.gender === 'Male' : customer.gender === 'Male'"
                         :disabled="!isEditMode"
                         @change="isEditMode && (customerForm.gender = 'Male')" /> Male
                </label>
                <label class="radio-item">
                  <input type="radio" value="Female"
                         :checked="isEditMode ? customerForm.gender === 'Female' : customer.gender === 'Female'"
                         :disabled="!isEditMode"
                         @change="isEditMode && (customerForm.gender = 'Female')" /> Female
                </label>
                <label class="radio-item">
                  <input type="radio" value="Other"
                         :checked="isEditMode ? customerForm.gender === 'Other' : customer.gender === 'Other'"
                         :disabled="!isEditMode"
                         @change="isEditMode && (customerForm.gender = 'Other')" /> Other
                </label>
              </div>

              <label class="form-label-left">Telephone</label>
              <div>
                <input v-if="isEditMode"
                       v-model="customerForm.contact_number"
                       maxlength="30"
                       class="field-editable"
                       style="width:100%;"
                       @input="contactNumberError = _validateContactNumber(customerForm.contact_number)" />
                <input v-else :value="customer.telephone" readonly class="field-readonly" />
                <span v-if="isEditMode && contactNumberError" class="form-error" style="font-size:11px;color:#b91c1c;display:block;margin-top:2px;">
                  {{ contactNumberError }}
                </span>
              </div>

              <label class="form-label-left">Mobile Telephone</label>
              <input v-if="isEditMode" v-model="customerForm.mobile" maxlength="45" placeholder="Mobile Number" class="field-editable" />
              <input v-else :value="customer.mobileTelephone" readonly placeholder="Mobile Number" class="field-readonly" />

              <label class="form-label-left">E-mail Address</label>
              <input v-if="isEditMode" v-model="customerForm.email" type="email" maxlength="100" class="field-editable" />
              <input v-else :value="customer.email" readonly class="field-readonly" />

              <label class="form-label-left">Employment Status</label>
              <input v-if="isEditMode" v-model="customerForm.occupation" maxlength="45" placeholder="e.g. Student, Engineer" class="field-editable" />
              <input v-else :value="customer.employmentStatus" readonly class="field-readonly" />

              <label class="form-label-left">Parent/Guardian</label>
              <input v-if="isEditMode" v-model="customerForm.parent_guardian" maxlength="200" class="field-editable" />
              <input v-else :value="customer.parentGuardian" readonly class="field-readonly" />
            </div>

            <!-- Shown only when the case was submitted via 'Unknown (Customer Input)'.
                 Mirrors legacy EditAddress fuseaction customerInputReconciled flag. -->
            <div v-if="caseDetails.caseIssuer === 'Unknown (Customer Input)'"
                 class="form-row-left mt-md">
              <label class="form-label-left" style="width:auto;margin-right:8px;">Customer Input Reconciled</label>
              <input v-if="isEditMode" type="checkbox" v-model="customerForm.customer_input_reconciled" />
              <input v-else type="checkbox" :checked="customer.customerInputReconciled" disabled />
            </div>

            <!-- ADD DESCRIPTION — visible in both view and edit mode.
                 In view mode the modal opens read-only (fieldset disabled).
                 In edit mode the operator can fill in / update and Save. -->
            <button v-if="customerLinked" class="btn-action-light mt-md" @click="openDescriptionModal">SHOW DESCRIPTION</button>
          </fieldset>

          <div class="right-stack">
            <fieldset class="legend-group">
              <legend>Address</legend>
              <div class="form-row-left">
                <label class="form-label-left">Postcode</label>
                <div class="field-cell" style="position:relative">
                  <div class="input-with-icon">
                    <input v-if="isEditMode" v-model="customerForm.post_code" maxlength="10" class="field-editable"
                           @keyup.enter.prevent="performAddressSearch" />
                    <input v-else :value="customer.postcode" readonly class="field-readonly" />
                    <button type="button" class="help-icon"
                            title="Search addresses for this postcode"
                            :disabled="!isEditMode || addressLookupLoading"
                            @click="performAddressSearch">?</button>
                  </div>
                  <ul v-if="addressSuggestions.length" class="address-suggest-popover" role="listbox">
                    <li v-for="(a, i) in addressSuggestions" :key="i"
                        class="address-suggest-row" role="option" tabindex="0"
                        @click="applySuggestion(a)"
                        @keyup.enter="applySuggestion(a)">
                      {{ a.label || [a.line_1, a.town, a.county, a.postcode].filter(Boolean).join(', ') }}
                    </li>
                  </ul>
                  <span v-if="addressLookupError" class="form-error" role="alert">{{ addressLookupError }}</span>
                  <span v-else-if="addressLookupInfo" class="form-info" role="status">{{ addressLookupInfo }}</span>
                </div>

                <label class="form-label-left">Address 1</label>
                <input v-if="isEditMode" v-model="customerForm.address1" maxlength="200" class="field-editable" />
                <input v-else :value="customer.address1" readonly class="field-readonly" />

                <label class="form-label-left">Address 2</label>
                <input v-if="isEditMode" v-model="customerForm.address2" maxlength="200" placeholder="Address 2" class="field-editable" />
                <input v-else :value="customer.address2" readonly placeholder="Address 2" class="field-readonly" />

                <label class="form-label-left">Town</label>
                <input v-if="isEditMode" v-model="customerForm.city_town" maxlength="200" class="field-editable" />
                <input v-else :value="customer.town" readonly class="field-readonly" />

                <label class="form-label-left">County</label>
                <input v-if="isEditMode" v-model="customerForm.county" maxlength="100" class="field-editable" />
                <input v-else :value="customer.county" readonly class="field-readonly" />

                <label class="form-label-left">Country</label>
                <input v-if="isEditMode" v-model="customerForm.country" maxlength="50" class="field-editable" />
                <input v-else :value="customer.country" readonly class="field-readonly" />
              </div>
              <div class="flex gap-sm mt-md" style="justify-content: space-between">
                <button class="btn-action-light"
                        :disabled="!isEditMode"
                        @click="openAddressReferenceModal">ENTER ADDRESS SEARCH REFERENCE</button>
                <button class="btn-action-light"
                        :disabled="!isEditMode"
                        @click="openOffenderSearchModal">PERFORM ADDRESS SEARCH</button>
              </div>
              <p v-if="customerForm.addressSearchReference" class="ref-pill">
                Address reference: <strong>{{ customerForm.addressSearchReference }}</strong>
                <button type="button" class="ref-clear" title="Clear" @click="customerForm.addressSearchReference = ''">×</button>
              </p>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Manual Verification</legend>
              <div class="form-row-left">
                <label class="form-label-left">Verification Type</label>
                <select v-if="isEditMode" v-model="customerForm.verification_type" class="field-editable">
                  <option value="">Please Select</option>
                  <option v-for="v in verificationTypeOptions" :key="v.lookup_data_id" :value="v.lookup_data_value">{{ v.lookup_data_value }}</option>
                </select>
                <input v-else :value="customer.verificationType" readonly class="field-readonly" />

                <label class="form-label-left">Verification Notes</label>
                <input v-if="isEditMode" v-model="customerForm.additional_info" maxlength="100" class="field-editable" />
                <input v-else :value="customer.verificationNotes" readonly class="field-readonly" />
              </div>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Customer signature</legend>
              <div class="form-row-left">
                <label class="form-label-left">Customer Signature</label>
                <select v-if="isEditMode" v-model="customerForm.customer_signature" class="field-editable">
                  <option value="">Please Select</option>
                  <option v-for="s in SIGNATURE_OPTIONS" :key="s.value" :value="s.value">{{ s.value }}</option>
                </select>
                <select v-else :value="customer.customerSignature" disabled class="field-readonly">
                  <option>{{ customer.customerSignature }}</option>
                </select>
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
        <!-- CAR PARKING DETAILS sub-section — shown for every PCN-type case.
             If the case row carries vehicle_id, render the full Vehicle /
             Offence Times / Offence Location / POPLA layout. If not, show
             an explanatory empty-state so the operator knows the Car Park
             section was left blank when the case was added. -->
        <template v-if="isPcnCase">
          <div v-if="!hasVehicle" class="tab-hint tab-hint-info">
            No car park details were filled in when this PCN case was created.
          </div>
          <div v-else class="two-col">
            <div>
              <fieldset class="legend-group">
                <legend>Vehicle details</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Registration number</label>
                  <input v-if="isEditMode" v-model="vehicleForm.reg_num" class="field-editable" />
                  <input v-else :value="vehicle.regNum" readonly class="field-readonly" />

                  <label class="form-label-left">Manufacturer</label>
                  <input v-if="isEditMode" v-model="vehicleForm.manufacturer" class="field-editable" />
                  <input v-else :value="vehicle.manufacturer" readonly class="field-readonly" />

                  <label class="form-label-left">Model</label>
                  <input v-if="isEditMode" v-model="vehicleForm.model" class="field-editable" />
                  <input v-else :value="vehicle.model" readonly class="field-readonly" />

                  <label class="form-label-left">Colour</label>
                  <input v-if="isEditMode" v-model="vehicleForm.colour" class="field-editable" />
                  <input v-else :value="vehicle.colour" readonly class="field-readonly" />
                </div>
              </fieldset>

              <fieldset class="legend-group mt-lg">
                <legend>Offence Times</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Time From</label>
                  <input v-if="isEditMode" v-model="vehicleForm.offence_from" class="field-editable" placeholder="HH:MM" />
                  <input v-else :value="vehicle.offenceFrom" readonly class="field-readonly" />

                  <label class="form-label-left">Time To</label>
                  <input v-if="isEditMode" v-model="vehicleForm.offence_to" class="field-editable" placeholder="HH:MM" />
                  <input v-else :value="vehicle.offenceTo" readonly class="field-readonly" />

                  <label class="form-label-left">P&amp;D Ticket</label>
                  <input v-if="isEditMode" v-model="vehicleForm.pay_display_ticket_num" class="field-editable" />
                  <input v-else :value="vehicle.payDisplayTicketNum" readonly class="field-readonly" />

                  <label class="form-label-left">Expiry Time</label>
                  <input v-if="isEditMode" v-model="vehicleForm.pay_display_ticket_expiry" class="field-editable" placeholder="Expiry Time" />
                  <input v-else :value="vehicle.payDisplayTicketExpiry" readonly class="field-readonly" />
                </div>
              </fieldset>
            </div>

            <div>
              <fieldset class="legend-group">
                <legend>Offence Location</legend>
                <div class="form-row-left">
                  <label class="form-label-left">Reason for Issue</label>
                  <select v-if="isEditMode" v-model="vehicleForm.issue_for_reason" class="field-editable">
                    <option value="">Please Select</option>
                    <option v-for="r in pcnIssueReasonOptions" :key="r.lookup_data_id" :value="r.lookup_data_value">{{ r.lookup_data_value }}</option>
                  </select>
                  <select v-else :value="vehicle.issueReason" disabled class="field-readonly">
                    <option>{{ vehicle.issueReason }}</option>
                  </select>

                  <label class="form-label-left">Car Park Location</label>
                  <select v-if="isEditMode" v-model="vehicleForm.carpark_location_id" class="field-editable">
                    <option value="">Please Select</option>
                    <option v-for="loc in carParkLocationOptions" :key="loc.carpark_location_id" :value="loc.carpark_location_id">{{ loc.location_name }}</option>
                  </select>
                  <select v-else :value="vehicle.carParkLocationId" disabled class="field-readonly">
                    <option :value="vehicle.carParkLocationId">{{ vehicle.carParkLocation }}</option>
                  </select>

                  <label class="form-label-left">Extra Details</label>
                  <textarea v-if="isEditMode" v-model="vehicleForm.carpark_details" rows="4" class="field-editable"></textarea>
                  <textarea v-else :value="vehicle.carparkDetails" readonly rows="4" class="field-readonly"></textarea>
                </div>
              </fieldset>

              <fieldset class="legend-group mt-lg">
                <legend>POPLA</legend>
                <div class="form-row-left">
                  <label class="form-label-left">POPLA Appeal</label>
                  <input v-if="isEditMode" type="checkbox" v-model="vehicleForm.popla_appeal" />
                  <input v-else type="checkbox" :checked="vehicle.poplaAppeal" disabled />

                  <label class="form-label-left">Start Date</label>
                  <input v-if="isEditMode" v-model="vehicleForm.popla_start_dt" type="date" class="field-editable" />
                  <input v-else :value="vehicle.poplaStartDate" readonly placeholder="Start Date" class="field-readonly" />

                  <label class="form-label-left">End Date</label>
                  <input v-if="isEditMode" v-model="vehicleForm.popla_end_dt" type="date" class="field-editable" />
                  <input v-else :value="vehicle.poplaEndDate" readonly placeholder="End Date" class="field-readonly" />

                  <label class="form-label-left">Reference Number</label>
                  <input v-if="isEditMode" v-model="vehicleForm.popla_ref_num" class="field-editable" />
                  <input v-else :value="vehicle.poplaRefNum" readonly class="field-readonly" />

                  <label class="form-label-left">Accepted</label>
                  <input v-if="isEditMode" type="checkbox" v-model="vehicleForm.popla_accepted" />
                  <input v-else type="checkbox" :checked="vehicle.poplaAccepted" disabled />
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
              <select v-if="isEditMode" v-model="journeyForm.reason_for_issue" class="field-editable">
                <option value="">Please Select</option>
                <option v-for="r in reasonForIssueOptions" :key="r.lookup_data_id" :value="r.lookup_data_value">{{ r.lookup_data_value }}</option>
              </select>
              <input v-else :value="journey.reasonForIssue" readonly class="field-readonly" />

              <template v-if="isEditMode ? journeyForm.reason_for_issue === 'Failed to Carry Railcard' : journey.reasonForIssue === 'Failed to Carry Railcard'">
                <label class="form-label-left">Rail Card</label>
                <select v-if="isEditMode" v-model="journeyForm.other_reason_for_issue" class="field-editable">
                  <option value="">Please Select</option>
                  <option v-for="rc in railCardTypeOptions" :key="rc.railcard_id" :value="rc.name">{{ rc.name }}</option>
                </select>
                <input v-else :value="journey.railCard" readonly class="field-readonly" />
              </template>

              <label class="form-label-left">Questioned At</label>
              <select v-if="isEditMode" v-model="journeyForm.questionedat_id" class="field-editable">
                <option value="">Please Select</option>
                <option v-for="opt in questionAtOptions" :key="opt.id" :value="opt.id">{{ opt.description }}</option>
              </select>
              <input v-else :value="journey.questionedAt" readonly class="field-readonly" />

              <label class="form-label-left">Place</label>
              <input v-if="isEditMode" v-model="journeyForm.place" maxlength="30" class="field-editable" />
              <input v-else :value="journey.place" readonly class="field-readonly" />

              <label class="form-label-left">Journey From</label>
              <input v-if="isEditMode" v-model="journeyForm.journey_from" maxlength="45" class="field-editable" />
              <input v-else :value="journey.journeyFrom" readonly class="field-readonly" />

              <label class="form-label-left">Journey To</label>
              <input v-if="isEditMode" v-model="journeyForm.journey_to" maxlength="45" class="field-editable" />
              <input v-else :value="journey.journeyTo" readonly class="field-readonly" />

              <label class="form-label-left">Time &amp; Date of Travel</label>
              <div class="datetime-pair">
                <input v-if="isEditMode" v-model="journeyForm.travel_time" type="time" class="field-editable" />
                <input v-else :value="journey.travelTime" readonly class="field-readonly" />
                <input v-if="isEditMode" v-model="journeyForm.travel_date" type="date" class="field-editable" />
                <input v-else :value="journey.travelDate" readonly class="field-readonly" />
              </div>

              <label class="form-label-left">Train Service Id</label>
              <input v-if="isEditMode" v-model="journeyForm.headcode" maxlength="10" class="field-editable" placeholder="Train Service Id" />
              <input v-else :value="journey.trainServiceId" readonly placeholder="Train Service Id" class="field-readonly" />
            </div>

            <div class="form-row-left">
              <label class="form-label-left">Smartcard Number</label>
              <input v-if="isEditMode" v-model="journeyForm.smartcard_number" maxlength="45" class="field-editable" placeholder="Card Number" />
              <input v-else :value="journey.smartcardNumber" readonly placeholder="Card Number" class="field-readonly" />

              <label class="form-label-left">Fare Due</label>
              <div class="input-currency">
                <span class="prefix">£</span>
                <input v-if="isEditMode" v-model="journeyForm.fare_travelled" type="number" step="0.01" min="0" class="field-editable" />
                <input v-else :value="journey.fareDue" readonly class="field-readonly" />
              </div>

              <label class="form-label-left">Additional Penalty</label>
              <div class="input-currency">
                <span class="prefix">£</span>
                <input v-if="isEditMode" v-model="journeyForm.additional_penalty" type="number" step="0.01" min="0" class="field-editable" />
                <input v-else :value="journey.additionalPenalty" readonly class="field-readonly" />
              </div>

              <label class="form-label-left">Total Due</label>
              <div class="input-currency"><span class="prefix">£</span><input :value="journey.totalDue" readonly class="field-readonly" /></div>

              <label class="form-label-left">Already Paid</label>
              <div class="input-currency">
                <span class="prefix">£</span>
                <input v-if="isEditMode" v-model="journeyForm.fare_paid" type="number" step="0.01" min="0" class="field-editable" />
                <input v-else :value="journey.alreadyPaid" readonly class="field-readonly" />
              </div>

              <label class="form-label-left outstanding-label">Outstanding Balance</label>
              <div class="input-currency"><span class="prefix">£</span><input :value="journeyOutstanding" readonly class="field-readonly" /></div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in offences" :key="o.case_offence_id">
                <td>{{ o.cjs_code ? `${o.cjs_code} - ${o.description}` : o.offence_id }}</td>
                <td>{{ o.offence_charge || '—' }}</td>
                <td>{{ o.case_offence_statement || '—' }}</td>
                <td><button class="btn-action-red" @click="doRemoveOffence(o.case_offence_id)">REMOVE</button></td>
              </tr>
              <tr v-if="offences.length === 0">
                <td colspan="4"><div class="empty-state"><p class="empty-state-desc">No data available in table</p></div></td>
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
                <select v-if="isEditMode" v-model="courtForm.court_id" class="field-editable" @change="onCourtChange(courtForm.court_id)">
                  <option value="">Please Select Court</option>
                  <option v-for="c in allCourts" :key="c.court_id" :value="c.court_id">{{ c.name }}</option>
                </select>
                <select v-else :value="court.court" disabled class="field-readonly">
                  <option>{{ court.court || 'Please Select Court' }}</option>
                </select>

                <label class="form-label-left">Court Booking</label>
                <select v-if="isEditMode" v-model="courtForm.court_booking_id" class="field-editable" :disabled="!courtForm.court_id || loadingCourtBookings" @change="onCourtBookingChange(courtForm.court_booking_id)">
                  <option value="">{{ loadingCourtBookings ? 'Loading…' : 'Please Select Booking' }}</option>
                  <option v-for="b in allCourtBookings" :key="b.court_booking_id" :value="b.court_booking_id">
                    {{ fmtDateTime(b.start_dt) }} ({{ b.cases_assigned || 0 }}/{{ b.capacity }} cases)
                  </option>
                </select>
                <select v-else :value="court.courtBooking" disabled class="field-readonly">
                  <option>{{ court.courtBooking || 'Please Select Court Booking' }}</option>
                </select>

                <label class="form-label-left">Court Reference</label>
                <input v-if="isEditMode" v-model="courtForm.court_reference" maxlength="50" class="field-editable" />
                <input v-else :value="court.courtReference" readonly class="field-readonly" />
              </div>
            </fieldset>

            <fieldset class="legend-group mt-lg">
              <legend>Result</legend>
              <div class="form-row-left">
                <label class="form-label-left">Court Result</label>
                <select v-if="isEditMode" v-model="courtForm.court_result_id" class="field-editable">
                  <option value="">Please Select</option>
                  <option v-for="opt in courtResultOptions" :key="opt.lookup_data_id" :value="opt.lookup_data_id">{{ opt.lookup_data_value }}</option>
                </select>
                <select v-else :value="court.courtResult" disabled class="field-readonly">
                  <option value="">Please Select</option>
                  <option v-for="opt in courtResultOptions" :key="opt.lookup_data_id" :value="opt.lookup_data_value">{{ opt.lookup_data_value }}</option>
                </select>

                <label class="form-label-left">Costs</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.court_costs" type="number" step="0.01" min="0" class="field-editable" />
                  <input v-else :value="court.costs" readonly class="field-readonly" />
                </div>

                <label class="form-label-left">Compensation</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.court_restitution" type="number" step="0.01" min="0" class="field-editable" />
                  <input v-else :value="court.compensation" readonly class="field-readonly" />
                </div>

                <label class="form-label-left">Fine</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.court_fine" type="number" step="0.01" min="0" class="field-editable" />
                  <input v-else :value="court.fine" readonly class="field-readonly" />
                </div>

                <label class="form-label-left">Victim</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.victim_sur_charge" type="number" step="0.01" min="0" class="field-editable" />
                  <input v-else :value="court.victim" readonly class="field-readonly" />
                </div>
              </div>
              <div class="flex items-center gap-sm mt-md">
                <input v-if="isEditMode" type="checkbox" v-model="courtForm.prevent_rail_pay" />
                <input v-else type="checkbox" :checked="court.preventRailPay" disabled />
                <label class="text-sm">Prevent this case being paid through the RailPay Portal</label>
              </div>
            </fieldset>
          </div>

          <div>
            <fieldset class="legend-group">
              <legend>Settlement</legend>
              <div class="form-row-left">
                <!-- PCN-only: three readonly charge fields replace Outstanding Fare + Admin Costs -->
                <template v-if="isPcnCase">
                  <label class="form-label-left">Parking Charge Notice</label>
                  <div class="input-currency"><span class="prefix">£</span><input :value="settlement.parkingCharge" readonly class="field-readonly" /></div>

                  <label class="form-label-left">Notice to Owner</label>
                  <div class="input-currency"><span class="prefix">£</span><input :value="settlement.noticeToOwner" readonly class="field-readonly" /></div>

                  <label class="form-label-left">Charge Certificate</label>
                  <div class="input-currency"><span class="prefix">£</span><input :value="settlement.chargeCertificate" readonly class="field-readonly" /></div>
                </template>

                <!-- Non-PCN: Outstanding Fare (editable) + Administrative Costs (override) -->
                <template v-else>
                  <label class="form-label-left">Outstanding Fare</label>
                  <div class="input-currency">
                    <span class="prefix">£</span>
                    <input v-if="isEditMode" v-model="courtForm.outstanding_fare" type="number" step="0.01" min="0" class="field-editable" />
                    <input v-else :value="settlement.outstandingFare" readonly class="field-readonly" />
                  </div>

                  <label class="form-label-left">Administrative Costs</label>
                  <div class="flex items-center gap-sm">
                    <div class="input-currency" style="flex:1">
                      <span class="prefix">£</span>
                      <input v-if="adminOverrideMode" v-model="adminOverrideCost" type="number" step="0.01" min="0" class="field-editable" />
                      <input v-else :value="settlement.adminCosts" readonly class="field-readonly" />
                    </div>
                    <span v-if="court.isAdminOverride && !adminOverrideMode" class="badge-override">OVERRIDDEN</span>
                    <template v-if="adminOverrideMode">
                      <button class="btn-action-green" @click="saveAdminOverride" :disabled="savingOverride">{{ savingOverride ? 'Saving…' : 'SAVE' }}</button>
                      <button class="btn-action-light" @click="cancelAdminOverride">CANCEL</button>
                    </template>
                    <button v-else class="btn-action-light" @click="overrideAdmin">OVERRIDE</button>
                  </div>
                </template>

                <label class="form-label-left" style="font-weight:700">Automatic Dues</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.automaticDues" readonly class="field-readonly" /></div>

                <label class="form-label-left">Manual Settlements</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.manual_settlement" type="number" step="0.01" min="0" class="field-editable" @input="courtForm.oocs_amount = ''" />
                  <input v-else :value="settlement.manualSettlements" readonly class="field-readonly" />
                </div>

                <label class="form-label-left">OOCS Amount</label>
                <div class="input-currency">
                  <span class="prefix">£</span>
                  <input v-if="isEditMode" v-model="courtForm.oocs_amount" type="number" step="0.01" min="0" class="field-editable" @input="courtForm.manual_settlement = ''" />
                  <input v-else :value="settlement.oocsAmount" readonly class="field-readonly" />
                </div>

                <label class="form-label-left" style="font-weight:700">Manual Dues</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.manualDues" readonly class="field-readonly" /></div>

                <label class="form-label-left">Total Admin Cost</label>
                <div class="input-currency"><span class="prefix">£</span><input :value="settlement.totalAdminCost" readonly class="field-readonly" /></div>
              </div>
            </fieldset>

            <fieldset class="legend-group mt-lg">
              <legend>Notes</legend>
              <textarea v-if="isEditMode" v-model="courtForm.court_notes" rows="5" class="field-editable"></textarea>
              <textarea v-else :value="settlement.notes" readonly rows="5" class="field-readonly"></textarea>
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
          <button class="btn-action-light" :disabled="!letterSelected || lettersLoading" @click="openLetter">OPEN LETTER</button>
          <button class="btn-action-light" :disabled="!letterSelected || lettersLoading" @click="previewLetter">PREVIEW LETTER</button>
          <button class="btn-action-light" :disabled="!letterSelected || lettersLoading" @click="editLetter">EDIT LETTER</button>
          <button class="btn-action-light" :disabled="lettersLoading" @click="addLetter">ADD LETTER</button>
          <button class="btn-action-light" :disabled="!letterSelected || lettersLoading" @click="updateLetterStatus">UPDATE STATUS</button>
        </div>
        <div class="toolbar">
          <div class="flex items-center gap-sm">
            <select v-model.number="lettersPerPage" class="rows-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <span class="toolbar-text">records per page</span>
          </div>
        </div>
        <div v-if="lettersError" class="error-banner" style="margin:8px 0;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:4px;font-size:0.875rem">
          {{ lettersError }}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="col-icon">
                  <input type="checkbox"
                         :checked="allLettersOnPageSelected"
                         @change="toggleAllLettersOnPage" />
                </th>
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
              <tr v-if="!lettersLoading && letterRows.length === 0">
                <td colspan="9"><div class="empty-state"><p class="empty-state-desc">No letters queued for this case yet.</p></div></td>
              </tr>
              <tr v-for="row in pagedLetterRows" :key="row.comm_id"
                  :class="{ 'row-selected': selectedLetterCommId === row.comm_id }">
                <td class="col-icon">
                  <input type="checkbox"
                         :checked="selectedLetterCommId === row.comm_id"
                         @change="toggleLetterRow(row.comm_id)" />
                </td>
                <td>{{ row.letter_template_title || '—' }}</td>
                <td><span class="letter-status-text" :data-status="(row.letter_status_name || '').toUpperCase()">{{ row.letter_status_name || '—' }}</span></td>
                <td>{{ row.copies ?? '—' }}</td>
                <td>{{ fmtDateTime(row.created_dt) }}</td>
                <td>{{ fmtDateTime(row.updated_dt) || '—' }}</td>
                <td>{{ fmtDateTime(row.printed_dt) || '—' }}</td>
                <td>{{ row.created_by_name || row.created_by || '—' }}</td>
                <td>{{ row.updated_by_name || row.updated_by || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="page-meta">
            Showing {{ lettersRangeStart }} to {{ lettersRangeEnd }} of {{ letterRows.length }} entries
          </span>
          <button class="page-btn" :disabled="lettersPage <= 1" @click="lettersPage--">‹ Previous</button>
          <button v-for="p in lettersPageNumbers" :key="p" class="page-btn"
                  :class="{ active: p === lettersPage }"
                  :disabled="p === '…'"
                  @click="p !== '…' && (lettersPage = p)">
            {{ p }}
          </button>
          <button class="page-btn" :disabled="lettersPage >= lettersTotalPages" @click="lettersPage++">Next ›</button>
        </div>
      </div>

      <!-- LETTER modal — ADD / EDIT share the same shape -->
      <div v-if="letterModal.open" class="modal-backdrop" @click.self="closeLetterModal" style="position:fixed;inset:0;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;z-index:1000">
        <div class="modal-card" style="background:#fff;border-radius:6px;width:480px;max-width:92vw;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e5e7eb">
            <h3 style="margin:0;font-size:1rem">{{ letterModal.mode === 'edit' ? 'Edit Letter' : 'Add Letter' }}</h3>
            <button @click="closeLetterModal" style="border:none;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer;color:#6b7280">×</button>
          </div>
          <div style="padding:16px 18px">
            <div class="form-group">
              <label class="form-label">Letter template *</label>
              <select v-model="letterModal.templateId">
                <option value="">Select a template…</option>
                <option v-for="t in letterTemplateOptions" :key="t.letter_template_id" :value="t.letter_template_id">
                  {{ t.title }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Copies</label>
              <input v-model.number="letterModal.copies" type="number" min="1" max="50" style="width:100px" />
            </div>
            <div v-if="letterModal.error" class="error-banner" style="margin-top:8px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:4px;font-size:0.875rem">
              {{ letterModal.error }}
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #e5e7eb;background:#f9fafb">
            <button class="btn btn-secondary" @click="closeLetterModal" :disabled="letterModal.saving">Cancel</button>
            <button class="btn btn-primary"
                    :disabled="letterModal.saving || !letterModal.templateId"
                    @click="submitLetterModal">
              {{ letterModal.saving ? 'Saving…' : (letterModal.mode === 'edit' ? 'Save changes' : 'Queue letter') }}
            </button>
          </div>
        </div>
      </div>

      <!-- UPDATE STATUS modal — simple dropdown of available statuses -->
      <div v-if="statusModal.open" class="modal-backdrop" @click.self="closeStatusModal" style="position:fixed;inset:0;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;z-index:1000">
        <div class="modal-card" style="background:#fff;border-radius:6px;width:420px;max-width:92vw;box-shadow:0 10px 25px rgba(0,0,0,0.2);display:flex;flex-direction:column">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e5e7eb">
            <h3 style="margin:0;font-size:1rem">Update Letter Status</h3>
            <button @click="closeStatusModal" style="border:none;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer;color:#6b7280">×</button>
          </div>
          <div style="padding:16px 18px">
            <p class="text-light" style="margin:0 0 12px 0">
              Current status: <strong>{{ statusModal.currentName || '—' }}</strong>
            </p>
            <div class="form-group">
              <label class="form-label">New status *</label>
              <select v-model="statusModal.newName">
                <option value="">Select…</option>
                <option v-for="s in letterStatusNames" :key="s" :value="s" :disabled="s === statusModal.currentName">
                  {{ s }}
                </option>
              </select>
            </div>
            <div v-if="statusModal.error" class="error-banner" style="margin-top:8px;padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:4px;font-size:0.875rem">
              {{ statusModal.error }}
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #e5e7eb;background:#f9fafb">
            <button class="btn btn-secondary" @click="closeStatusModal" :disabled="statusModal.saving">Cancel</button>
            <button class="btn btn-primary"
                    :disabled="statusModal.saving || !statusModal.newName || statusModal.newName === statusModal.currentName"
                    @click="submitStatusModal">
              {{ statusModal.saving ? 'Updating…' : 'Update status' }}
            </button>
          </div>
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

    <!-- Save / Cancel bar — mirrors legacy panel-footer; appears below the tab
         content at the bottom-right when the page is in edit mode. Saves all
         editable sections (header card + customer details) in one click. -->
    <div v-if="isEditMode"
         style="display:flex;justify-content:flex-end;gap:8px;padding:12px 0;">
      <button class="btn-action-light" :disabled="savingEdit" @click="cancelEdit">CANCEL</button>
      <button class="btn-edit"         :disabled="savingEdit" @click="saveEdit">
        {{ savingEdit ? 'SAVING…' : 'SAVE' }}
      </button>
    </div>

    <!-- LINK ADDITIONAL CASE modal — opens from the Linked Cases tab button.
         Shows auto-detect suggestions from /linkable/, lets the user pick one,
         then POSTs to /linked/ to create the revp_linked row.
         Mirrors legacy `getLinkedCasesRecordCount` (param=1) + linkData.create. -->
    <div v-if="linkModalOpen" class="modal-backdrop">
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

    <!-- Edit Action modal — pre-fills from the selected revp_actions row.
         Fields: action name (title), holder, owner, status, actioned date,
         notes, instruction. Target date is not editable via this endpoint. -->
    <div v-if="editActionModalOpen" class="modal-backdrop">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-action-modal-title"
           style="max-width:540px;width:90%;">
        <div class="modal-head">
          <h2 id="edit-action-modal-title" class="modal-title">Edit Action</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="editActionModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding:16px 20px;">
          <div class="form-row-left">
            <label class="form-label-left">Action Name</label>
            <input v-model="editActionForm.title" maxlength="30" class="field-editable" />

            <label class="form-label-left">Holder</label>
            <select v-model="editActionForm.holder" class="field-editable">
              <option value="">Please Select</option>
              <option v-for="opt in actionHolderOwnerOptions" :key="opt.lookup_data_id" :value="opt.lookup_data_id">
                {{ opt.lookup_data_value }}
              </option>
            </select>

            <label class="form-label-left">Owner</label>
            <select v-model="editActionForm.owner" class="field-editable">
              <option value="">Please Select</option>
              <option v-for="opt in actionHolderOwnerOptions" :key="opt.lookup_data_id" :value="opt.lookup_data_id">
                {{ opt.lookup_data_value }}
              </option>
            </select>

            <label class="form-label-left">Status</label>
            <select v-model="editActionForm.action_status_id" class="field-editable">
              <option value="">Please Select</option>
              <option v-for="s in actionStatuses" :key="s.action_status_id" :value="s.action_status_id">
                {{ s.status_desc }}
              </option>
            </select>

            <label class="form-label-left">Actioned Date</label>
            <input v-model="editActionForm.actioned_dt" type="date" class="field-editable" />

            <label class="form-label-left">Notes</label>
            <textarea v-model="editActionForm.notes" rows="3"
                      style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-family:inherit;font-size:13px;"></textarea>

            <label class="form-label-left">Instruction</label>
            <textarea v-model="editActionForm.instruction" rows="3"
                      style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-family:inherit;font-size:13px;"></textarea>
          </div>
          <p v-if="editActionError" role="alert"
             style="color:#b91c1c;font-size:12px;margin-top:8px;">
            {{ editActionError }}
          </p>
        </div>
        <div class="modal-foot" style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"
                  :disabled="editActionSaving" @click="editActionModalOpen = false">CANCEL</button>
          <button type="button" class="btn-action-green"
                  :disabled="editActionSaving" @click="submitEditAction">
            {{ editActionSaving ? 'SAVING…' : 'SAVE' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Action modal — creates a fresh revp_actions row on this case.
         Layout mirrors the legacy Add Action modal: 2-column top section
         (Holder/Owner/Status | Target Date/Actioned?/Actioned Date),
         then full-width Action, Instruction, Notes below. -->
    <div v-if="addActionModalOpen" class="modal-backdrop">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-action-modal-title"
           style="max-width:620px;width:92%;">
        <div class="modal-head">
          <h2 id="add-action-modal-title" class="modal-title">Add Action</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="addActionModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding:16px 20px;">
          <!-- 2-column section -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:14px;">
            <div>
              <label class="form-label-left" style="display:block;margin-bottom:4px;">Holder</label>
              <select v-model="addActionForm.holder" class="field-editable" style="width:100%;">
                <option value="">Select Holder Type</option>
                <option v-for="o in actionHolderOwnerOptions" :key="o.lookup_data_id" :value="o.lookup_data_id">
                  {{ o.lookup_data_value }}
                </option>
              </select>
            </div>
            <div>
              <label class="form-label-left" style="display:block;margin-bottom:4px;">Target Date</label>
              <input v-model="addActionForm.target_dt" type="date"
                     class="field-editable" style="width:100%;" />
            </div>
            <div>
              <label class="form-label-left" style="display:block;margin-bottom:4px;">Owner</label>
              <select v-model="addActionForm.owner" class="field-editable" style="width:100%;">
                <option value="">Select Owner Type</option>
                <option v-for="o in actionHolderOwnerOptions" :key="o.lookup_data_id" :value="o.lookup_data_id">
                  {{ o.lookup_data_value }}
                </option>
              </select>
            </div>
            <div style="display:flex;align-items:flex-end;padding-bottom:2px;">
              <label class="form-label-left" style="margin-right:10px;margin-bottom:0;">Actioned?</label>
              <input type="checkbox"
                     :checked="addActionForm.actioned"
                     @change="onActionedCheckboxChange"
                     style="width:16px;height:16px;cursor:pointer;" />
            </div>
            <div>
              <label class="form-label-left" style="display:block;margin-bottom:4px;">Status</label>
              <select v-model="addActionForm.action_status_id" class="field-editable" style="width:100%;">
                <option value="">Please Select</option>
                <option v-for="s in actionStatuses" :key="s.action_status_id" :value="s.action_status_id">
                  {{ s.status_desc }}
                </option>
              </select>
            </div>
            <div>
              <label class="form-label-left" style="display:block;margin-bottom:4px;">Actioned Date</label>
              <input v-model="addActionForm.actioned_dt" type="date"
                     :disabled="!addActionForm.actioned"
                     class="field-editable" style="width:100%;"
                     :style="!addActionForm.actioned ? {background:'#f3f4f6',cursor:'not-allowed'} : {}" />
            </div>
          </div>
          <!-- Full-width fields -->
          <div style="margin-bottom:10px;">
            <label class="form-label-left" style="display:block;margin-bottom:4px;">
              Action <span style="color:#b91c1c">*</span>
            </label>
            <input v-model="addActionForm.title" maxlength="30"
                   class="field-editable" style="width:100%;" />
          </div>
          <div style="margin-bottom:10px;">
            <label class="form-label-left" style="display:block;margin-bottom:4px;">Instruction</label>
            <input v-model="addActionForm.instruction" maxlength="5000"
                   class="field-editable" style="width:100%;" />
          </div>
          <div>
            <label class="form-label-left" style="display:block;margin-bottom:4px;">Notes</label>
            <textarea v-model="addActionForm.notes" rows="4"
                      style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-family:inherit;font-size:13px;resize:vertical;"></textarea>
          </div>
          <p v-if="addActionError" role="alert"
             style="color:#b91c1c;font-size:12px;margin-top:8px;">
            {{ addActionError }}
          </p>
        </div>
        <div class="modal-foot" style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"
                  :disabled="addActionSaving" @click="addActionModalOpen = false">CANCEL</button>
          <button type="button" class="btn-action-green"
                  :disabled="addActionSaving" @click="submitAddAction">
            {{ addActionSaving ? 'SAVING…' : 'OK' }}
          </button>
        </div>
      </div>
    </div>

    <!-- "Confirm Action Closed?" sub-modal — shown when the user checks "Actioned?"
         in the Add Action modal. Mirrors legacy #chkactionedmodal behaviour:
         Yes → keeps checkbox checked + enables Actioned Date.
         No  → reverts checkbox to unchecked + disables Actioned Date. -->
    <div v-if="addActionConfirmOpen" class="modal-backdrop" style="z-index:1100;">
      <div class="modal-panel" role="dialog" aria-modal="true"
           style="max-width:400px;width:90%;">
        <div class="modal-head">
          <h2 class="modal-title">Confirm</h2>
        </div>
        <div class="modal-body" style="padding:16px 20px;">
          <p style="font-size:13px;font-weight:600;margin:0;">
            Confirm Action Closed? You will need to specify the 'Actioned Date' if you continue.
          </p>
        </div>
        <div class="modal-foot" style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"   @click="confirmActionedNo">No</button>
          <button type="button" class="btn-action-green" @click="confirmActionedYes">Yes</button>
        </div>
      </div>
    </div>

    <!-- Add Offence modal — opens from Offences tab ADD button. Writes one
         revp_case_offence row + one revp_audit_history row in a single backend
         transaction (mirrors legacy setOffenceDetailsByCaseid fuseaction).
         Offence dropdown populates charge + statement on selection. -->
    <div v-if="offenceModalOpen" class="modal-backdrop">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="offence-modal-title"
           style="max-width:560px;width:92%;">
        <div class="modal-head">
          <h2 id="offence-modal-title" class="modal-title">Add Offence</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="offenceModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding:16px 20px;">
          <div style="margin-bottom:14px;">
            <label class="form-label-left" style="display:block;margin-bottom:6px;">Offence</label>
            <div style="position:relative;">
              <input
                v-model="offenceSearch"
                @focus="offenceDropdownOpen = true"
                @input="onOffenceSearchInput"
                @blur="offenceDropdownOpen = false"
                autocomplete="off"
                placeholder="Search by CJS code or description…"
                style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;"
              />
              <div
                v-if="offenceDropdownOpen"
                style="position:absolute;top:calc(100% + 2px);left:0;right:0;z-index:20;background:#fff;border:1px solid #d1d5db;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.1);max-height:220px;overflow-y:auto;"
              >
                <div
                  v-for="o in filteredOffences"
                  :key="o.offence_id"
                  @mousedown.prevent="pickOffence(o)"
                  style="padding:8px 12px;font-size:13px;cursor:pointer;border-bottom:1px solid #f3f4f6;"
                  :style="o.offence_id === offenceModalForm.offence_id ? 'background:#eff6ff;' : ''"
                >
                  <span style="font-weight:600;color:#1e40af;">{{ o.cjs_code }}</span>
                  <span style="color:#374151;"> — {{ o.description }}</span>
                </div>
                <div
                  v-if="filteredOffences.length === 0"
                  style="padding:10px 12px;font-size:13px;color:#9ca3af;text-align:center;"
                >
                  No offences found
                </div>
              </div>
            </div>
            <p v-if="offenceModalForm.offence_id" style="font-size:11px;color:#16a34a;margin-top:4px;">
              Selected: {{ offenceSearch }}
            </p>
          </div>
          <div style="margin-bottom:14px;">
            <label class="form-label-left" style="display:block;margin-bottom:6px;">Charge</label>
            <input
              v-model="offenceModalForm.offence_charge"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;"
              placeholder="Charge"
            />
          </div>
          <div>
            <label class="form-label-left" style="display:block;margin-bottom:6px;">Statement</label>
            <textarea
              v-model="offenceModalForm.case_offence_statement"
              rows="4"
              maxlength="50"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:13px;"
              placeholder="Statement of facts…"
            ></textarea>
          </div>
          <p v-if="offenceModalError" class="form-error" role="alert" style="color:#b91c1c;font-size:12px;margin-top:6px;">
            {{ offenceModalError }}
          </p>
        </div>
        <div class="modal-foot" style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"   @click="offenceModalOpen = false" :disabled="offenceModalSaving">CANCEL</button>
          <button type="button" class="btn-action-green" @click="submitOffence"            :disabled="offenceModalSaving">
            {{ offenceModalSaving ? 'SAVING…' : 'ADD' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Note modal — opens from Notes tab ADD button. Writes one
         revp_note row + one revp_audit_history row in a single backend
         transaction (mirrors legacy setNotesDetailsByCaseid). -->
    <div v-if="noteModalOpen" class="modal-backdrop">
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
    <DescriptionModal
      v-model="descModalOpen"
      :is-read-only="!isEditMode"
      :description-data="_descDataForModal"
      :busy="descFormBusy"
      :error="descFormError"
      @save="saveDescription"
    />

    <AddressReferenceModal
      v-model="referenceModalOpen"
      :customer-id="_caseRow?.customer_id ?? ''"
      :case-id="String(route.params.caseid ?? '')"
      :post-code="customerForm.post_code"
      :address1="customerForm.address1"
      :address2="customerForm.address2"
      :town="customerForm.city_town"
      :country="customerForm.country"
      :first-name="customerForm.first_name"
      :last-name="customerForm.surname"
      :phone="customerForm.contact_number"
      @save="val => customerForm.addressSearchReference = val"
    />
    <OffenderSearchModal
      v-model="offenderSearchOpen"
      :first-name="customerForm.first_name"
      :last-name="customerForm.surname"
      :postcode="customerForm.post_code"
      :address1="customerForm.address1"
      :address2="customerForm.address2"
      :town="customerForm.city_town"
      @pick="pickOffenderMatch"
    />

  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, watchEffect, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import AppLayout from '@/components/layout/AppLayout.vue'
import { casesService }     from '@/services/cases.service.js'
import { offencesService }  from '@/services/offences.service.js'
import { customersService } from '@/services/customers.service.js'
import { lookupService }    from '@/services/lookup.service.js'
import { api }              from '@/services/api.js'
import { journeyService }   from '@/services/journey.service.js'
import { vehiclesService }  from '@/services/vehicles.service.js'
import { carParksService }  from '@/services/car-parks.service.js'
import { actionsService }        from '@/services/actions.service.js'
import { courtsService }    from '@/services/courts.service.js'
import { paymentsService }  from '@/services/payments.service.js'
import { addressesService } from '@/services/addresses.service.js'
import { caseLettersService } from '@/services/case-letters.service.js'
import AddressReferenceModal from '@/components/AddressReferenceModal.vue'
import OffenderSearchModal   from '@/components/OffenderSearchModal.vue'
import DescriptionModal      from '@/components/DescriptionModal.vue'

const route = useRoute()
const router = useRouter()
const headerOpen = ref(true)
const activeTab = ref('actions')

// Auto-fetch tab-scoped data when the operator clicks into it. Letters tab
// fires `loadCaseLetters()` the first time it's opened and never re-fetches
// implicitly — explicit refresh is via the toolbar refresh button.
let _lettersLoadedOnce = false
watch(activeTab, async (tab) => {
  if (tab === 'letters' && !_lettersLoadedOnce) {
    _lettersLoadedOnce = true
    await loadCaseLetters()
  }
})

// Edit state — starts true when the route was opened with ?mode=edit
// (clicking Edit in the case list still works as a deep-link shortcut),
// otherwise false and toggled via the in-page EDIT button.
const isEditMode = ref(route.query.mode === 'edit')

// Form buffer for the header card's editable fields. Populated from
// caseDetails when the operator enters edit mode; written to the backend
// in saveEdit(); discarded by cancelEdit().
const editForm = reactive({
  case_dt:        '',   // ISO yyyy-mm-dd
  case_status_id: '',
  closure_reason: '',
  closure_dt:     '',
})
const savingEdit = ref(false)

// Mirror old project: auto-tick the RailPay prevent checkbox when the case
// status is changed to Closed or a paid/payment status — matches the two
// hardcoded status IDs in the old project's JS handlers.
watch(() => editForm.case_status_id, (newId) => {
  if (!newId || !isEditMode.value) return
  const status = statusOptions.value.find(s => s.case_status_id === newId)
  if (!status) return
  const desc = (status.status_desc || '').toLowerCase()
  if (desc.includes('closed') || desc.includes('paid') || desc.includes('ap payment')) {
    courtForm.prevent_rail_pay = true
  }
})

// Status dropdown options for the in-place edit. Fetched once when the
// operator enters edit mode for the first time; cached after that.
const statusOptions = ref([])
async function ensureStatusOptions() {
  if (statusOptions.value.length) return
  try {
    statusOptions.value = await casesService.listStatuses()
  } catch (err) {
    console.warn('[case-detail] could not load statuses for edit dropdown:', err)
  }
}

function _toIsoDate(dt) {
  if (!dt) return ''
  // Accept either an ISO datetime string or a Date; emit yyyy-mm-dd for
  // <input type="date">.
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

async function enterEditMode() {
  // Snapshot the current header values + customer values into the edit
  // buffers so every field comes up prefilled. The user cancels by hitting
  // CANCEL; nothing displayed is mutated until a save handler runs.
  editForm.case_dt        = _toIsoDate(_caseRow.value?.case_dt)
  editForm.case_status_id = _caseRow.value?.case_status_id || ''
  editForm.closure_reason = _caseRow.value?.closure_reason || ''
  editForm.closure_dt     = _toIsoDate(_caseRow.value?.closure_dt)
  if (_journeyRaw.value) {
    _populateJourneyForm()
    ensureQuestionAtOptions()
    _ensureRailCardTypeOptions()
  }
  // Snapshot court/settlement fields from the raw case row.
  const r = _caseRow.value || {}
  courtForm.court_id          = r.court_id          || ''
  courtForm.court_booking_id  = r.court_booking_id  || ''
  courtForm.court_reference   = r.court_reference   || ''
  courtForm.court_result_id   = r.court_result_id   || ''
  courtForm.court_costs       = r.court_costs       != null ? r.court_costs       : ''
  courtForm.court_restitution = r.court_restitution != null ? r.court_restitution : ''
  courtForm.court_fine        = r.court_fine        != null ? r.court_fine        : ''
  courtForm.victim_sur_charge = r.victim_sur_charge != null ? r.victim_sur_charge : ''
  courtForm.court_notes       = r.court_notes       || ''
  courtForm.outstanding_fare  = r.outstanding_fare  != null ? r.outstanding_fare  : ''
  courtForm.manual_settlement = r.manual_settlement != null ? r.manual_settlement : ''
  courtForm.oocs_amount       = r.oocs_amount       != null ? r.oocs_amount       : ''
  courtForm.prevent_rail_pay  = r.from_app_or_ap === '1'
  // Load dropdown options BEFORE populating the form so v-model on <select>
  // finds a matching option the moment the value is set.
  await Promise.all([
    ensureStatusOptions(),
    _ensureTitleOptions(),
    _ensureVerificationOptions(),
    _ensureReasonOptions(),
    isPcnCase.value && hasVehicle.value ? _ensurePcnOptions() : Promise.resolve(),
    _ensureCourtOptions(),
    courtForm.court_id ? _loadCourtBookings(courtForm.court_id) : Promise.resolve(),
  ])
  _populateCustomerForm()
  if (isPcnCase.value && hasVehicle.value) _populateVehicleForm()
  isEditMode.value = true
}

async function saveEdit() {
  // Single SAVE handler — persists ALL editable sections in one click:
  // header card (case_dt / status / closure), customer row (name / address /
  // contact), customer description (DOB / gender / etc), verification, and
  // signature flags. Each section's call is skipped when no fields apply
  // (e.g. no customer linked → customer sub-saves are skipped).
  savingEdit.value = true
  loadError.value = ''
  try {
    // 1. Header card — case-level fields (merged with court fields: all on revp_case).
    const headerPayload = {}
    if (editForm.case_dt)        headerPayload.case_dt        = editForm.case_dt
    if (editForm.case_status_id) headerPayload.case_status_id = editForm.case_status_id
    headerPayload.closure_reason = editForm.closure_reason || ''
    headerPayload.closure_dt     = editForm.closure_dt || ''

    // Court / Summons Details — all stored on revp_case.
    headerPayload.court_id          = courtForm.court_id         || null
    headerPayload.court_booking_id  = courtForm.court_booking_id || null
    headerPayload.court_reference   = courtForm.court_reference  || null
    headerPayload.court_result_id   = courtForm.court_result_id  || null
    headerPayload.court_notes       = courtForm.court_notes      || null
    headerPayload.court_costs       = courtForm.court_costs       !== '' ? Number(courtForm.court_costs)       : 0
    headerPayload.court_restitution = courtForm.court_restitution !== '' ? Number(courtForm.court_restitution) : 0
    headerPayload.court_fine        = courtForm.court_fine        !== '' ? Number(courtForm.court_fine)        : 0
    headerPayload.victim_sur_charge = courtForm.victim_sur_charge !== '' ? Number(courtForm.victim_sur_charge) : 0
    headerPayload.outstanding_fare  = courtForm.outstanding_fare  !== '' ? Number(courtForm.outstanding_fare)  : 0
    headerPayload.manual_settlement = courtForm.manual_settlement !== '' ? Number(courtForm.manual_settlement) : 0
    headerPayload.oocs_amount       = courtForm.oocs_amount       !== '' ? Number(courtForm.oocs_amount)       : 0
    headerPayload.from_app_or_ap    = courtForm.prevent_rail_pay ? '1' : '0'

    // 2. Signature flags also live on revp_case — merge into the same PUT.
    const sig = SIGNATURE_OPTIONS.find(s => s.value === customerForm.customer_signature)
      || { refuse: 0, unable: 0 }
    headerPayload.refuse_to_sign = sig.refuse
    headerPayload.unable_to_sign = sig.unable

    await casesService.update(route.params.caseid, headerPayload)

    // 3. Customer-side saves (skip if no customer linked to the case).
    const customerId = _caseRow.value?.customer_id
    if (customerId) {
      const telErr = _validateContactNumber(customerForm.contact_number)
      if (telErr) {
        contactNumberError.value = telErr
        throw new Error(telErr)
      }

      await customersService.update(customerId, {
        title:          customerForm.title,
        first_name:     customerForm.first_name,
        surname:        customerForm.surname,
        email:          customerForm.email,
        contact_number: customerForm.contact_number,
        address1:       customerForm.address1,
        address2:       customerForm.address2,
        city_town:      customerForm.city_town,
        post_code:      customerForm.post_code,
        country:        customerForm.country,
        county:         customerForm.county,
      })

      // Description is append-only — only fire when any desc field changed.
      const hasDescChange = customerForm.date_of_birth || customerForm.gender
        || customerForm.occupation || customerForm.parent_guardian
        || customerForm.mobile || customerForm.other_title
      if (hasDescChange) {
        const prev = currentDescription.value
        await customersService.createDescription(customerId, {
          date_of_birth:   customerForm.date_of_birth || null,
          gender:          customerForm.gender        || null,
          occupation:      customerForm.occupation    || null,
          parent_guardian: customerForm.parent_guardian || null,
          customer_age:    customerAgeDerived.value   || null,
          mobile:          customerForm.mobile        || null,
          other_title:     customerForm.other_title   || null,
          // Carry forward physical description fields so the new row is
          // a complete snapshot — avoids wiping physical data when the
          // operator only edits DOB / gender / occupation fields.
          build:                  prev?.build_id              || null,
          hair_colour:            prev?.hair_colour_id        || null,
          other_hair_colour:      prev?.other_hair_colour     || null,
          hair_type:              prev?.hair_type_id          || null,
          eye_colour:             prev?.eye_colour_id         || null,
          other_eye_colour:       prev?.other_eye_colour      || null,
          ethnic_appearance:      prev?.ethnic_appearance     || null,
          ethnicity:              prev?.ethnicity             || null,
          facial_hair_type:       prev?.facial_hair_type_id   || null,
          other_facial_hair_type: prev?.other_facial_hair_type || null,
          height:                 prev?.height                || null,
          handed:                 prev?.handed_id             || null,
          glasses:                prev?.glasses_id            || null,
          body_camera:            prev?.body_camera           || null,
          complexion:             prev?.complexion            || null,
          bracelet:               Boolean(prev?.bracelet),
          brooch:                 Boolean(prev?.brooch),
          necklace:               Boolean(prev?.necklace),
          watch:                  Boolean(prev?.watch),
          pin:                    Boolean(prev?.pin),
          pendant:                Boolean(prev?.pendant),
          earrings:               Boolean(prev?.earrings),
          ring:                   Boolean(prev?.ring),
          other:                  Boolean(prev?.other),
          jewellery_desc:         prev?.jewellery_desc     || null,
          marks_and_scars:        prev?.marks_and_scars    || null,
          tattoos:                prev?.tattoos            || null,
          habitual_dress:         prev?.habitual_dress     || null,
          additional_desc:        prev?.additional_desc    || null,
        })
      }
      if (customerForm.verification_type || customerForm.additional_info) {
        await casesService.createVerification(route.params.caseid, {
          verification_type: customerForm.verification_type,
          additional_info:   customerForm.additional_info,
        })
      }
    }

    // 4. Journey save — only for non-PCN cases that already have a journey row.
    //    case_id is intentionally omitted (read-only after creation per new API).
    //    Fields match the old project's UPDATE column list exactly, with the
    //    class→issued_at swap bug in the legacy code corrected here.
    const journeyId = _journeyRaw.value?.journey_id
    if (journeyId && !isPcnCase.value) {
      // Recombine the split travel_date + travel_time fields back into a
      // single ISO datetime string that the backend expects for travel_dt.
      let travel_dt = null
      if (journeyForm.travel_date) {
        travel_dt = journeyForm.travel_time
          ? `${journeyForm.travel_date}T${journeyForm.travel_time}:00`
          : `${journeyForm.travel_date}T00:00:00`
      }
      const fareTravelled     = journeyForm.fare_travelled     !== '' ? Number(journeyForm.fare_travelled)     : null
      const farePaid          = journeyForm.fare_paid          !== '' ? Number(journeyForm.fare_paid)          : null
      const additionalPenalty = journeyForm.additional_penalty !== '' ? Number(journeyForm.additional_penalty) : null
      await journeyService.update(journeyId, {
        travel_dt,
        place:                  journeyForm.place                  || null,
        questionedat_id:        journeyForm.questionedat_id ? Number(journeyForm.questionedat_id) : null,
        journey_from:           journeyForm.journey_from           || null,
        journey_to:             journeyForm.journey_to             || null,
        fare_paid:              farePaid,
        fare_travelled:         fareTravelled,
        reason_for_issue:       journeyForm.reason_for_issue       || null,
        other_reason_for_issue: journeyForm.other_reason_for_issue || null,
        smartcard_number:       journeyForm.smartcard_number       || null,
        headcode:               journeyForm.headcode               || null,
      })
      // Mirror the old project's EditJourneyDetails case write-back.
      // Formula: outstandingFare = (fareTravelled + additionalPenalty) − farePaid
      //          amountDue       = outstandingFare + adminCost
      const ft           = fareTravelled     ?? 0
      const fp           = farePaid          ?? 0
      const ap           = additionalPenalty ?? 0
      const adminCost    = Number(_caseRow.value?.admin_cost || 0)
      const outstandingFare = ft + ap - fp
      await casesService.update(route.params.caseid, {
        outstanding_fare:    outstandingFare,
        court_restitution:   ft,
        app_additional_amount: ap,
        amount_due:          outstandingFare + adminCost,
      })
    }

    // 5. Vehicle save — PCN cases with an existing vehicle row.
    const vehicleId = vehicle.vehicleId
    if (vehicleId && isPcnCase.value) {
      await vehiclesService.update(vehicleId, {
        reg_num:                   vehicleForm.reg_num                   || null,
        colour:                    vehicleForm.colour                    || null,
        manufacturer:              vehicleForm.manufacturer              || null,
        model:                     vehicleForm.model                     || null,
        issue_for_reason:          vehicleForm.issue_for_reason          || null,
        carpark_location_id:       vehicleForm.carpark_location_id       || null,
        carpark_details:           vehicleForm.carpark_details           || null,
        offence_from:              vehicleForm.offence_from              || null,
        offence_to:                vehicleForm.offence_to                || null,
        pay_display_ticket_num:    vehicleForm.pay_display_ticket_num    || null,
        pay_display_ticket_expiry: vehicleForm.pay_display_ticket_expiry || null,
        popla_appeal:              vehicleForm.popla_appeal ? 1 : 0,
        popla_start_dt:            vehicleForm.popla_start_dt            || null,
        popla_end_dt:              vehicleForm.popla_end_dt              || null,
        popla_ref_num:             vehicleForm.popla_ref_num             || null,
        popla_accepted:            vehicleForm.popla_accepted ? 1 : 0,
      })
    }

    // 6. Re-hydrate every tab from the server.
    await loadCase()
    isEditMode.value = false
    Swal.fire({
      icon: 'success',
      title: 'Saved',
      text: 'Case details have been updated successfully.',
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  } catch (err) {
    loadError.value = err?.data?.detail || err?.message || 'Failed to save changes.'
  } finally {
    savingEdit.value = false
  }
}

// saveCustomerDetails removed — the top SAVE button now handles all
// editable sections in one click. Kept here as a comment so anyone hunting
// the old name can find the new location: see saveEdit() above.

function cancelEdit() {
  isEditMode.value = false
  // Restore settlement display fields from the last saved row so that any
  // in-progress edits don't leak into view mode after cancel.
  const r = _caseRow.value || {}
  const _admin  = Number(r.admin_cost || 0)
  const _fare   = Number(r.outstanding_fare || 0)
  const _manual = Number(r.manual_settlement || 0)
  const _oocs   = Number(r.oocs_amount || 0)
  settlement.outstandingFare   = r.outstanding_fare   != null ? Number(r.outstanding_fare).toFixed(2)   : ''
  settlement.adminCosts        = r.admin_cost         != null ? Number(r.admin_cost).toFixed(2)         : ''
  settlement.manualSettlements = r.manual_settlement  != null ? Number(r.manual_settlement).toFixed(2)  : ''
  settlement.oocsAmount        = r.oocs_amount        != null ? Number(r.oocs_amount).toFixed(2)        : ''
  settlement.totalAdminCost    = r.total_admin_cost   != null ? Number(r.total_admin_cost).toFixed(2)   : ''
  if (isPcnCase.value) {
    const _pcn  = Number(r.parking_charge_notice  || 0)
    const _note = Number(r.pcn_notice_to_owner    || 0)
    const _cert = Number(r.pcn_charge_certificate || 0)
    settlement.automaticDues = Math.max(_pcn, _note, _cert).toFixed(2)
  } else {
    settlement.automaticDues = (_admin + _fare).toFixed(2)
  }
  settlement.manualDues = _manual > 0 ? _manual.toFixed(2) : _oocs > 0 ? _oocs.toFixed(2) : ''
}

// Holds the raw case row from the last successful GET — used by
// enterEditMode() to seed the form with ISO date values. caseDetails (the
// reactive used by the template) has display-formatted dates which don't
// round-trip into <input type="date">.
const _caseRow = ref(null)

// Raw journey API response — kept so enterEditMode() can seed journeyForm
// without an extra fetch. Set by hydrateJourney().
const _journeyRaw = ref(null)

// Edit buffer for the Car Park / Vehicle details tab. Field names match
// the backend PUT payload so saveEdit() can pass them directly.
const vehicleForm = reactive({
  reg_num:                   '',
  colour:                    '',
  manufacturer:              '',
  model:                     '',
  issue_for_reason:          '',
  carpark_location_id:       '',   // ID of the selected car park location
  carpark_details:           '',
  offence_from:              '',
  offence_to:                '',
  pay_display_ticket_num:    '',
  pay_display_ticket_expiry: '',
  popla_appeal:              false,
  popla_start_dt:            '',
  popla_end_dt:              '',
  popla_ref_num:             '',
  popla_accepted:            false,
})

function _populateVehicleForm() {
  vehicleForm.reg_num                   = vehicle.regNum
  vehicleForm.colour                    = vehicle.colour
  vehicleForm.manufacturer              = vehicle.manufacturer
  vehicleForm.model                     = vehicle.model
  vehicleForm.issue_for_reason          = vehicle.issueReason
  vehicleForm.carpark_location_id       = vehicle.carParkLocationId
  vehicleForm.carpark_details           = vehicle.carparkDetails
  vehicleForm.offence_from              = vehicle.offenceFrom
  vehicleForm.offence_to                = vehicle.offenceTo
  vehicleForm.pay_display_ticket_num    = vehicle.payDisplayTicketNum
  vehicleForm.pay_display_ticket_expiry = vehicle.payDisplayTicketExpiry
  vehicleForm.popla_appeal              = vehicle.poplaAppeal
  vehicleForm.popla_start_dt            = vehicle.poplaStartDate
  vehicleForm.popla_end_dt              = vehicle.poplaEndDate
  vehicleForm.popla_ref_num             = vehicle.poplaRefNum
  vehicleForm.popla_accepted            = vehicle.poplaAccepted
}

// Edit buffer for the Journey Details tab. Field names match the backend
// PATCH payload (snake_case) so saveEdit() can pass them directly.
// travel_date / travel_time are split from travel_dt for <input type="date|time">.
const journeyForm = reactive({
  travel_date: '', travel_time: '', departure_time: '',
  place: '', questionedat_id: '',
  journey_from: '', journey_to: '', train_departed_from: '',
  fare_paid: '', fare_travelled: '', additional_penalty: '',
  reason_for_issue: '', other_reason_for_issue: '',
  smartcard_number: '', headcode: '',
  offence_dt: '', offence_hour: '', offence_minute: '',
  travel_class: '', issued_at: '', zero_fare_ticket_no: '',
})

// Questioned-at lookup options — loaded once when edit mode is first entered.
const questionAtOptions = ref([])

async function ensureQuestionAtOptions() {
  if (questionAtOptions.value.length) return
  try {
    const data = await journeyService.getQuestionAtOptions()
    questionAtOptions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[case-detail] could not load question-at options:', err)
  }
}

// Railcard type options — loaded once when edit mode is first entered.
const railCardTypeOptions = ref([])
let _railCardTypesLoaded = false

async function _ensureRailCardTypeOptions() {
  if (_railCardTypesLoaded) return
  try {
    const d = await api.get('/revp/misc/railcards/')
    railCardTypeOptions.value = d?.results || []
    _railCardTypesLoaded = true
  } catch { /* leave empty */ }
}

function _populateJourneyForm() {
  const j = _journeyRaw.value
  if (!j) return
  // Split travel_dt (ISO datetime string) into separate date + time parts.
  const travelIso = j.travel_dt || ''
  journeyForm.travel_date         = travelIso ? travelIso.slice(0, 10) : ''
  journeyForm.travel_time         = travelIso && travelIso.length >= 16 ? travelIso.slice(11, 16) : ''
  journeyForm.departure_time      = j.departure_time || ''
  journeyForm.place               = j.place || ''
  journeyForm.questionedat_id     = j.questionedat?.id ?? ''
  journeyForm.journey_from        = j.journey_from || ''
  journeyForm.journey_to          = j.journey_to || ''
  journeyForm.train_departed_from = j.train_departed_from || ''
  journeyForm.fare_paid           = j.fare_paid != null ? String(j.fare_paid) : ''
  journeyForm.fare_travelled      = j.fare_travelled != null ? String(j.fare_travelled) : ''
  // additional_penalty lives on the case row (APPAdditionalAmount), seeded from _caseRow
  journeyForm.additional_penalty  = _caseRow.value?.app_additional_amount != null
    ? String(_caseRow.value.app_additional_amount) : ''
  journeyForm.reason_for_issue    = j.reason_for_issue || ''
  journeyForm.other_reason_for_issue = j.other_reason_for_issue || ''
  journeyForm.smartcard_number    = j.smartcard_number || ''
  journeyForm.headcode            = j.headcode || ''
  journeyForm.offence_dt          = j.offence_dt || ''
  journeyForm.offence_hour        = j.offence_hour != null ? String(j.offence_hour) : ''
  journeyForm.offence_minute      = j.offence_minute != null ? String(j.offence_minute) : ''
  journeyForm.travel_class        = j.travel_class || ''
  journeyForm.issued_at           = j.issued_at || ''
  journeyForm.zero_fare_ticket_no = j.zero_fare_ticket_no || ''
}

// Outstanding balance computed live from the edit-mode inputs so the
// read-only Outstanding field updates as the operator types.
// Old project formula: outstanding = (fareTravelled + additionalPenalty) − farePaid
const journeyOutstanding = computed(() => {
  if (!isEditMode.value) return journey.outstanding
  const t = Number(journeyForm.fare_travelled || 0)
  const a = Number(journeyForm.additional_penalty || 0)
  const p = Number(journeyForm.fare_paid || 0)
  return (journeyForm.fare_travelled !== '' || journeyForm.fare_paid !== '' || journeyForm.additional_penalty !== '')
    ? (t + a - p).toFixed(2)
    : journey.outstanding
})

// ── Customer Details tab edit buffer ──────────────────────────────────────
// Captures the in-flight values for the Customer Details tab. Saved by
// saveCustomerDetails() which fires four backend calls in sequence:
//   1. customersService.update         — customer table (name/contact/address)
//   2. customersService.createDescription — revp_customer_desc (DOB/gender/etc; append-only)
//   3. casesService.createVerification — revp_case_verification (append-only)
//   4. casesService.update             — refuse_to_sign / unable_to_sign on revp_case
const customerForm = reactive({
  title: '', other_title: '', first_name: '', surname: '',
  email: '', contact_number: '', mobile: '',
  address1: '', address2: '', city_town: '', post_code: '', country: '', county: '',
  addressSearchReference: '',
  date_of_birth: '', gender: '', occupation: '', parent_guardian: '',
  verification_type: '', additional_info: '',
  customer_signature: '',  // 'Signature provided' | 'Refuse to sign' | 'Unable to sign'
  customer_input_reconciled: false,
})

// Validation error for telephone shown inline below the field.
const contactNumberError = ref('')

function _validateContactNumber(val) {
  if (!val) return null
  const stripped = val.replace(/\s/g, '')
  if (!/^[0-9\-+]+$/.test(stripped)) return 'Digits, - and + only'
  if (stripped.length < 10) return 'Minimum 10 characters'
  if (stripped.length > 13) return 'Maximum 13 characters'
  return null
}

// Auto-infer gender from title selection — mirrors legacy JS in revpCaseListEdit.cfm.
function onTitleChange(title) {
  const map = { Mr: 'Male', Miss: 'Female', Mrs: 'Female', Ms: 'Female', Mx: 'Other', Dr: 'Other' }
  if (map[title]) customerForm.gender = map[title]
}

// ── SHOW DESCRIPTION modal ──────────────────────────────────────────────────
const descModalOpen  = ref(false)
const descFormBusy   = ref(false)
const descFormError  = ref('')

// Convert the API response (build_id, hair_colour_id, etc.) to the flat
// camelCase format DescriptionModal expects for its descriptionData prop.
const _descDataForModal = computed(() => {
  const d = currentDescription.value
  if (!d) return null
  return {
    build:               d.build_id             || '',
    hairColour:          d.hair_colour_id        || '',
    otherHairColour:     d.other_hair_colour     || '',
    hairType:            d.hair_type_id          || '',
    eyeColour:           d.eye_colour_id         || '',
    otherEyeColour:      d.other_eye_colour      || '',
    ethnicAppearance:    d.ethnic_appearance     || '',
    ethnicity:           d.ethnicity             || '',
    facialHairType:      d.facial_hair_type_id   || '',
    otherFacialHairType: d.other_facial_hair_type|| '',
    height:              d.height                || '',
    handed:              d.handed_id             || '',
    glasses:             d.glasses_id            || '',
    bodyCamera:          d.body_camera           || '',
    complexion:          d.complexion            || '',
    bracelet:       Boolean(d.bracelet),
    brooch:         Boolean(d.brooch),
    necklace:       Boolean(d.necklace),
    watch:          Boolean(d.watch),
    pin:            Boolean(d.pin),
    pendant:        Boolean(d.pendant),
    earrings:       Boolean(d.earrings),
    ring:           Boolean(d.ring),
    otherJewellery: Boolean(d.other),
    jewelleryDesc:  d.jewellery_desc  || '',
    marksAndScars:  d.marks_and_scars || '',
    tattoos:        d.tattoos         || '',
    habitualDress:  d.habitual_dress  || '',
    additionalDesc: d.additional_desc || '',
  }
})

function openDescriptionModal() {
  descFormError.value = ''
  descModalOpen.value = true
}

async function saveDescription(formData) {
  const customerId = _caseRow.value?.customer_id
  if (!customerId) return
  descFormBusy.value  = true
  descFormError.value = ''
  try {
    const prev = currentDescription.value
    const payload = {
      // Carry forward basic fields so the new row is a complete snapshot —
      // avoids wiping DOB / gender / occupation when saving physical description.
      date_of_birth:   prev?.date_of_birth   || null,
      gender:          prev?.gender          || null,
      occupation:      prev?.occupation      || null,
      parent_guardian: prev?.parent_guardian || null,
      customer_age:    prev?.customer_age    ?? null,
      mobile:          prev?.mobile          || null,
      other_title:     prev?.other_title     || null,
      // Physical fields from the modal
      build:                  formData.build               || null,
      hair_colour:            formData.hairColour          || null,
      other_hair_colour:      formData.otherHairColour     || null,
      hair_type:              formData.hairType            || null,
      eye_colour:             formData.eyeColour           || null,
      other_eye_colour:       formData.otherEyeColour      || null,
      ethnic_appearance:      formData.ethnicAppearance    || null,
      ethnicity:              formData.ethnicity           || null,
      facial_hair_type:       formData.facialHairType      || null,
      other_facial_hair_type: formData.otherFacialHairType || null,
      height:                 formData.height              || null,
      handed:                 formData.handed              || null,
      glasses:                formData.glasses             || null,
      body_camera:            formData.bodyCamera          || null,
      complexion:             formData.complexion          || null,
      bracelet:               formData.bracelet,
      brooch:                 formData.brooch,
      necklace:               formData.necklace,
      watch:                  formData.watch,
      pin:                    formData.pin,
      pendant:                formData.pendant,
      earrings:               formData.earrings,
      ring:                   formData.ring,
      other:                  formData.otherJewellery,
      jewellery_desc:         formData.jewelleryDesc   || null,
      marks_and_scars:        formData.marksAndScars   || null,
      tattoos:                formData.tattoos         || null,
      habitual_dress:         formData.habitualDress   || null,
      additional_desc:        formData.additionalDesc  || null,
    }
    const d = await customersService.createDescription(customerId, payload)
    hydrateDescription(d)
    descModalOpen.value = false
  } catch (err) {
    descFormError.value = err?.data?.detail || err?.message || 'Failed to save description.'
  } finally {
    descFormBusy.value = false
  }
}
// customerSaving removed — `savingEdit` (declared near editForm) covers
// the unified SAVE button now.

// Title, verification-type, and journey reason dropdowns — loaded lazily on first edit-mode entry.
const titleOptions            = ref([])
const verificationTypeOptions = ref([])
const reasonForIssueOptions   = ref([])
let _titleOptionsLoaded        = false
let _verificationOptionsLoaded = false
let _reasonOptionsLoaded       = false

async function _ensureTitleOptions() {
  if (_titleOptionsLoaded) return
  try { titleOptions.value = await lookupService.listByType('PERSON_TITLE'); _titleOptionsLoaded = true } catch { /* use empty */ }
}
async function _ensureVerificationOptions() {
  if (_verificationOptionsLoaded) return
  try { verificationTypeOptions.value = await lookupService.listByType('CASE_VERIFICATION_TYPE'); _verificationOptionsLoaded = true } catch { /* use empty */ }
}
async function _ensureReasonOptions() {
  if (_reasonOptionsLoaded) return
  try { reasonForIssueOptions.value = await lookupService.listByType('CASE_REASON_FOR_ISSUE'); _reasonOptionsLoaded = true } catch { /* use empty */ }
}

// Court dropdown helpers — courts list cached for the session; bookings
// reloaded each time the court selection changes.
async function _ensureCourtOptions() {
  if (allCourts.value.length) return
  try {
    const res = await courtsService.getAll({ page: 1, page_size: 100, active: 1 })
    allCourts.value = res.results || []
  } catch { /* leave empty */ }
}

async function _loadCourtBookings(courtId) {
  allCourtBookings.value = []
  if (!courtId) return
  loadingCourtBookings.value = true
  try {
    const res = await courtsService.listBookings({ court_id: courtId, page: 1, page_size: 100 })
    allCourtBookings.value = res.results || []
  } catch { /* leave empty */ }
  loadingCourtBookings.value = false
}

async function onCourtChange(courtId) {
  courtForm.court_booking_id = ''
  await _loadCourtBookings(courtId)

  // Mirror old project: court selected → "Court Queue"; court cleared → "Open"
  await ensureStatusOptions()
  const targetDesc = courtId ? 'Court Queue' : 'Open'
  const match = statusOptions.value.find(s => s.status_desc === targetDesc)
  if (match) editForm.case_status_id = match.case_status_id
}

async function onCourtBookingChange(bookingId) {
  // Mirror old project: booking selected → "Court Booked"; booking cleared → "Court Queue"
  await ensureStatusOptions()
  const targetDesc = bookingId ? 'Court Booked' : 'Court Queue'
  const match = statusOptions.value.find(s => s.status_desc === targetDesc)
  if (match) editForm.case_status_id = match.case_status_id
}

// PCN car park dropdown options — issue reasons and car park locations,
// loaded lazily the first time a PCN case enters edit mode.
const pcnIssueReasonOptions  = ref([])
const carParkLocationOptions = ref([])
let _pcnOptionsLoaded = false

async function _ensurePcnOptions() {
  if (_pcnOptionsLoaded) return
  const [reasonsResult, locationsResult] = await Promise.allSettled([
    lookupService.listByType('REASON_FOR_ISSUE_FOR_PCN'),
    carParksService.getAll(),
  ])
  if (reasonsResult.status === 'fulfilled') {
    pcnIssueReasonOptions.value = Array.isArray(reasonsResult.value) ? reasonsResult.value : []
  }
  if (locationsResult.status === 'fulfilled') {
    carParkLocationOptions.value = Array.isArray(locationsResult.value) ? locationsResult.value : []
  }
  _pcnOptionsLoaded = true
}

// Customer signature lookup — three legacy options that map back to two
// boolean flags on revp_case (refuse_to_sign, unable_to_sign). Empty
// string = "signed" (both flags clear).
const SIGNATURE_OPTIONS = [
  { value: 'Signature provided', refuse: 0, unable: 0 },
  { value: 'Refuse to sign',     refuse: 1, unable: 0 },
  { value: 'Unable to sign',     refuse: 0, unable: 1 },
]

// Age displayed under DOB during edit — re-derived from DOB on every change
// so the operator can't enter inconsistent values.
const customerAgeDerived = computed(() => {
  const dob = customerForm.date_of_birth
  if (!dob) return ''
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 1 ? age : ''
})

function _populateCustomerForm() {
  customerForm.title             = customer.title || ''
  customerForm.other_title       = customer.otherTitle || ''
  customerForm.first_name        = customer.firstName || ''
  customerForm.surname           = customer.lastName || ''
  customerForm.email             = customer.email || ''
  customerForm.contact_number    = customer.telephone || ''
  customerForm.mobile            = customer.mobileTelephone || ''
  customerForm.address1          = customer.address1 || ''
  customerForm.address2          = customer.address2 || ''
  customerForm.city_town         = customer.town || ''
  customerForm.post_code         = customer.postcode || ''
  customerForm.country           = customer.country || ''
  customerForm.county                 = customer.county || ''
  customerForm.addressSearchReference = ''
  customerForm.date_of_birth          = currentDescription.value?.date_of_birth || ''
  customerForm.gender            = customer.gender || ''
  customerForm.occupation        = customer.employmentStatus || ''
  customerForm.parent_guardian   = customer.parentGuardian || ''
  customerForm.verification_type = customer.verificationType || ''
  customerForm.additional_info   = customer.verificationNotes || ''
  customerForm.customer_signature        = customer.customerSignature || ''
  customerForm.customer_input_reconciled = customer.customerInputReconciled || false
  contactNumberError.value = ''
}

const referenceModalOpen   = ref(false)
const offenderSearchOpen   = ref(false)
const addressSuggestions   = ref([])
const addressLookupLoading = ref(false)
const addressLookupError   = ref('')
const addressLookupInfo    = ref('')

function openAddressReferenceModal() { referenceModalOpen.value = true }
function openOffenderSearchModal()   { offenderSearchOpen.value = true }

function pickOffenderMatch(m) {
  if (m.first_name) customerForm.first_name      = m.first_name
  if (m.last_name)  customerForm.surname         = m.last_name
  if (m.address1)   customerForm.address1        = m.address1
  if (m.address2)   customerForm.address2        = m.address2
  if (m.town)       customerForm.city_town       = m.town
  if (m.postcode)   customerForm.post_code       = m.postcode
  if (m.telephone)  customerForm.contact_number  = m.telephone
  if (m.email)      customerForm.email           = m.email
}

// saveCustomerDetails() merged into the single top-level saveEdit() above
// so the page only has ONE SAVE button. Customer-row update, description
// append, verification append, and signature flags are all done from
// saveEdit when isEditMode is on.
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

// Add `days` to an ISO date string; returns the resulting ISO string for
// further formatting, or '' when the input is falsy or unparseable.
function _offsetDate(isoDate, days) {
  if (!isoDate || days == null) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + Number(days))
  return d.toISOString()
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
    // Stash the raw row so enterEditMode() can seed the form with ISO
    // dates / case_status_id (the display copy in `caseDetails` is
    // formatted for humans and can't round-trip into <input type="date">).
    _caseRow.value = c
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

    // Court + settlement fields all live on the case row — populate directly.
    court.courtReference   = c.court_reference || ''
    court.costs            = c.court_costs       ? Number(c.court_costs).toFixed(2)       : ''
    court.compensation     = c.court_restitution ? Number(c.court_restitution).toFixed(2) : ''
    court.fine             = c.court_fine        ? Number(c.court_fine).toFixed(2)        : ''
    court.victim           = c.victim_sur_charge ? Number(c.victim_sur_charge).toFixed(2) : ''
    court.preventRailPay   = c.from_app_or_ap === '1'
    court.isAdminOverride  = c.is_admin_override === 1
    settlement.outstandingFare   = c.outstanding_fare   ? Number(c.outstanding_fare).toFixed(2)  : ''
    settlement.adminCosts        = c.admin_cost         ? Number(c.admin_cost).toFixed(2)         : ''
    settlement.manualSettlements = c.manual_settlement  ? Number(c.manual_settlement).toFixed(2)  : ''
    settlement.oocsAmount        = c.oocs_amount        ? Number(c.oocs_amount).toFixed(2)        : ''
    settlement.totalAdminCost    = c.total_admin_cost   != null ? Number(c.total_admin_cost).toFixed(2) : ''
    settlement.notes             = c.court_notes || ''
    // PCN-only readonly fields
    settlement.parkingCharge     = c.parking_charge_notice  != null ? Number(c.parking_charge_notice).toFixed(2)  : ''
    settlement.noticeToOwner     = c.pcn_notice_to_owner    != null ? Number(c.pcn_notice_to_owner).toFixed(2)    : ''
    settlement.chargeCertificate = c.pcn_charge_certificate != null ? Number(c.pcn_charge_certificate).toFixed(2) : ''
    const _admin = Number(c.admin_cost || 0)
    const _fare  = Number(c.outstanding_fare || 0)
    // Automatic Dues: PCN = MAX(parkingCharge, noticeToOwner, chargeCert); non-PCN = admin + fare
    if (isPcnCase.value) {
      const _pcn  = Number(c.parking_charge_notice  || 0)
      const _note = Number(c.pcn_notice_to_owner    || 0)
      const _cert = Number(c.pcn_charge_certificate || 0)
      settlement.automaticDues = Math.max(_pcn, _note, _cert).toFixed(2)
    } else {
      settlement.automaticDues = (_admin + _fare).toFixed(2)
    }
    // Manual Dues = manual_settlement or oocs_amount (no admin — mirrors old project keyup handler)
    const _manual = Number(c.manual_settlement || 0)
    const _oocs   = Number(c.oocs_amount || 0)
    if (_manual > 0) {
      settlement.manualDues = _manual.toFixed(2)
    } else if (_oocs > 0) {
      settlement.manualDues = _oocs.toFixed(2)
    } else {
      settlement.manualDues = ''
    }

    // Hydrate all related records in parallel — none blocks the others and
    // a failure on one leaves the rest of the page usable. Tabs whose
    // backend already exists (audit / offences / actions / court / payment)
    // are fetched here; missing-backend tabs (notes / attachments / appeal
    // / linked cases / email log / letters log) stay empty for now.
    const [
      custResult, jrnResult, descResult, verResult,
      auditResult, offResult, actsResult, courtResult, bookingResult, payResult,
      notesResult, linkedResult, attResult, vehResult, courtResResult,
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
      courtsService.listCourtResults(),
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
      // additionalPenalty lives on the case (APPAdditionalAmount), not the journey.
      // totalDue and outstanding follow the old project formula:
      //   totalDue       = fareTravelled + additionalPenalty
      //   outstanding    = totalDue − farePaid
      const addPenalty  = Number(c.app_additional_amount || 0)
      const fareTrav    = Number(jrnResult.value.fare_travelled || 0)
      const farePd      = Number(jrnResult.value.fare_paid      || 0)
      journey.additionalPenalty = addPenalty ? String(addPenalty) : ''
      journey.totalDue          = (fareTrav + addPenalty).toFixed(2)
      journey.outstanding       = (fareTrav + addPenalty - farePd).toFixed(2)
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
      const rows = actsResult.value.results ?? (Array.isArray(actsResult.value) ? actsResult.value : [])
      _actionsRaw.value = rows
      actions.value = rows.map(a => ({
        id:         a.action_id,
        holder:     a.holder_name || a.holder || '',
        action:     a.action_name || a.title || '',
        targetDate: fmtDate(a.target_dt),
        actioned:   fmtDate(a.actioned_dt),
        status:     a.action_status_desc || '',
      }))
    }
    if (courtResult.status === 'fulfilled' && courtResult.value) {
      court.court = courtResult.value.name || ''
    }
    if (bookingResult.status === 'fulfilled' && bookingResult.value) {
      court.courtBooking = `${bookingResult.value.court_name || ''} — ${fmtDateTime(bookingResult.value.start_dt)}`.trim()
    }
    if (courtResResult.status === 'fulfilled' && Array.isArray(courtResResult.value)) {
      courtResultOptions.value = courtResResult.value
      if (c.court_result_id) {
        const match = courtResultOptions.value.find(o => o.lookup_data_id === c.court_result_id)
        court.courtResult = match ? match.lookup_data_value : ''
      }
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
  customer.postcode        = c.post_code      || ''
  customer.address1        = c.address1       || ''
  customer.address2        = c.address2       || ''
  customer.town            = c.city_town      || ''
  customer.country         = c.country        || ''
  customer.county          = c.county         || ''
}

// Holds the last-fetched raw description object for the SHOW DESCRIPTION modal.
const currentDescription = ref(null)

function hydrateDescription(d) {
  currentDescription.value = d
  const ageVal = ageFromDob(d.date_of_birth)
  customer.dob              = ageVal === '' ? '' : fmtDate(d.date_of_birth)
  customer.age              = ageVal !== '' ? ageVal : ''
  customer.employmentStatus = d.occupation      || ''
  customer.parentGuardian   = d.parent_guardian || ''
  customer.mobileTelephone  = d.mobile          || ''
  customer.otherTitle       = d.other_title     || ''
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
  vehicle.carParkLocationId      = v.carpark_location?.id || ''
  vehicle.carParkLocation        = v.carpark_location?.location_name || ''
  vehicle.offenceFrom            = v.offence_from || ''
  vehicle.offenceTo              = v.offence_to   || ''
  vehicle.payDisplayTicketNum    = v.pay_display_ticket_num    || ''
  vehicle.payDisplayTicketExpiry = v.pay_display_ticket_expiry || ''
  vehicle.carparkDetails         = v.carpark_details || ''
  // POPLA fields — defensive: backend may not return these yet.
  vehicle.poplaAppeal     = Boolean(v.popla_appeal)
  vehicle.poplaStartDate  = v.popla_start_dt  || ''
  vehicle.poplaEndDate    = v.popla_end_dt    || ''
  vehicle.poplaRefNum     = v.popla_ref_num   || ''
  vehicle.poplaAccepted   = Boolean(v.popla_accepted)
}

function hydrateJourney(j) {
  _journeyRaw.value = j
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
  journey.reasonForIssue  = j.reason_for_issue       || ''
  journey.railCard        = j.other_reason_for_issue || ''
  journey.questionedAt    = j.questionedat?.description || ''
}

function refresh() { loadCase() }

// Customer / journey / court / settlement / payment / actions / notes /
// attachments / auditLog all live in child tables that don't yet have
// dedicated endpoints — see CLAUDE.md plan.md for the backlog. The shells
// below render empty so the UI is honest about what we know vs. what's TBD.
const customer = reactive({
  title: '', otherTitle: '', firstName: '', lastName: '', dob: '', age: '', gender: '',
  telephone: '', mobileTelephone: '', email: '', employmentStatus: '',
  parentGuardian: '', postcode: '', address1: '', address2: '', town: '',
  country: '', county: '',
  verificationType: '', verificationNotes: '', customerSignature: '',
  customerInputReconciled: false,
})

const journey = reactive({
  reasonForIssue: '', railCard: '', place: '', journeyFrom: '', journeyTo: '',
  travelTime: '', travelDate: '', trainServiceId: '', smartcardNumber: '',
  fareDue: '', additionalPenalty: '', totalDue: '', alreadyPaid: '', outstanding: '',
  questionedAt: '',
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
  carParkLocationId: '',   // ID sent on save
  carParkLocation: '',     // display name shown in view mode
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
  poplaRefNum: '',
  poplaAccepted: false,
})
const hasVehicle = computed(() => Boolean(vehicle.vehicleId))
// PCN cases always belong on the Car Park tab even when no vehicle was
// recorded — otherwise the operator sees a misleading "JOURNEY DETAILS"
// label on a case that can never have a journey. Decide off the case type
// code so the label/section pick the right side regardless of whether
// the vehicle sub-record exists yet.
const isPcnCase = computed(() => {
  const code = (caseDetails.caseType || '').toUpperCase()
  return code === 'PCN' || code.includes('CAR PARK')
})

const court = reactive({
  court: '', courtBooking: '', courtReference: '',
  courtResult: '', costs: '', compensation: '', fine: '', victim: '',
  preventRailPay: false,
  isAdminOverride: false,
})
const courtResultOptions    = ref([])
const allCourts             = ref([])
const allCourtBookings      = ref([])
const loadingCourtBookings  = ref(false)

// Admin-cost override state — mirrors old project's OVERRIDE button flow.
const adminOverrideMode  = ref(false)   // true while the admin_cost input is editable
const adminOverrideCost  = ref('')      // local edit buffer for override value
const savingOverride     = ref(false)

const courtForm = reactive({
  court_id:          '',
  court_booking_id:  '',
  court_reference:   '',
  court_result_id:   '',
  court_costs:       '',
  court_restitution: '',
  court_fine:        '',
  victim_sur_charge: '',
  court_notes:       '',
  outstanding_fare:  '',
  manual_settlement: '',
  oocs_amount:       '',
  prevent_rail_pay:  false,
})

const settlement = reactive({
  outstandingFare: '', adminCosts: '', automaticDues: '',
  manualSettlements: '', oocsAmount: '', manualDues: '',
  totalAdminCost: '', notes: '',
  parkingCharge: '', noticeToOwner: '', chargeCertificate: '',   // PCN-only
})

// Live-recalculate derived settlement fields while in edit mode so the user
// sees updated totals as they type — no save/tab-switch needed.
watchEffect(() => {
  if (!isEditMode.value) return
  const admin  = Number(settlement.adminCosts || 0)
  const fare   = Number(courtForm.outstanding_fare || 0)
  const manual = Number(courtForm.manual_settlement || 0)
  const oocs   = Number(courtForm.oocs_amount || 0)

  if (isPcnCase.value) {
    // PCN: automatic_dues = MAX(parkingCharge, noticeToOwner, chargeCertificate)
    const pcn  = Number(settlement.parkingCharge    || 0)
    const note = Number(settlement.noticeToOwner    || 0)
    const cert = Number(settlement.chargeCertificate || 0)
    settlement.automaticDues = Math.max(pcn, note, cert).toFixed(2)
  } else {
    settlement.automaticDues = (admin + fare).toFixed(2)
  }

  if (manual > 0) {
    settlement.manualDues = manual.toFixed(2)
  } else if (oocs > 0) {
    settlement.manualDues = oocs.toFixed(2)
  } else {
    settlement.manualDues = ''
  }

  let total = admin
  if (manual > 0) total += manual
  else if (oocs > 0) total += oocs
  settlement.totalAdminCost = total.toFixed(2)
})

const payment = reactive({
  amountDue: '', paid: '', outstanding: '', discounted: '',
})

const actions = ref([])
// Raw action objects from the API — used by the Edit modal to pre-fill fields.
const _actionsRaw = ref([])

// ── Actions tab selection + busy state ──────────────────────────────────────
const selectedActionIds = reactive(new Set())
const actionBusy        = ref(false)
const actionError       = ref('')

const selectedActionCount = computed(() => selectedActionIds.size)
const allActionsSelected  = computed(() =>
  actions.value.length > 0 && actions.value.every(a => selectedActionIds.has(a.id))
)

// True when the case is in a terminal CLOSED status — locks all row checkboxes
// and write-action buttons (mirrors legacy `case_status_id == '256E6691-...'` check).
const isCaseClosed = computed(() =>
  (caseDetails.caseStatus || '').trim().toUpperCase() === 'CLOSED'
)

// Clear any checked rows the moment the case transitions to CLOSED so stale
// selections can't drive a Close & Action or Edit call.
watch(isCaseClosed, (closed) => {
  if (closed) selectedActionIds.clear()
})

watch(() => journeyForm.reason_for_issue, (val) => {
  if (val !== 'Failed to Carry Railcard') journeyForm.other_reason_for_issue = ''
})
function toggleAction(id) {
  selectedActionIds.has(id) ? selectedActionIds.delete(id) : selectedActionIds.add(id)
}
function toggleAllActions() {
  if (allActionsSelected.value) {
    selectedActionIds.clear()
  } else {
    actions.value.forEach(a => selectedActionIds.add(a.id))
  }
}

// Reload just the actions list without re-fetching the entire case.
async function reloadActions() {
  const caseId = route.params.caseid
  if (!caseId) return
  try {
    const data = await actionsService.listByCase(caseId)
    const rows = data?.results ?? (Array.isArray(data) ? data : [])
    _actionsRaw.value = rows
    actions.value = rows.map(a => ({
      id:         a.action_id,
      holder:     a.holder_name || a.holder || '',
      action:     a.action_name || a.title || '',
      targetDate: fmtDate(a.target_dt),
      actioned:   fmtDate(a.actioned_dt),
      status:     a.action_status_desc || '',
    }))
  } catch (e) {
    console.warn('[case-detail] failed to reload actions', e)
  }
}

// ── Action modal reference data — statuses + holder/owner options ────────────
// Loaded lazily the first time either modal is opened; cached after that.
const actionStatuses          = ref([])
const actionHolderOwnerOptions = ref([])
async function ensureActionRefData() {
  if (actionStatuses.value.length) return
  try {
    const [s, opts] = await Promise.allSettled([
      actionsService.statuses(),
      actionsService.modalOptions(),
    ])
    if (s.status === 'fulfilled')
      actionStatuses.value = Array.isArray(s.value) ? s.value : []
    if (opts.status === 'fulfilled')
      actionHolderOwnerOptions.value = opts.value?.holder_owner_options ?? []
  } catch (e) {
    console.warn('[case-detail] could not load action reference data', e)
  }
}

// ── Add New Action modal ─────────────────────────────────────────────────────
const addActionModalOpen = ref(false)
const addActionForm = reactive({
  title: '', holder: '', owner: '', action_status_id: '',
  target_dt: '', actioned: false, actioned_dt: '',
  notes: '', instruction: '',
})
const addActionError       = ref('')
const addActionSaving      = ref(false)
const addActionConfirmOpen = ref(false)
// Helper: find status ID by description regex
function _findStatusId(pattern) {
  return (actionStatuses.value.find(s => pattern.test(s.status_desc)) || {}).action_status_id || ''
}

// ── Edit Action modal ────────────────────────────────────────────────────────
const editActionModalOpen = ref(false)
const editActionForm = reactive({
  action_id: '', title: '', holder: '', owner: '', action_status_id: '',
  actioned_dt: '', notes: '', instruction: '',
})
const editActionError  = ref('')
const editActionSaving = ref(false)

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

// Add-Offence modal state — triggered from the Offences tab ADD button.
// allOffences is loaded once on first open and reused on subsequent opens.
const offenceModalOpen    = ref(false)
const offenceModalSaving  = ref(false)
const offenceModalError   = ref('')
const offenceModalForm    = reactive({ offence_id: '', offence_charge: '', case_offence_statement: '' })
const allOffences         = ref([])
const offenceSearch       = ref('')
const offenceDropdownOpen = ref(false)

const filteredOffences = computed(() => {
  const q = (offenceSearch.value || '').trim().toLowerCase()
  if (!q) return allOffences.value
  return allOffences.value.filter(o =>
    (o.cjs_code || '').toLowerCase().includes(q) ||
    (o.description || '').toLowerCase().includes(q)
  )
})

// Add-Note modal state — small inline modal triggered from the Notes tab.
const noteModalOpen = ref(false)
const noteText      = ref('')
const noteSaving    = ref(false)
const noteError     = ref('')

onMounted(async () => {
  await loadCase()
  // When the page opens with ?mode=edit (e.g. deep-link from the case list),
  // isEditMode is already true and enterEditMode() is never called.
  // Seed dropdown options and form values here so every field comes up filled.
  if (isEditMode.value) {
    const opts = [ensureStatusOptions(), _ensureTitleOptions(), _ensureVerificationOptions(), _ensureReasonOptions()]
    if (isPcnCase.value && hasVehicle.value) opts.push(_ensurePcnOptions())
    await Promise.all(opts)
    _populateCustomerForm()
    if (_journeyRaw.value) { _populateJourneyForm(); ensureQuestionAtOptions(); _ensureRailCardTypeOptions() }
    if (isPcnCase.value && hasVehicle.value) _populateVehicleForm()
  }
})

const tabs = computed(() => [
  { id: 'actions',     label: 'ACTIONS' },
  { id: 'customer',    label: 'CUSTOMER DETAILS' },
  { id: 'journey',     label: isPcnCase.value ? 'CAR PARKING DETAILS' : 'JOURNEY DETAILS' },
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

// editCase() removed — the header bar now drives mode switching via
// enterEditMode / saveEdit / cancelEdit instead of a no-op stub.
async function closeAction() {
  const ids = [...selectedActionIds]
  if (ids.length === 0) {
    actionError.value = 'Select at least one action first.'
    setTimeout(() => { if (actionError.value.startsWith('Select')) actionError.value = '' }, 3000)
    return
  }

  const confirm = await Swal.fire({
    title: 'Close & Action',
    text: `Close ${ids.length} action${ids.length === 1 ? '' : 's'} and unlock any successors?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
  })
  if (!confirm.isConfirmed) return

  actionBusy.value  = true
  actionError.value = ''
  try {
    const res      = await actionsService.closeAndAction(ids)
    const closed   = res?.closed   ?? 0
    const unlocked = res?.unlocked ?? 0
    const skipped  = res?.skipped  ?? []
    let msg = `Closed ${closed} action${closed === 1 ? '' : 's'}`
    if (unlocked > 0) msg += `, unlocked ${unlocked} successor${unlocked === 1 ? '' : 's'}`
    if (skipped.length) {
      msg += `, skipped ${skipped.length}`
      console.warn('[close-and-action] skipped', skipped)
    }
    await Swal.fire({
      icon: 'success',
      title: 'Done',
      text: msg,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    })
    selectedActionIds.clear()
    await reloadActions()
  } catch (e) {
    actionError.value = e?.data?.detail || e?.message || 'CLOSE & ACTION failed.'
  } finally {
    actionBusy.value = false
  }
}

async function editAction() {
  if (selectedActionIds.size === 0) {
    actionError.value = 'Select an action to edit.'
    setTimeout(() => { if (actionError.value.startsWith('Select')) actionError.value = '' }, 3000)
    return
  }
  if (selectedActionIds.size > 1) {
    actionError.value = 'Select only one action to edit.'
    setTimeout(() => { if (actionError.value.startsWith('Select')) actionError.value = '' }, 3000)
    return
  }
  const id  = [...selectedActionIds][0]
  const raw = _actionsRaw.value.find(a => a.action_id === id)
  if (!raw) return
  editActionForm.action_id        = raw.action_id
  editActionForm.title            = raw.action_name || raw.title || ''
  editActionForm.holder           = raw.holder || ''
  editActionForm.owner            = raw.owner  || ''
  editActionForm.action_status_id = raw.action_status_id || ''
  editActionForm.actioned_dt      = raw.actioned_dt ? raw.actioned_dt.slice(0, 10) : ''
  editActionForm.notes            = raw.notes       || ''
  editActionForm.instruction      = raw.instruction || ''
  editActionError.value  = ''
  editActionSaving.value = false
  await ensureActionRefData()
  editActionModalOpen.value = true
}

async function submitEditAction() {
  editActionSaving.value = true
  editActionError.value  = ''
  try {
    const payload = {
      title:            editActionForm.title.trim()            || undefined,
      holder:           editActionForm.holder                  || undefined,
      owner:            editActionForm.owner                   || undefined,
      action_status_id: editActionForm.action_status_id        || undefined,
      actioned_dt:      editActionForm.actioned_dt             || undefined,
      notes:            editActionForm.notes                   || undefined,
      instruction:      editActionForm.instruction             || undefined,
    }
    await actionsService.update(editActionForm.action_id, payload)
    editActionModalOpen.value = false
    await reloadActions()
  } catch (e) {
    editActionError.value = e?.data?.detail || e?.message || 'Failed to save action.'
  } finally {
    editActionSaving.value = false
  }
}

// "Actioned?" checkbox intercept — shows confirm modal before committing the check.
function onActionedCheckboxChange(e) {
  if (e.target.checked) {
    addActionForm.actioned = true   // commit so Vue tracks the change; confirm decides fate
    addActionConfirmOpen.value = true
  } else {
    addActionForm.actioned         = false
    addActionForm.action_status_id = _findStatusId(/^open$/i)
  }
}
function confirmActionedYes() {
  addActionForm.actioned         = true
  addActionForm.action_status_id = _findStatusId(/closed/i)
  addActionConfirmOpen.value     = false
}
function confirmActionedNo() {
  addActionForm.actioned         = false
  addActionForm.action_status_id = _findStatusId(/^open$/i)
  addActionConfirmOpen.value     = false
}

async function addNewAction() {
  addActionForm.title            = ''
  addActionForm.holder           = ''
  addActionForm.owner            = ''
  addActionForm.action_status_id = ''
  addActionForm.target_dt        = ''
  addActionForm.actioned         = false
  addActionForm.actioned_dt      = new Date().toISOString().slice(0, 10)
  addActionForm.notes            = ''
  addActionForm.instruction      = ''
  addActionError.value       = ''
  addActionSaving.value      = false
  addActionConfirmOpen.value = false
  await ensureActionRefData()
  addActionModalOpen.value = true
}

async function submitAddAction() {
  if (!addActionForm.title.trim()) {
    addActionError.value = 'Action name is required.'
    return
  }
  addActionSaving.value = true
  addActionError.value  = ''
  try {
    await actionsService.create({
      case_id:          route.params.caseid,
      title:            addActionForm.title.trim(),
      holder:           addActionForm.holder           || undefined,
      owner:            addActionForm.owner            || undefined,
      action_status_id: addActionForm.action_status_id || undefined,
      target_dt:        addActionForm.target_dt || undefined,
      actioned_dt:      addActionForm.actioned && addActionForm.actioned_dt
                          ? addActionForm.actioned_dt
                          : undefined,
      notes:            addActionForm.notes            || undefined,
      instruction:      addActionForm.instruction      || undefined,
    })
    addActionModalOpen.value = false
    await reloadActions()
  } catch (e) {
    addActionError.value = e?.data?.detail || e?.message || 'Failed to create action.'
  } finally {
    addActionSaving.value = false
  }
}

async function exportExcel(section) {
  if (section !== 'actions') return
  try {
    await actionsService.exportByCase(route.params.caseid)
  } catch (e) {
    actionError.value = e?.message || 'Export failed.'
    setTimeout(() => { actionError.value = '' }, 4000)
  }
}
function showDescription()           { /* TODO */ }
function enterAddressSearchReference(){ /* TODO */ }

async function performAddressSearch() {
  if (!isEditMode.value) return
  const pc = (customerForm.post_code || '').trim()
  if (!pc) {
    addressLookupError.value = 'Enter a postcode first.'
    return
  }
  addressLookupLoading.value = true
  addressLookupError.value   = ''
  addressLookupInfo.value    = ''
  addressSuggestions.value   = []
  try {
    const results = await addressesService.lookup(pc)
    if (results.length === 0) {
      addressLookupError.value = 'Postcode not found.'
      return
    }
    addressSuggestions.value = results
  } catch (err) {
    addressLookupError.value = err?.data?.detail || err?.message || 'Address lookup failed.'
  } finally {
    addressLookupLoading.value = false
  }
}

async function applySuggestion(a) {
  // Addressy postcode container (type='Postcode') — drill in,
  // matching selectCountry(id) in address.cfc.
  if (a._addressyType === 'Postcode') {
    if (a.postcode) {
      const normalized = a.postcode.trim().toUpperCase().replace(/\s+/g, '')
      _cdLastAutoLookedUp = normalized   // prevent the watch firing another find
      customerForm.post_code = a.postcode
    }
    addressLookupError.value   = ''
    addressLookupInfo.value    = ''
    addressLookupLoading.value = true
    try {
      const results = await addressesService.addressyFind(customerForm.post_code, a.id)
      addressSuggestions.value = results.length
        ? results.map(r => ({ id: r.id, postcode: r.postcode, label: r.description, _addressyType: r.type }))
        : []
      if (!results.length) addressLookupError.value = 'No addresses found for this area.'
    } catch (_) {
      addressLookupError.value = 'Address lookup failed.'
    } finally {
      addressLookupLoading.value = false
    }
    return
  }

  // Addressy address item (any non-Postcode type with _addressyType set) —
  // retrieve full details, matching selectAddress(id) in address.cfc.
  if (a._addressyType !== undefined) {
    addressLookupLoading.value = true
    addressLookupError.value   = ''
    addressSuggestions.value   = []
    try {
      const result = await addressesService.addressyRetrieve(a.id)
      if (result.line1)       customerForm.address1  = result.line1
      if (result.line2)       customerForm.address2  = result.line2
      if (result.city)        customerForm.city_town = result.city
      if (result.postal_code) {
        const normalized = result.postal_code.trim().toUpperCase().replace(/\s+/g, '')
        _cdLastAutoLookedUp = normalized   // prevent watch re-triggering a lookup
        customerForm.post_code = result.postal_code
      }
      addressLookupInfo.value = result.line1
        ? `Filled from ${result.city || result.postal_code}. Adjust house number if needed.`
        : `Postcode matched: ${result.postal_code}. Please enter Address 1 and Address 2.`
    } catch (_) {
      addressLookupError.value = 'Failed to retrieve address details.'
    } finally {
      addressLookupLoading.value = false
    }
    return
  }

  // postcodes.io lookup result (from the "?" button) — fill fields directly.
  if (a.line_1)   customerForm.address1  = a.line_1
  if (a.line_2)   customerForm.address2  = a.line_2
  if (a.town)     customerForm.city_town = a.town
  if (a.postcode) customerForm.post_code = a.postcode
  const where = [a.town, a.county].filter(Boolean).join(', ')
  addressLookupInfo.value = a.line_1
    ? `Filled from ${where || a.postcode}. Adjust house number if needed.`
    : `Postcode matched: ${where || a.postcode}. Please enter Address 1 and Address 2.`
  addressSuggestions.value = []
}

// Auto-lookup as the user types:
//   3+ chars but not a full postcode → Addressy find (containers + addresses)
//   full postcode                    → postcodes.io address lookup (fill fields)
const _CD_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/
let _cdPostcodeLookupTimer = null
let _cdLastAutoLookedUp = ''

watch(() => customerForm.post_code, (newVal) => {
  if (!isEditMode.value) return
  if (_cdPostcodeLookupTimer) clearTimeout(_cdPostcodeLookupTimer)

  const trimmed    = (newVal || '').trim()
  const normalized = trimmed.toUpperCase().replace(/\s+/g, '')

  // Full postcode — do a full address lookup (debounced 500 ms).
  if (_CD_POSTCODE_RE.test(normalized)) {
    if (normalized === _cdLastAutoLookedUp) return
    _cdPostcodeLookupTimer = setTimeout(() => {
      _cdLastAutoLookedUp = normalized
      performAddressSearch()
    }, 500)
    return
  }

  // Too short — clear state.
  if (trimmed.length < 3) {
    addressSuggestions.value = []
    addressLookupError.value = ''
    addressLookupInfo.value  = ''
    return
  }

  // Partial (3+ chars, not yet a full postcode) — Addressy find (debounced 400 ms).
  // Mirrors the keyup handler in customerdetails.cfm: selectCountry('') when length > 3.
  _cdPostcodeLookupTimer = setTimeout(async () => {
    addressLookupError.value   = ''
    addressLookupInfo.value    = ''
    addressLookupLoading.value = true
    try {
      const results = await addressesService.addressyFind(trimmed)
      addressSuggestions.value = results.length
        ? results.map(r => ({ id: r.id, postcode: r.postcode, label: r.description, _addressyType: r.type }))
        : []
      if (!results.length) addressLookupError.value = 'No matching postcodes found.'
    } catch (_) {
      // Addressy errors are non-critical; fail silently.
    } finally {
      addressLookupLoading.value = false
    }
  }, 400)
})

function _dismissCdSuggestionsOnEscape(e) {
  if (e.key === 'Escape') addressSuggestions.value = []
}
function _dismissCdSuggestionsOnClickOutside(e) {
  const popover = document.querySelector('.address-suggest-popover')
  const target  = e.target
  if (popover && !popover.contains(target) && !target.closest('.input-with-icon')) {
    addressSuggestions.value = []
  }
}
watch(addressSuggestions, (rows) => {
  if (rows.length) {
    document.addEventListener('keydown', _dismissCdSuggestionsOnEscape)
    document.addEventListener('mousedown', _dismissCdSuggestionsOnClickOutside)
  } else {
    document.removeEventListener('keydown', _dismissCdSuggestionsOnEscape)
    document.removeEventListener('mousedown', _dismissCdSuggestionsOnClickOutside)
  }
})

async function addOffence() {
  offenceModalForm.offence_id            = ''
  offenceModalForm.offence_charge        = ''
  offenceModalForm.case_offence_statement = ''
  offenceModalError.value   = ''
  offenceModalSaving.value  = false
  offenceSearch.value       = ''
  offenceDropdownOpen.value = false
  // Load once; sort by CJS code for consistent display order
  if (!allOffences.value.length) {
    try {
      const data = await offencesService.getAll()
      allOffences.value = data.slice().sort((a, b) =>
        (a.cjs_code || '').localeCompare(b.cjs_code || ''))
    } catch { allOffences.value = [] }
  }
  offenceModalOpen.value = true
}

function pickOffence(offence) {
  offenceSearch.value = offence.cjs_code
    ? `${offence.cjs_code} — ${offence.description}`
    : (offence.description || '')
  offenceDropdownOpen.value   = false
  offenceModalForm.offence_id = offence.offence_id
  onOffenceModalSelect(offence.offence_id)
}

function onOffenceSearchInput() {
  offenceDropdownOpen.value   = true
  // Clear the selection so submit doesn't use a stale offence_id
  offenceModalForm.offence_id             = ''
  offenceModalForm.offence_charge         = ''
  offenceModalForm.case_offence_statement = ''
}

async function onOffenceModalSelect(offenceId) {
  const offence = allOffences.value.find(o => o.offence_id === offenceId)
  if (!offence) return
  offenceModalForm.offence_charge = offence.charge || ''
  // Fetch full detail for the offence_statement (deferred in the list response)
  try {
    const detail = await offencesService.getOne(offenceId)
    offenceModalForm.case_offence_statement = (detail.offence_statement || '').slice(0, 50)
  } catch {
    offenceModalForm.case_offence_statement = ''
  }
}

async function submitOffence() {
  if (!offenceModalForm.offence_id) {
    offenceModalError.value = 'Please select an offence.'
    return
  }
  offenceModalSaving.value = true
  offenceModalError.value  = ''
  try {
    const caseId = String(route.params.caseid)
    const payload = { offence_id: offenceModalForm.offence_id }
    if (offenceModalForm.offence_charge)        payload.offence_charge        = offenceModalForm.offence_charge
    if (offenceModalForm.case_offence_statement) payload.case_offence_statement = offenceModalForm.case_offence_statement
    const created = await casesService.addOffence(caseId, payload)
    // Merge cjs_code / description from the already-loaded offence list
    const offence = allOffences.value.find(o => o.offence_id === created.offence_id)
    const label = offence?.cjs_code
      ? `${offence.cjs_code} — ${offence.description}`
      : (offence?.description ?? 'Offence')
    offences.value.push({
      ...created,
      cjs_code:    offence?.cjs_code    ?? null,
      description: offence?.description ?? null,
    })
    offenceModalOpen.value = false
    await Swal.fire({
      icon:              'success',
      title:             'Offence Added',
      text:              `"${label}" has been added to this case.`,
      timer:             2000,
      showConfirmButton: false,
    })
  } catch (err) {
    offenceModalError.value = err?.data?.detail || err?.message || 'Failed to add offence.'
  } finally {
    offenceModalSaving.value = false
  }
}

async function doRemoveOffence(caseOffenceId) {
  const target = offences.value.find(o => o.case_offence_id === caseOffenceId)
  const label  = target?.cjs_code
    ? `${target.cjs_code} — ${target.description}`
    : (target?.offence_id ?? 'this offence')

  const { isConfirmed } = await Swal.fire({
    icon:               'warning',
    title:              'Remove Offence?',
    text:               `Remove "${label}" from this case? This cannot be undone.`,
    showCancelButton:   true,
    confirmButtonText:  'Yes, remove',
    cancelButtonText:   'Cancel',
    confirmButtonColor: '#dc2626',
  })
  if (!isConfirmed) return

  try {
    await casesService.removeOffence(String(route.params.caseid), caseOffenceId)
    offences.value = offences.value.filter(o => o.case_offence_id !== caseOffenceId)
    await Swal.fire({
      icon:              'success',
      title:             'Offence Removed',
      text:              `"${label}" has been removed from this case.`,
      timer:             2000,
      showConfirmButton: false,
    })
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Error', text: err?.data?.detail || 'Failed to remove offence.' })
  }
}
function overrideAdmin() {
  // Enter override mode: seed the edit buffer with the current admin cost
  // and make the input editable — mirrors old project's OVERRIDE button.
  adminOverrideCost.value = settlement.adminCosts
  adminOverrideMode.value = true
}

function cancelAdminOverride() {
  adminOverrideMode.value = false
  adminOverrideCost.value = ''
}

async function saveAdminOverride() {
  const newCost = adminOverrideCost.value !== '' ? Number(adminOverrideCost.value) : 0
  savingOverride.value = true
  try {
    const updated = await casesService.update(route.params.caseid, {
      admin_cost:       newCost,
      is_admin_override: 1,
    })
    // Refresh displayed values from the server response (recalculation happened server-side).
    settlement.adminCosts     = updated.admin_cost     != null ? Number(updated.admin_cost).toFixed(2)     : ''
    settlement.totalAdminCost = updated.total_admin_cost != null ? Number(updated.total_admin_cost).toFixed(2) : ''
    // Recompute client-side derived fields from the fresh response values.
    const _admin  = Number(updated.admin_cost || 0)
    const _fare   = Number(updated.outstanding_fare || 0)
    const _manual = Number(updated.manual_settlement || 0)
    const _oocs   = Number(updated.oocs_amount || 0)
    if (isPcnCase.value) {
      const _pcn  = Number(updated.parking_charge_notice  || 0)
      const _note = Number(updated.pcn_notice_to_owner    || 0)
      const _cert = Number(updated.pcn_charge_certificate || 0)
      settlement.automaticDues = Math.max(_pcn, _note, _cert).toFixed(2)
    } else {
      settlement.automaticDues = (_admin + _fare).toFixed(2)
    }
    if (_manual > 0) {
      settlement.manualDues = _manual.toFixed(2)
    } else if (_oocs > 0) {
      settlement.manualDues = _oocs.toFixed(2)
    } else {
      settlement.manualDues = ''
    }
    court.isAdminOverride = true
    // Keep _caseRow in sync so re-entering edit mode sees the latest values.
    if (_caseRow.value) {
      _caseRow.value.admin_cost      = updated.admin_cost
      _caseRow.value.is_admin_override = updated.is_admin_override
      _caseRow.value.total_admin_cost  = updated.total_admin_cost
      _caseRow.value.amount_due        = updated.amount_due
    }
    adminOverrideMode.value = false
    adminOverrideCost.value = ''
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Override Failed', text: err?.data?.detail || 'Could not save admin cost override.' })
  } finally {
    savingOverride.value = false
  }
}
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
// ── Letters tab ─────────────────────────────────────────────────────────
//
// Mirrors legacy Case Detail "Letters" tab:
//   Title / Status / Copies / Created / Edited / Printed / Created By / Edited By
// Single-row selection drives OPEN / PREVIEW / EDIT / UPDATE STATUS.
// ADD LETTER works without a selection (it adds a new letter to this case).
const letterRows           = ref([])
const lettersLoading       = ref(false)
const lettersError         = ref('')
const selectedLetterCommId = ref('')
const letterTemplateOptions = ref([])
const lettersPage          = ref(1)
const lettersPerPage       = ref(5)

const letterSelected = computed(() =>
  letterRows.value.some(r => r.comm_id === selectedLetterCommId.value)
)

function selectedLetterRow() {
  return letterRows.value.find(r => r.comm_id === selectedLetterCommId.value) || null
}

// ── Client-side pagination (legacy parity: small per-case datasets) ─────
const lettersTotalPages = computed(() =>
  Math.max(1, Math.ceil(letterRows.value.length / lettersPerPage.value))
)
const lettersRangeStart = computed(() =>
  letterRows.value.length === 0 ? 0 : (lettersPage.value - 1) * lettersPerPage.value + 1
)
const lettersRangeEnd = computed(() =>
  Math.min(lettersPage.value * lettersPerPage.value, letterRows.value.length)
)
const pagedLetterRows = computed(() =>
  letterRows.value.slice(lettersRangeStart.value - 1, lettersRangeEnd.value)
)
// Compact page-number list: 1 … current-1, current, current+1 … last
const lettersPageNumbers = computed(() => {
  const total = lettersTotalPages.value
  const cur   = lettersPage.value
  const out   = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) {
      out.push(i)
    } else if (out[out.length - 1] !== '…') {
      out.push('…')
    }
  }
  return out.filter((p, i, arr) => p !== '…' || arr[i - 1] !== '…').slice(0, 7)
})
// Header checkbox: ticked only when the currently-selected row is on the
// page; toggling it selects/deselects the first row on the page. Legacy
// behaves as a single-select grid even though it uses checkbox controls.
const allLettersOnPageSelected = computed(() =>
  pagedLetterRows.value.length > 0 &&
  pagedLetterRows.value.some(r => r.comm_id === selectedLetterCommId.value)
)
function toggleAllLettersOnPage() {
  if (allLettersOnPageSelected.value) {
    selectedLetterCommId.value = ''
  } else if (pagedLetterRows.value.length) {
    selectedLetterCommId.value = pagedLetterRows.value[0].comm_id
  }
}
function toggleLetterRow(commId) {
  // Enforce single-select even with checkbox controls — toggling a row
  // either selects it or clears the selection entirely. Matches the way
  // the OPEN / EDIT / PREVIEW buttons each operate on one letter at a time.
  selectedLetterCommId.value = selectedLetterCommId.value === commId ? '' : commId
}

// Reset to page 1 when the data set or page size changes
watch([letterRows, lettersPerPage], () => { lettersPage.value = 1 })

const letterStatusNames = ['IN_PRINT_QUEUE', 'PRINTED', 'CANCELLED']

function letterStatusColor(name) {
  const u = (name || '').toUpperCase()
  if (u === 'PRINTED')        return 'success'
  if (u === 'IN_PRINT_QUEUE') return 'info'
  if (u === 'CANCELLED')      return 'danger'
  return 'neutral'
}

async function loadCaseLetters() {
  const caseId = route.params.caseid
  if (!caseId) return
  lettersLoading.value = true
  lettersError.value = ''
  try {
    letterRows.value = await caseLettersService.list(caseId) || []
    // Clear selection if the previously-selected row is gone (e.g. after a reload).
    if (!letterRows.value.some(r => r.comm_id === selectedLetterCommId.value)) {
      selectedLetterCommId.value = ''
    }
  } catch (e) {
    console.error('[case-letters] list failed', e)
    lettersError.value = e?.message || 'Failed to load letters.'
    letterRows.value = []
  } finally {
    lettersLoading.value = false
  }
}

async function _ensureLetterTemplateOptions() {
  if (letterTemplateOptions.value.length) return
  try {
    const data = await actionsService.letterTemplates()
    letterTemplateOptions.value = data?.results ?? (Array.isArray(data) ? data : [])
  } catch (e) {
    console.error('[case-letters] template list failed', e)
  }
}

// ADD / EDIT share the same modal.
const letterModal = reactive({
  open:       false,
  mode:       'add',     // 'add' | 'edit'
  commId:     '',        // populated in edit mode
  templateId: '',
  copies:     1,
  saving:     false,
  error:      '',
})

function closeLetterModal() {
  if (letterModal.saving) return
  letterModal.open = false
}

async function addLetter() {
  letterModal.mode       = 'add'
  letterModal.commId     = ''
  letterModal.templateId = ''
  letterModal.copies     = 1
  letterModal.error      = ''
  letterModal.saving     = false
  letterModal.open       = true
  await _ensureLetterTemplateOptions()
}

async function editLetter() {
  const row = selectedLetterRow()
  if (!row) return
  if ((row.letter_status_name || '').toUpperCase() === 'PRINTED') {
    window.alert('This letter has already been printed and cannot be edited.')
    return
  }
  letterModal.mode       = 'edit'
  letterModal.commId     = row.comm_id
  letterModal.templateId = row.letter_template_id || ''
  letterModal.copies     = row.copies || 1
  letterModal.error      = ''
  letterModal.saving     = false
  letterModal.open       = true
  await _ensureLetterTemplateOptions()
}

async function submitLetterModal() {
  const caseId = route.params.caseid
  if (!caseId || !letterModal.templateId) return
  letterModal.saving = true
  letterModal.error  = ''
  try {
    if (letterModal.mode === 'edit') {
      await caseLettersService.update(caseId, letterModal.commId, {
        letterTemplateId: letterModal.templateId,
        copies:           letterModal.copies || 1,
      })
    } else {
      // ADD reuses the bulk CREATE LETTER endpoint with a single case_id.
      await actionsService.createLetter({
        caseIds:          [caseId],
        letterTemplateId: letterModal.templateId,
        copies:           letterModal.copies || 1,
      })
    }
    letterModal.open = false
    await loadCaseLetters()
  } catch (e) {
    console.error('[case-letters] save failed', e)
    letterModal.error = e?.data?.detail || e?.message || 'Save failed.'
  } finally {
    letterModal.saving = false
  }
}

// OPEN LETTER + PREVIEW LETTER both render the rendered PDF via the existing
// templates.preview-letter/ endpoint. OPEN downloads it; PREVIEW opens it
// in a new tab inline. Distinction matches legacy semantics.
async function _fetchLetterPdfBlob(commId, caseId) {
  // The preview endpoint is GET with auth header — apiDownload fetches as
  // attachment (forced download). For inline preview we want Blob+open.
  // Use a direct fetch + Blob URL so we control the disposition client-side.
  const { useAuthStore } = await import('@/store/auth.js')
  const auth = useAuthStore()
  const token = auth?.accessToken ?? null
  const url = `/api/revp/templates/preview-letter/?case_id=${encodeURIComponent(caseId)}&comm_data_id=${encodeURIComponent(commId)}`
  const resp = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!resp.ok) {
    let detail = null
    try { detail = await resp.json() } catch {}
    throw new Error(detail?.detail || `Letter render failed (${resp.status})`)
  }
  return await resp.blob()
}

async function previewLetter() {
  const row = selectedLetterRow()
  if (!row) return
  const caseId = route.params.caseid
  try {
    const blob = await _fetchLetterPdfBlob(row.comm_id, caseId)
    const objUrl = URL.createObjectURL(blob)
    window.open(objUrl, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(objUrl), 60_000)
  } catch (e) {
    console.error('[case-letters] preview failed', e)
    window.alert(e?.message || 'Could not preview this letter.')
  }
}

async function openLetter() {
  const row = selectedLetterRow()
  if (!row) return
  const caseId = route.params.caseid
  try {
    const blob = await _fetchLetterPdfBlob(row.comm_id, caseId)
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const title = (row.letter_template_title || 'letter').replace(/\s+/g, '_')
    a.href = objUrl
    a.download = `${title}-${stamp}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(objUrl), 10_000)
  } catch (e) {
    console.error('[case-letters] open failed', e)
    window.alert(e?.message || 'Could not download this letter.')
  }
}

// UPDATE STATUS modal
const statusModal = reactive({
  open:        false,
  currentName: '',
  newName:     '',
  saving:      false,
  error:       '',
})

function closeStatusModal() {
  if (statusModal.saving) return
  statusModal.open = false
}

function updateLetterStatus() {
  const row = selectedLetterRow()
  if (!row) return
  statusModal.currentName = row.letter_status_name || ''
  statusModal.newName     = ''
  statusModal.error       = ''
  statusModal.saving      = false
  statusModal.open        = true
}

async function submitStatusModal() {
  const row = selectedLetterRow()
  const caseId = route.params.caseid
  if (!row || !caseId || !statusModal.newName) return
  statusModal.saving = true
  statusModal.error  = ''
  try {
    await caseLettersService.changeStatus(caseId, row.comm_id, statusModal.newName)
    statusModal.open = false
    await loadCaseLetters()
  } catch (e) {
    console.error('[case-letters] status change failed', e)
    statusModal.error = e?.data?.detail || e?.message || 'Status change failed.'
  } finally {
    statusModal.saving = false
  }
}
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
.badge-override {
  display: inline-block;
  padding: 2px 7px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
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

/* Editable input — visibly distinct from the locked variant so the
   operator knows the header card is in edit mode. */
.field-editable {
  background: #fff;
  color: var(--text-strong);
  border: 1px solid var(--primary, #5b8def);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: 12px;
  width: 100%;
}
.field-editable:focus {
  outline: none;
  border-color: var(--primary, #5b8def);
  box-shadow: 0 0 0 2px rgba(91, 141, 239, 0.18);
}

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

/* ── Modal overlay ──────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-panel {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex; flex-direction: column;
  max-height: 90vh; overflow-y: auto;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  position: sticky; top: 0; background: #fff; z-index: 1;
}
.modal-title { margin: 0; font-size: 1rem; font-weight: 600; }
.modal-close {
  border: none; background: transparent;
  font-size: 1.5rem; line-height: 1;
  cursor: pointer; color: #6b7280; padding: 0 4px;
}
.modal-close:hover { color: #b91c1c; }
.row-selected { background: #f0fdf4; }

.form-error { display: block; margin-top: 6px; font-size: 12px; color: #b91c1c; }
.form-info  { display: block; margin-top: 6px; font-size: 12px; color: #047857; }

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
  margin-block-start: 4px;
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

/* Letters tab — status as inline coloured text (matches legacy: no badge background) */
.letter-status-text { font-weight: 600; color: var(--text-strong, #1f2937); }
.letter-status-text[data-status="IN_PRINT_QUEUE"] { color: #d97706; }   /* amber */
.letter-status-text[data-status="PRINTED"]        { color: #047857; }   /* green */
.letter-status-text[data-status="CANCELLED"]      { color: #b91c1c; }   /* red */
</style>
