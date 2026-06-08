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
          <div class="field-cell">
            <select v-model="form.caseTypeId" :disabled="caseTypesLoading">
              <option value="">
                {{ caseTypesLoading ? 'Loading…' : 'Please select Case' }}
              </option>
              <option v-for="t in caseTypes" :key="t.case_type_id" :value="t.case_type_id" :title="t.description">
                {{ t.code }}{{ t.description ? ' — ' + t.description : '' }}
              </option>
            </select>
            <span v-if="caseTypesError" class="form-error" role="alert">{{ caseTypesError }}</span>
          </div>

          <label class="form-label-left">Offence Date<span class="req">*</span></label>
          <input v-model="form.offenceDate" type="date" />

          <label class="form-label-left">Case Issuer<span class="req">*</span></label>
          <div class="field-cell">
            <div class="autocomplete" ref="issuerAcRef">
              <input
                v-model="caseIssuerSearch"
                type="text"
                :placeholder="caseIssuersLoading ? 'Loading…' : 'Type to search Case Issuer'"
                autocomplete="off"
                spellcheck="false"
                maxlength="100"
                @focus="caseIssuerOpen = true"
                @input="onIssuerInput"
              />
              <div v-if="caseIssuerOpen && !caseIssuersLoading" class="autocomplete-dropdown">
                <button
                  v-for="u in filteredIssuers"
                  :key="u.user_id"
                  type="button"
                  class="autocomplete-item"
                  :class="{ active: u.user_id === form.caseIssuerId }"
                  @mousedown.prevent="selectIssuer(u)"
                >
                  {{ formatIssuer(u) }}
                </button>
                <div v-if="filteredIssuers.length === 0" class="autocomplete-empty">
                  No matches.
                </div>
              </div>
            </div>
            <span v-if="caseIssuersError" class="form-error" role="alert">{{ caseIssuersError }}</span>
          </div>
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
        <!--
          Existing-customer link banner. Appears when the user has picked
          a match from the PERFORM ADDRESS SEARCH modal. On submit the chain
          will reuse this customer_id instead of creating a new customer row.
        -->
        <div v-if="linkedCustomerName" class="linked-customer-banner" role="status">
          <span>
            <strong>Linked to existing customer:</strong> {{ linkedCustomerName }}.
            A new case will be added to their record (no duplicate customer created).
          </span>
          <button type="button" class="link-unlink-btn" @click="unlinkCustomer">
            Unlink &amp; create new customer instead
          </button>
        </div>
        <div class="two-col">
          <fieldset class="legend-group">
            <legend>Customer</legend>

            <div class="form-row-left">
              <label class="form-label-left">Title</label>
              <div class="field-cell">
                <select v-model="form.titleId" :disabled="titlesLoading">
                  <option value="">
                    {{ titlesLoading ? 'Loading…' : 'Please Select Title' }}
                  </option>
                  <option v-for="t in titles" :key="t.lookup_data_id" :value="t.lookup_data_id">
                    {{ t.lookup_data_value }}
                  </option>
                </select>
                <span v-if="titlesError" class="form-error" role="alert">{{ titlesError }}</span>
              </div>

              <label class="form-label-left">First name</label>
              <input v-model="form.firstName" type="text" maxlength="50" />

              <label class="form-label-left">Last Name</label>
              <input v-model="form.lastName" type="text" maxlength="50" />

              <label class="form-label-left">Date of Birth</label>
              <input
                v-model="form.dob"
                type="date"
                :max="dobMaxDate"
                min="1900-01-01"
              />

              <label class="form-label-left">Age</label>
              <input
                :value="computedAge"
                type="number"
                readonly
                placeholder="(auto from DOB)"
                class="field-readonly"
              />

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
              <div class="field-cell">
                <select v-model="form.employmentStatusId" :disabled="employmentLoading">
                  <option value="">
                    {{ employmentLoading ? 'Loading…' : 'Please Select' }}
                  </option>
                  <option v-for="e in employmentStatuses" :key="e.lookup_data_id" :value="e.lookup_data_id">
                    {{ e.lookup_data_value }}
                  </option>
                </select>
                <span v-if="employmentError" class="form-error" role="alert">{{ employmentError }}</span>
              </div>

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
                <div class="field-cell" style="position:relative">
                  <div class="input-with-icon">
                    <input
                      v-model="form.postcode"
                      type="text"
                      placeholder="Postcode"
                      maxlength="20"
                      @keyup.enter.prevent="performAddressSearch"
                    />
                    <button
                      type="button"
                      class="help-icon"
                      title="Search addresses for this postcode"
                      :disabled="addressLookupLoading"
                      @click="performAddressSearch"
                    >?</button>
                  </div>

                  <!-- Legacy-style suggestion dropdown — appears below the postcode
                       field after a successful lookup. Each row is a click target;
                       picking one fills Address 1 / Town / Postcode on the form.
                       Clicking outside or pressing Escape dismisses it. -->
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
                      @click="applySuggestion(a)"
                      @keyup.enter="applySuggestion(a)"
                      @keyup.space.prevent="applySuggestion(a)"
                    >
                      {{ a.label || [a.line_1, a.town, a.county, a.postcode].filter(Boolean).join(', ') }}
                    </li>
                  </ul>

                  <span v-if="addressLookupError" class="form-error" role="alert">{{ addressLookupError }}</span>
                  <span v-else-if="addressLookupInfo" class="form-info" role="status">{{ addressLookupInfo }}</span>
                </div>

                <label class="form-label-left">Address 1</label>
                <input v-model="form.address1" type="text" placeholder="Address 1" maxlength="100" />

                <label class="form-label-left">Address 2</label>
                <input v-model="form.address2" type="text" placeholder="Address 2" maxlength="100" />

                <label class="form-label-left">Town</label>
                <input v-model="form.town" type="text" placeholder="Town" maxlength="100" />
              </div>
              <div class="flex gap-sm mt-md" style="justify-content: space-between">
                <button class="btn-action-green" @click="openAddressReferenceModal">ENTER ADDRESS SEARCH REFERENCE</button>
                <button class="btn-action-green" @click="openOffenderSearchModal">PERFORM ADDRESS SEARCH</button>
              </div>
              <p v-if="form.addressSearchReference" class="ref-pill">
                Address reference: <strong>{{ form.addressSearchReference }}</strong>
                <button type="button" class="ref-clear" title="Clear" @click="form.addressSearchReference = ''">×</button>
              </p>
            </fieldset>

            <fieldset class="legend-group">
              <legend>Manual Verification</legend>
              <div class="form-row-left">
                <label class="form-label-left">Verification Type</label>
                <div class="field-cell">
                  <select v-model="form.verificationTypeId" :disabled="verificationLoading">
                    <option value="">
                      {{ verificationLoading ? 'Loading…' : 'Please Select Verification Type' }}
                    </option>
                    <option v-for="v in verificationTypes" :key="v.lookup_data_id" :value="v.lookup_data_id">
                      {{ v.lookup_data_value }}
                    </option>
                  </select>
                  <span v-if="verificationError" class="form-error" role="alert">{{ verificationError }}</span>
                </div>

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
                  <option v-for="s in signatureOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- CAR PARK DETAILS — shown in place of journey when case type is PCN.
           Mirrors legacy caseaction.cfm:608 — a PCN case writes a
           revp_vehicle_details row instead of revp_journey_details. -->
      <div v-show="activeTab === 'journey' && isPcnCase">
        <div class="two-col">
          <div class="form-row-left">
            <label class="form-label-left">Vehicle Reg<span class="req">*</span></label>
            <input v-model.trim="form.vehicleReg" type="text" maxlength="12" placeholder="e.g. AB12 XYZ" style="text-transform:uppercase"
                   @input="form.vehicleReg = form.vehicleReg.toUpperCase()" />

            <label class="form-label-left">Colour</label>
            <input v-model.trim="form.vehicleColour" type="text" maxlength="20" placeholder="e.g. Silver" />

            <label class="form-label-left">Make</label>
            <input v-model.trim="form.vehicleMake" type="text" maxlength="20" placeholder="e.g. Ford" />

            <label class="form-label-left">Model</label>
            <input v-model.trim="form.vehicleModel" type="text" maxlength="30" placeholder="e.g. Focus" />

            <label class="form-label-left">Issue Reason</label>
            <input v-model.trim="form.carparkIssueReason" type="text" maxlength="50" placeholder="Reason for the PCN" />

            <label class="form-label-left">Carpark Details</label>
            <textarea v-model="form.carparkDetails" rows="3" maxlength="1000" placeholder="Notes about the location / circumstances"></textarea>
          </div>

          <div class="form-row-left">
            <label class="form-label-left">Offence From (time)</label>
            <input v-model="form.offenceFromTime" type="time" />

            <label class="form-label-left">Offence To (time)</label>
            <input v-model="form.offenceToTime" type="time" />

            <label class="form-label-left">Pay-Display Ticket Number</label>
            <input v-model.trim="form.payDisplayTicketNum" type="text" maxlength="45" />

            <label class="form-label-left">Pay-Display Expiry (time)</label>
            <input v-model="form.payDisplayTicketExpiry" type="time" />
          </div>
        </div>
      </div>

      <!-- JOURNEY DETAILS — hidden when PCN case type is selected.
           Legacy parity: a PCN case has no journey row, an MG11/PFN/UFN
           case has no vehicle row — never both. -->
      <div v-show="activeTab === 'journey' && !isPcnCase">
        <div class="two-col">
          <div class="form-row-left">
            <label class="form-label-left">Place</label>
            <input v-model="form.place" type="text" placeholder="Place" maxlength="100" />

            <label class="form-label-left">Journey From</label>
            <div class="autocomplete" ref="journeyFromAcRef">
              <input
                v-model="form.journeyFrom"
                type="text"
                placeholder="Journey From — name or 3-letter CRS"
                autocomplete="off"
                spellcheck="false"
                maxlength="100"
                @input="onJourneyFromInput"
                @focus="onJourneyFromFocus"
              />
              <div v-if="journeyFromOpen && journeyFromSuggestions.length" class="autocomplete-dropdown">
                <button
                  v-for="s in journeyFromSuggestions"
                  :key="s.station_id"
                  type="button"
                  class="autocomplete-item"
                  @mousedown.prevent="selectJourneyFrom(s)"
                >
                  {{ stationLabel(s) }}
                </button>
              </div>
            </div>

            <label class="form-label-left">Journey To</label>
            <div class="autocomplete" ref="journeyToAcRef">
              <input
                v-model="form.journeyTo"
                type="text"
                placeholder="Journey To — name or 3-letter CRS"
                autocomplete="off"
                spellcheck="false"
                maxlength="100"
                @input="onJourneyToInput"
                @focus="onJourneyToFocus"
              />
              <div v-if="journeyToOpen && journeyToSuggestions.length" class="autocomplete-dropdown">
                <button
                  v-for="s in journeyToSuggestions"
                  :key="s.station_id"
                  type="button"
                  class="autocomplete-item"
                  @mousedown.prevent="selectJourneyTo(s)"
                >
                  {{ stationLabel(s) }}
                </button>
              </div>
            </div>

            <label class="form-label-left">Time &amp; Date of Travel</label>
            <input v-model="form.timeDateOfTravel" type="datetime-local" />

            <label class="form-label-left">Train Service Id</label>
            <input v-model="form.trainServiceId" type="text" placeholder="Train Service Id" maxlength="50" />

            <label class="form-label-left">Reason for Issue</label>
            <select v-model="form.reasonForIssue">
              <option value="">Please Select</option>
              <option v-for="r in reasonForIssueOptions" :key="r.lookup_data_id" :value="r.lookup_data_value">{{ r.lookup_data_value }}</option>
            </select>

            <template v-if="form.reasonForIssue === 'Failed to Carry Railcard'">
              <label class="form-label-left">Rail Card</label>
              <select v-model="form.railCard">
                <option value="">Please Select</option>
                <option v-for="rc in railCardTypeOptions" :key="rc.railcard_id" :value="rc.name">{{ rc.name }}</option>
              </select>
            </template>

            <label class="form-label-left">Questioned At</label>
            <select v-model="form.questionedAt">
              <option value="">Please Select</option>
              <option v-for="opt in questionAtOptions" :key="opt.id" :value="opt.id">{{ opt.description }}</option>
            </select>
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
                <td>
                  {{ n.note }}
                  <button type="button" class="btn-action-red" style="margin-left:8px;padding:2px 8px;font-size:11px;"
                          @click="removeQueuedNote(n.id)">REMOVE</button>
                </td>
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

    <!-- Submit banner + ADD THIS CASE button -->
    <div v-if="submitError" class="submit-banner submit-banner-error" role="alert">
      {{ submitError }}
    </div>
    <div v-if="submitSuccess" class="submit-banner submit-banner-success" role="status">
      {{ submitSuccess }}
    </div>
    <div class="flex" style="justify-content: flex-end; margin-top: 16px">
      <button
        class="btn-add-case"
        :disabled="submitting"
        @click="addThisCase"
      >{{ submitting ? 'SAVING…' : 'ADD THIS CASE' }}</button>
    </div>

    <!-- Offender Description modal (ADD DESCRIPTION button) -->
    <DescriptionModal
      v-model="descriptionModalOpen"
      :description-data="form.description"
      @save="onDescriptionSave"
    />

    <AddressReferenceModal
      v-model="referenceModalOpen"
      :post-code="form.postcode"
      :address1="form.address1"
      :address2="form.address2"
      :town="form.town"
      :country="form.country"
      :first-name="form.firstName"
      :last-name="form.lastName"
      :phone="form.telephone"
      @save="val => form.addressSearchReference = val"
    />
    <OffenderSearchModal
      v-model="offenderSearchOpen"
      :first-name="form.firstName"
      :last-name="form.lastName"
      :postcode="form.postcode"
      :address1="form.address1"
      :address2="form.address2"
      :town="form.town"
      @pick="pickOffenderMatch"
    />

    <!-- Address picker modal (postcodes.io / future provider with >1 result) -->
    <div v-if="addressModalOpen" class="modal-backdrop" @click.self="closeAddressModal">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="addr-modal-title">
        <div class="modal-head">
          <h2 id="addr-modal-title" class="modal-title">Select an address</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="closeAddressModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-sub">Postcode <strong>{{ addressLookupPostcode }}</strong> — {{ addressResults.length }} matches</p>
          <ul v-if="addressResults.length" class="addr-list">
            <li v-for="(a, i) in addressResults" :key="i">
              <button type="button" class="addr-item" @click="pickAddress(a)">
                {{ a.label }}
              </button>
            </li>
          </ul>
          <p v-else class="empty-state-desc">No addresses found for this postcode.</p>
        </div>
      </div>
    </div>

    <!-- Hidden file picker used by the Attachments tab ADD button. -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display:none"
      @change="onAttachmentChosen"
    />

    <!-- Add Note modal — queues the note locally; addThisCase POSTs it to
         /api/revp/cases/<new_case_id>/notes/ after the case row is created. -->
    <div v-if="noteModalOpen" class="modal-backdrop" @click.self="noteModalOpen = false">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-note-title">
        <div class="modal-head">
          <h2 id="add-note-title" class="modal-title">Add Note</h2>
          <button type="button" class="modal-close" aria-label="Close" @click="noteModalOpen = false">×</button>
        </div>
        <div class="modal-body" style="padding:16px 20px;">
          <label class="form-label-left" style="display:block;margin-bottom:6px;">Note text</label>
          <textarea
            v-model="noteText"
            rows="6"
            maxlength="10000"
            placeholder="Type the note here…"
            style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:13px;"
          ></textarea>
          <p v-if="noteError" class="form-error" role="alert"
             style="color:#b91c1c;font-size:12px;margin-top:6px;">
            {{ noteError }}
          </p>
        </div>
        <div class="modal-foot" style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn-action-red"   @click="noteModalOpen = false">CANCEL</button>
          <button type="button" class="btn-action-green" @click="saveQueuedNote">ADD TO LIST</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { casesService }     from '@/services/cases.service.js'
import { customersService } from '@/services/customers.service.js'
import { journeyService }   from '@/services/journey.service.js'
import { vehiclesService }  from '@/services/vehicles.service.js'
import { lookupService }    from '@/services/lookup.service.js'
import { api }              from '@/services/api.js'
import { addressesService } from '@/services/addresses.service.js'
import { stationsService }  from '@/services/stations.service.js'
import AddressReferenceModal from '@/components/AddressReferenceModal.vue'
import OffenderSearchModal   from '@/components/OffenderSearchModal.vue'
import DescriptionModal      from '@/components/DescriptionModal.vue'
// Legacy parity: only two selectable states. Empty selection = customer
// signed normally. The form value ('1' / '2') maps to two boolean columns
// on revp_case (refuse_to_sign / unable_to_sign) when the case is saved.
const signatureOptions = [
  { value: '1', label: 'Refuse to sign' },
  { value: '2', label: 'Unable to sign' },
]

// PCN-detection: case_type.code === 'PCN' OR case_option contains 'Car Park'.
// Mirrors legacy caseaction.cfm:608 — a PCN case creates a vehicle row
// instead of a journey row, and the form should show the Car Park fields
// instead of the Journey From/To inputs.
const isPcnCase = computed(() => {
  const t = caseTypes.value.find(c => c.case_type_id === form.caseTypeId)
  if (!t) return false
  const code = (t.code || '').toUpperCase()
  const option = (t.case_option || '').toLowerCase()
  return code === 'PCN' || option.includes('car park')
})

// Tabs swap "JOURNEY DETAILS" ↔ "CAR PARK DETAILS" based on the case type.
const tabs = computed(() => [
  { id: 'customer',    label: 'CUSTOMER DETAILS' },
  { id: 'journey',     label: isPcnCase.value ? 'CAR PARK DETAILS' : 'JOURNEY DETAILS' },
  { id: 'notes',       label: 'NOTES' },
  { id: 'attachments', label: 'ATTACHMENTS' },
])
const activeTab = ref('customer')
const basicOpen = ref(true)

const caseTypes = ref([])
const caseTypesLoading = ref(false)
const caseTypesError = ref('')

const caseIssuers = ref([])
const caseIssuersLoading = ref(false)
const caseIssuersError = ref('')

// Autocomplete state for Case Issuer
const caseIssuerSearch = ref('')
const caseIssuerOpen = ref(false)
const issuerAcRef = ref(null)
const MAX_ISSUER_SUGGESTIONS = 50

function formatIssuer(u) {
  const name = u.full_name || u.username || ''
  return u.username && u.full_name ? `${u.full_name} (${u.username})` : name
}

const filteredIssuers = computed(() => {
  const q = caseIssuerSearch.value.trim().toLowerCase()
  if (!q) return caseIssuers.value.slice(0, MAX_ISSUER_SUGGESTIONS)
  return caseIssuers.value
    .filter(u =>
      (u.full_name || '').toLowerCase().includes(q)
      || (u.username || '').toLowerCase().includes(q)
    )
    .slice(0, MAX_ISSUER_SUGGESTIONS)
})

function selectIssuer(u) {
  form.caseIssuerId = u.user_id
  caseIssuerSearch.value = formatIssuer(u)
  caseIssuerOpen.value = false
}

function onIssuerInput() {
  caseIssuerOpen.value = true
  // If the user edits away from the selected display, invalidate the selection.
  if (form.caseIssuerId) {
    const selected = caseIssuers.value.find(u => u.user_id === form.caseIssuerId)
    if (selected && caseIssuerSearch.value !== formatIssuer(selected)) {
      form.caseIssuerId = ''
    }
  }
}

function onDocMousedown(e) {
  if (issuerAcRef.value && !issuerAcRef.value.contains(e.target)) {
    caseIssuerOpen.value = false
  }
  if (journeyFromAcRef.value && !journeyFromAcRef.value.contains(e.target)) {
    journeyFromOpen.value = false
  }
  if (journeyToAcRef.value && !journeyToAcRef.value.contains(e.target)) {
    journeyToOpen.value = false
  }
}

// ── Journey From / To autocomplete (station search) ────────────────────────────
// Mirrors the legacy stations.cfc?method=getStationListJson behaviour: type a
// station name fragment or 3-letter CRS code, pick a suggestion shown as
// "STATION NAME - CRS". The value written into the field is the same string,
// matching the legacy data shape.
const STATION_AC_DEBOUNCE_MS = 250
const STATION_AC_MIN_QUERY   = 2
const STATION_AC_LIMIT       = 15

const journeyFromAcRef        = ref(null)
const journeyFromOpen         = ref(false)
const journeyFromSuggestions  = ref([])
let journeyFromTimer = null
let journeyFromSeq   = 0

const journeyToAcRef          = ref(null)
const journeyToOpen           = ref(false)
const journeyToSuggestions    = ref([])
let journeyToTimer = null
let journeyToSeq   = 0

function stationLabel(s) {
  const name = (s.station_name || '').toUpperCase()
  const crs  = (s.crs_code || '').toUpperCase()
  return crs ? `${name} - ${crs}` : name
}

async function runStationSearch(term, seqRef, setSeq, suggestionsRef, openRef) {
  const mySeq = setSeq()
  try {
    const res = await stationsService.autocomplete(term, STATION_AC_LIMIT)
    if (mySeq !== seqRef()) return
    suggestionsRef.value = res?.results ?? []
    openRef.value = suggestionsRef.value.length > 0
  } catch {
    if (mySeq !== seqRef()) return
    suggestionsRef.value = []
    openRef.value = false
  }
}

function onJourneyFromInput() {
  const term = (form.journeyFrom || '').trim()
  if (journeyFromTimer) clearTimeout(journeyFromTimer)
  if (term.length < STATION_AC_MIN_QUERY) {
    journeyFromSuggestions.value = []
    journeyFromOpen.value = false
    return
  }
  journeyFromTimer = setTimeout(() => {
    runStationSearch(
      term,
      () => journeyFromSeq,
      () => ++journeyFromSeq,
      journeyFromSuggestions,
      journeyFromOpen,
    )
  }, STATION_AC_DEBOUNCE_MS)
}

function onJourneyFromFocus() {
  if (journeyFromSuggestions.value.length > 0) journeyFromOpen.value = true
}

function selectJourneyFrom(s) {
  form.journeyFrom = stationLabel(s)
  journeyFromOpen.value = false
}

function onJourneyToInput() {
  const term = (form.journeyTo || '').trim()
  if (journeyToTimer) clearTimeout(journeyToTimer)
  if (term.length < STATION_AC_MIN_QUERY) {
    journeyToSuggestions.value = []
    journeyToOpen.value = false
    return
  }
  journeyToTimer = setTimeout(() => {
    runStationSearch(
      term,
      () => journeyToSeq,
      () => ++journeyToSeq,
      journeyToSuggestions,
      journeyToOpen,
    )
  }, STATION_AC_DEBOUNCE_MS)
}

function onJourneyToFocus() {
  if (journeyToSuggestions.value.length > 0) journeyToOpen.value = true
}

function selectJourneyTo(s) {
  form.journeyTo = stationLabel(s)
  journeyToOpen.value = false
}

// Lookup-data dropdowns (Title, Employment Status, …)
const titles = ref([])
const titlesLoading = ref(false)
const titlesError = ref('')

const employmentStatuses = ref([])
const employmentLoading = ref(false)
const employmentError = ref('')

const verificationTypes = ref([])
const verificationLoading = ref(false)
const verificationError = ref('')

const reasonForIssueOptions = ref([])
const reasonForIssueLoading = ref(false)
const reasonForIssueError   = ref('')

const railCardTypeOptions = ref([])
const questionAtOptions   = ref([])

async function loadLookup(typeName, target, loadingRef, errorRef) {
  loadingRef.value = true
  errorRef.value = ''
  try {
    target.value = await lookupService.listByType(typeName)
  } catch (err) {
    errorRef.value = err?.data?.detail || `Failed to load ${typeName}.`
    target.value = []
  } finally {
    loadingRef.value = false
  }
}

onMounted(() => {
  loadCaseTypes()
  loadCaseIssuers()
  loadLookup('PERSON_TITLE',              titles,               titlesLoading,         titlesError)
  loadLookup('OCCUPATION',               employmentStatuses,   employmentLoading,     employmentError)
  loadLookup('CASE_VERIFICATION_TYPE',   verificationTypes,    verificationLoading,   verificationError)
  loadLookup('CASE_REASON_FOR_ISSUE', reasonForIssueOptions, reasonForIssueLoading, reasonForIssueError)
  api.get('/revp/misc/railcards/').then(d => { railCardTypeOptions.value = d?.results || [] }).catch(() => {})
  journeyService.getQuestionAtOptions().then(d => { questionAtOptions.value = Array.isArray(d) ? d : [] }).catch(() => {})
  document.addEventListener('mousedown', onDocMousedown)
})
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown))

async function loadCaseTypes() {
  caseTypesLoading.value = true
  caseTypesError.value = ''
  try {
    caseTypes.value = await casesService.listTypes()
  } catch (err) {
    caseTypesError.value = err?.data?.detail || 'Failed to load case types.'
    caseTypes.value = []
  } finally {
    caseTypesLoading.value = false
  }
}

async function loadCaseIssuers() {
  caseIssuersLoading.value = true
  caseIssuersError.value = ''
  try {
    caseIssuers.value = await casesService.listIssuers()
  } catch (err) {
    caseIssuersError.value = err?.data?.detail || 'Failed to load case issuers.'
    caseIssuers.value = []
  } finally {
    caseIssuersLoading.value = false
  }
}

const form = reactive({
  // Basic Information
  caseTypeId: '',
  offenceDate: '',
  caseIssuerId: '',
  manualCaseRef: false,

  // Customer
  titleId: '',
  firstName: '',
  lastName: '',
  dob: '',
  age: null,
  gender: '',
  telephone: '',
  mobileTelephone: '',
  email: '',
  employmentStatusId: '',
  parentGuardian: '',

  // Address
  postcode: '',
  address1: '',
  address2: '',
  town: '',
  addressSearchReference: '',

  // Manual Verification
  verificationTypeId: '',
  verificationNotes: '',

  // Customer Signature
  customerSignature: '',

  // Offender description (the ADD DESCRIPTION modal). All fields persist on
  // form.description until the case is POSTed; they map to columns on
  // revp_customer_desc. Field names match DescriptionModal's internal descForm.
  description: {
    bodyCamera: '',            // '0' = No, '1' = Yes
    build: '',                 // PERSON_BUILD            (lookup_data_id)
    hairColour: '',            // PERSON_HAIR_COLOUR      (lookup_data_id)
    otherHairColour: '',
    hairType: '',              // PERSON_HAIR_TYPE        (lookup_data_id)
    eyeColour: '',             // PERSON_EYE_COLOUR       (lookup_data_id)
    otherEyeColour: '',
    ethnicAppearance: '',
    ethnicity: '',             // PERSON_ETHNICITY        (lookup_data_id)
    facialHairType: '',        // PERSON_FACIAL_HAIR_TYPE (lookup_data_id)
    otherFacialHairType: '',
    height: '',
    handed: '',                // PERSON_HANDEDNESS       (lookup_data_id)
    glasses: '',               // PERSON_GLASSES          (lookup_data_id)
    bracelet: false,
    necklace: false,
    watch: false,
    brooch: false,
    pin: false,
    pendant: false,
    earrings: false,
    ring: false,
    otherJewellery: false,
    jewelleryDesc: '',
    marksAndScars: '',
    tattoos: '',
    complexion: '',
    habitualDress: '',
    additionalDesc: '',
  },

  // Journey
  place: '',
  journeyFrom: '',
  journeyTo: '',
  timeDateOfTravel: '',
  trainServiceId: '',
  reasonForIssue: '',
  railCard: '',
  questionedAt: '',
  smartcardNumber: '',
  fareTravelled: 0,
  farePaid: 0,

  // Car Park / PCN fields → revp_vehicle_details
  vehicleReg:        '',
  vehicleColour:     '',
  vehicleMake:       '',   // maps to manufacturer
  vehicleModel:      '',
  carparkIssueReason: '',
  offenceFromTime:   '',
  offenceToTime:     '',
  payDisplayTicketNum:   '',
  payDisplayTicketExpiry: '',
  carparkDetails:    '',
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
  // tabs is a computed ref (JOURNEY ↔ CAR PARK swap depends on case type),
  // so we have to read .value before calling array methods on it.
  const list = tabs.value
  const idx = list.findIndex(t => t.id === activeTab.value)
  if (idx >= 0 && idx < list.length - 1) activeTab.value = list[idx + 1].id
}

// Address lookup state + handlers
const addressLookupLoading = ref(false)
const addressLookupError = ref('')
const addressLookupInfo = ref('')
const addressLookupPostcode = ref('')
// Legacy-style suggestion dropdown — populated by performAddressSearch
// when results come back, cleared by applySuggestion / outside-click /
// Escape. Empty array = dropdown hidden.
const addressSuggestions = ref([])
const addressResults = ref([])
const addressModalOpen = ref(false)

async function performAddressSearch() {
  const pc = (form.postcode || '').trim()
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
    // Legacy parity: show a click-to-apply dropdown — even when there's
    // only one match (TomTom free tier usually returns 1). The user picks
    // the suggestion to confirm; nothing on the form changes until they
    // click. This stops a postcode typo from silently mangling Address 1.
    addressSuggestions.value = results
    addressLookupPostcode.value = pc
  } catch (err) {
    addressLookupError.value = err?.data?.detail || err?.message || 'Address lookup failed.'
  } finally {
    addressLookupLoading.value = false
  }
}

function applySuggestion(a) {
  // Only overwrite form fields that the lookup actually returned —
  // preserves anything the operator already typed manually.
  if (a.line_1)   form.address1 = a.line_1
  if (a.line_2)   form.address2 = a.line_2
  if (a.town)     form.town     = a.town
  if (a.postcode) form.postcode = a.postcode
  // Confirmation banner so the operator knows what was applied.
  const where = [a.town, a.county].filter(Boolean).join(', ')
  addressLookupInfo.value = a.line_1
    ? `Filled from ${where || a.postcode}. Adjust house number if needed.`
    : `Postcode matched: ${where || a.postcode}. Please enter Address 1 and Address 2.`
  addressSuggestions.value = []
}

// Outside-click / Escape dismissal — keeps the dropdown out of the way
// when the operator decides not to use it. Listens only while the
// dropdown is visible so we don't pay the cost on every page.
function _dismissSuggestionsOnEscape(e) {
  if (e.key === 'Escape') addressSuggestions.value = []
}
function _dismissSuggestionsOnClickOutside(e) {
  // Any click that isn't inside the popover or on the postcode field
  // (or its lookup button) closes the dropdown.
  const popover = document.querySelector('.address-suggest-popover')
  const target  = e.target
  if (popover && !popover.contains(target) && !target.closest('.input-with-icon')) {
    addressSuggestions.value = []
  }
}
watch(addressSuggestions, (rows) => {
  if (rows.length) {
    document.addEventListener('keydown', _dismissSuggestionsOnEscape)
    document.addEventListener('mousedown', _dismissSuggestionsOnClickOutside)
  } else {
    document.removeEventListener('keydown', _dismissSuggestionsOnEscape)
    document.removeEventListener('mousedown', _dismissSuggestionsOnClickOutside)
  }
})

// Alias kept so the (now-unused) multi-result modal's click handler
// keeps working if it's ever surfaced again. New code should call
// applySuggestion directly.
function pickAddress(a) {
  applySuggestion(a)
  addressModalOpen.value = false
}

function closeAddressModal() {
  addressModalOpen.value = false
}

// Auto-lookup postcode as the user types — fires 500ms after typing stops,
// only when the value passes UK postcode format, and only once per distinct
// postcode (so the auto-fill that follows a successful lookup doesn't
// re-trigger an infinite loop).
const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/
let postcodeLookupTimer = null
let lastAutoLookedUp = ''

watch(() => form.reasonForIssue, (val) => {
  if (val !== 'Failed to Carry Railcard') form.railCard = ''
})

watch(() => form.postcode, (newVal) => {
  if (postcodeLookupTimer) clearTimeout(postcodeLookupTimer)
  const normalized = (newVal || '').trim().toUpperCase().replace(/\s+/g, '')
  if (!UK_POSTCODE_RE.test(normalized)) return
  if (normalized === lastAutoLookedUp) return
  postcodeLookupTimer = setTimeout(() => {
    lastAutoLookedUp = normalized
    performAddressSearch()
  }, 500)
})

const referenceModalOpen = ref(false)
const offenderSearchOpen = ref(false)

function openAddressReferenceModal() { referenceModalOpen.value = true }
function openOffenderSearchModal()   { offenderSearchOpen.value = true }

function pickOffenderMatch(m) {
  if (m.first_name) form.firstName = m.first_name
  if (m.last_name)  form.lastName  = m.last_name
  if (m.address1)   form.address1  = m.address1
  if (m.address2)   form.address2  = m.address2
  if (m.town)       form.town      = m.town
  if (m.postcode)   form.postcode  = m.postcode
  if (m.telephone)  form.telephone = m.telephone
  if (m.email)      form.email     = m.email
  if (m.customer_id) {
    savedCustomerId.value = m.customer_id
    linkedCustomerName.value = [m.first_name, m.last_name]
      .filter(Boolean).join(' ').trim() || `Customer #${m.customer_id}`
  }
}

// Visible indicator that an existing customer is attached. Empty when we're
// going to create a fresh customer on submit. Cleared by `unlinkCustomer`.
const linkedCustomerName = ref('')

function unlinkCustomer() {
  savedCustomerId.value    = null
  linkedCustomerName.value = ''
  // Don't wipe the form fields — the user might still want their values to
  // seed a new customer record. If they want a clean form they'll clear it
  // manually or use Reset (when that exists).
}

// Offender Description modal — opens from the ADD DESCRIPTION button.
const descriptionModalOpen = ref(false)

function openAddDescription() {
  descriptionModalOpen.value = true
}

function onDescriptionSave(formData) {
  // Store the confirmed description fields for submission with the case.
  // DescriptionModal discards changes on CANCEL so form.description is
  // only mutated here — no snapshot/revert logic needed.
  Object.assign(form.description, formData)
  descriptionModalOpen.value = false
}

// ── Add-Case submit ───────────────────────────────────────────────────────────
const router = useRouter()
const submitting    = ref(false)
const submitError   = ref('')
const submitSuccess = ref('')

// Cached IDs across retries — if step 1 (customer) or step 3 (journey) already
// landed on a previous submit attempt, we skip re-creating them on retry. The
// cache is cleared on success and on Clear Filters / reset; it persists for
// the lifetime of the page otherwise.
const savedCustomerId      = ref(null)
const savedJourneyId       = ref(null)
const savedDescriptionId   = ref(null)
const savedVerificationId  = ref(null)
const savedVehicleId       = ref(null)

function buildCreateCasePayload() {
  // Combine the date-only offence input with the journey time when given,
  // otherwise default to midnight on the offence date. <input type="datetime-local">
  // returns 'YYYY-MM-DDTHH:mm' (no seconds) — pad to 'YYYY-MM-DDTHH:mm:ss' so the
  // backend's stricter parsers also accept it.
  let caseDt = null
  if (form.offenceDate) {
    caseDt = `${form.offenceDate}T00:00:00`
  }

  // Manual Case Ref unchecked → send blank so the server generates a unique ref.
  // Checked but no UI input today → still send blank; service still auto-gens.
  const payload = {
    case_type_id: form.caseTypeId || '',
  }
  if (caseDt) payload.case_dt = caseDt
  if (form.caseIssuerId) payload.case_issuer = form.caseIssuerId
  return payload
}

// Strip the trailing " - CRS" suffix the Journey From/To autocomplete adds.
// Keeps the human-readable station name only — matches the legacy storage
// convention seen in revp_journey_details (e.g. "Bedford", not "BEDFORD - BDM").
function stationNameOnly(s) {
  if (!s) return ''
  return s.replace(/\s*-\s*[A-Z0-9]{2,4}\s*$/, '').trim()
}

function hasAnyCustomerData() {
  return Boolean(
    form.titleId || form.firstName || form.lastName ||
    form.email || form.telephone || form.mobileTelephone ||
    form.postcode || form.address1 || form.address2 || form.town,
  )
}

function buildCustomerPayload() {
  // titleId is a PERSON_TITLE lookup_data_id; the backend stores the title
  // text, so we dereference here before sending.
  const titleText = titles.value.find(t => t.lookup_data_id === form.titleId)?.lookup_data_value || ''
  const payload = {}
  if (titleText)            payload.title          = titleText
  if (form.firstName)       payload.first_name     = form.firstName
  if (form.lastName)        payload.surname        = form.lastName
  if (form.email)           payload.email          = form.email
  // contact_number maps to the Telephone (landline) field in Customer Details.
  // Mobile Telephone is stored separately in revp_customer_desc.mobile.
  if (form.telephone)       payload.contact_number = form.telephone
  if (form.address1)        payload.address1       = form.address1
  if (form.address2)        payload.address2       = form.address2
  if (form.town)            payload.city_town      = form.town
  if (form.postcode)        payload.post_code      = form.postcode
  return payload
}

// Customer description payload — DOB, gender, occupation, parent/guardian.
// These map to revp_customer_desc, not customer. Filled in via the same
// Customer Details tab in the form.
function hasAnyDescriptionData() {
  const d = form.description
  return Boolean(
    form.dob || form.gender || form.employmentStatusId || form.parentGuardian || form.mobileTelephone
    || d.build || d.hairColour || d.hairType || d.eyeColour || d.facialHairType
    || d.handed || d.glasses || d.height || d.complexion || d.ethnicAppearance
    || d.ethnicity || d.otherHairColour || d.otherEyeColour || d.otherFacialHairType
    || d.bracelet || d.necklace || d.watch || d.brooch || d.pin
    || d.pendant || d.earrings || d.ring || d.otherJewellery
    || d.jewelleryDesc || d.marksAndScars || d.tattoos
    || d.habitualDress || d.additionalDesc || d.bodyCamera,
  )
}

function buildDescriptionPayload() {
  // employmentStatusId is an OCCUPATION lookup_data_id; the backend stores
  // the display text, so dereference here before sending.
  const occupationText = employmentStatuses.value
    .find(o => o.lookup_data_id === form.employmentStatusId)?.lookup_data_value || ''
  const d = form.description
  const payload = {}
  // Only send DOB if it's a valid past date — protects the DB from
  // today / future / malformed values slipping through.
  const dobAge = ageFromDob(form.dob)
  const dobIsValid = form.dob && dobAge != null && dobAge >= 0
  if (dobIsValid) {
    payload.date_of_birth = form.dob
    payload.customer_age  = dobAge
  }
  if (form.gender)           payload.gender          = form.gender
  if (occupationText)        payload.occupation      = occupationText
  if (form.parentGuardian)   payload.parent_guardian = form.parentGuardian
  if (form.mobileTelephone)  payload.mobile          = form.mobileTelephone
  // Physical description fields from the Offender Description modal
  if (d.build)                 payload.build                  = d.build
  if (d.hairColour)            payload.hair_colour            = d.hairColour
  if (d.otherHairColour)       payload.other_hair_colour      = d.otherHairColour
  if (d.hairType)              payload.hair_type              = d.hairType
  if (d.eyeColour)             payload.eye_colour             = d.eyeColour
  if (d.otherEyeColour)        payload.other_eye_colour       = d.otherEyeColour
  if (d.ethnicAppearance)      payload.ethnic_appearance      = d.ethnicAppearance
  if (d.ethnicity)             payload.ethnicity              = d.ethnicity
  if (d.facialHairType)        payload.facial_hair_type       = d.facialHairType
  if (d.otherFacialHairType)   payload.other_facial_hair_type = d.otherFacialHairType
  if (d.height)                payload.height                 = d.height
  if (d.handed)                payload.handed                 = d.handed
  if (d.glasses)               payload.glasses                = d.glasses
  if (d.bodyCamera)            payload.body_camera            = d.bodyCamera
  if (d.complexion)            payload.complexion             = d.complexion
  if (d.bracelet)              payload.bracelet               = d.bracelet
  if (d.necklace)              payload.necklace               = d.necklace
  if (d.watch)                 payload.watch                  = d.watch
  if (d.brooch)                payload.brooch                 = d.brooch
  if (d.pin)                   payload.pin                    = d.pin
  if (d.pendant)               payload.pendant                = d.pendant
  if (d.earrings)              payload.earrings               = d.earrings
  if (d.ring)                  payload.ring                   = d.ring
  if (d.otherJewellery)        payload.other                  = d.otherJewellery
  if (d.jewelleryDesc)         payload.jewellery_desc         = d.jewelleryDesc
  if (d.marksAndScars)         payload.marks_and_scars        = d.marksAndScars
  if (d.tattoos)               payload.tattoos                = d.tattoos
  if (d.habitualDress)         payload.habitual_dress         = d.habitualDress
  if (d.additionalDesc)        payload.additional_desc        = d.additionalDesc
  return payload
}

function ageFromDob(iso) {
  if (!iso) return null
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  // A negative age (future DOB) is never meaningful; clamp to null.
  return age >= 0 ? age : null
}

// Yesterday in YYYY-MM-DD — used as the `max` attribute on the DOB input
// so the calendar refuses today and any future date.
const dobMaxDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

// Age is derived from DOB — shown read-only on the form, sent to the
// backend on submit. Empty string when DOB isn't a usable past date.
const computedAge = computed(() => {
  const a = ageFromDob(form.dob)
  return a == null ? '' : a
})

// Verification — Type comes from a CASE_VERIFICATION_TYPE lookup, Notes is free text.
function hasAnyVerificationData() {
  return Boolean(form.verificationTypeId || form.verificationNotes)
}

function buildVerificationPayload() {
  const typeText = verificationTypes.value
    .find(v => v.lookup_data_id === form.verificationTypeId)?.lookup_data_value || ''
  const payload = {}
  if (typeText)               payload.verification_type = typeText
  if (form.verificationNotes) payload.additional_info   = form.verificationNotes
  return payload
}

// Customer Signature → revp_case.refuse_to_sign / unable_to_sign flags.
// '1' = Refuse to sign, '2' = Unable to sign, '' = customer signed.
function signatureFlags() {
  return {
    refuse_to_sign: form.customerSignature === '1' ? 1 : 0,
    unable_to_sign: form.customerSignature === '2' ? 1 : 0,
  }
}

function hasAnyVehicleData() {
  return Boolean(
    form.vehicleReg || form.vehicleColour || form.vehicleMake || form.vehicleModel ||
    form.carparkIssueReason || form.carparkDetails ||
    form.offenceFromTime || form.offenceToTime ||
    form.payDisplayTicketNum || form.payDisplayTicketExpiry,
  )
}

function buildVehiclePayload(caseId) {
  // Legacy passes case_id to the bean but the table itself has no
  // case_id column — the linkage is via revp_case.vehicle_id. Including
  // it keeps the backend validator's `required: case_id` happy.
  const payload = { case_id: caseId }
  if (form.vehicleReg)          payload.reg_num         = form.vehicleReg
  if (form.vehicleColour)       payload.colour          = form.vehicleColour
  if (form.vehicleMake)         payload.manufacturer    = form.vehicleMake
  if (form.vehicleModel)        payload.model           = form.vehicleModel
  if (form.carparkIssueReason)  payload.issue_for_reason = form.carparkIssueReason
  if (form.carparkDetails)      payload.carpark_details = form.carparkDetails
  if (form.offenceFromTime)     payload.offence_from   = form.offenceFromTime
  if (form.offenceToTime)       payload.offence_to     = form.offenceToTime
  if (form.payDisplayTicketNum) payload.pay_display_ticket_num    = form.payDisplayTicketNum
  if (form.payDisplayTicketExpiry) payload.pay_display_ticket_expiry = form.payDisplayTicketExpiry
  return payload
}

function hasAnyJourneyData() {
  return Boolean(
    form.place || form.journeyFrom || form.journeyTo ||
    form.timeDateOfTravel || form.smartcardNumber ||
    form.trainServiceId || form.reasonForIssue || form.railCard || form.questionedAt ||
    Number(form.fareTravelled) || Number(form.farePaid),
  )
}

function buildJourneyPayload(caseId) {
  const payload = { case_id: caseId }
  if (form.place)            payload.place             = form.place
  if (form.journeyFrom)      payload.journey_from      = stationNameOnly(form.journeyFrom)
  if (form.journeyTo)        payload.journey_to        = stationNameOnly(form.journeyTo)
  if (form.smartcardNumber)  payload.smartcard_number  = form.smartcardNumber
  if (form.trainServiceId)   payload.headcode              = form.trainServiceId
  if (form.reasonForIssue)   payload.reason_for_issue      = form.reasonForIssue
  if (form.railCard)         payload.other_reason_for_issue = form.railCard
  if (form.questionedAt)     payload.questionedat_id        = Number(form.questionedAt)
  if (form.timeDateOfTravel) {
    const t = form.timeDateOfTravel.trim()
    payload.travel_dt = t.length === 16 ? `${t}:00` : t
  }
  if (Number(form.fareTravelled)) payload.fare_travelled = Number(form.fareTravelled)
  if (Number(form.farePaid))      payload.fare_paid      = Number(form.farePaid)
  return payload
}

async function addThisCase() {
  submitError.value = ''
  submitSuccess.value = ''

  // Client-side guard against obvious omissions — backend repeats the check.
  if (!form.caseTypeId) {
    submitError.value = 'Case Type is required.'
    activeTab.value = 'customer'  // pull the user back to the field
    return
  }
  if (!form.offenceDate) {
    submitError.value = 'Offence Date is required.'
    activeTab.value = 'customer'
    return
  }
  if (!form.caseIssuerId) {
    submitError.value = 'Case Issuer is required.'
    activeTab.value = 'customer'
    return
  }

  submitting.value = true
  // Pull cached IDs forward so a retry after a partial failure doesn't
  // create a second customer / journey / description / verification / vehicle row.
  let customerId     = savedCustomerId.value
  let createdCase    = null
  let journeyId      = savedJourneyId.value
  let descriptionId  = savedDescriptionId.value
  let verificationId = savedVerificationId.value
  let vehicleId      = savedVehicleId.value

  // Temp diagnostic — confirms the orchestration ran and saw the form values.
  // eslint-disable-next-line no-console
  console.debug('[add-case] submit', {
    has_customer_data: hasAnyCustomerData(),
    has_journey_data:  hasAnyJourneyData(),
    reusing_customer:  Boolean(customerId),
    reusing_journey:   Boolean(journeyId),
    customer_payload:  hasAnyCustomerData() ? buildCustomerPayload() : null,
    journey_form_snapshot: {
      place:            form.place,
      journeyFrom:      form.journeyFrom,
      journeyTo:        form.journeyTo,
      timeDateOfTravel: form.timeDateOfTravel,
      smartcardNumber:  form.smartcardNumber,
      fareTravelled:    form.fareTravelled,
      farePaid:         form.farePaid,
    },
  })
  try {
    // Step 1 — find-or-create customer. Backend matches the legacy
    // CustomerService.getCustomerID() — exact 6-field match (first_name +
    // surname + email + contact_number + post_code + toc_id) reuses the
    // existing row instead of creating a duplicate. `was_existing=true`
    // in the response tells us which path the backend took.
    let customerWasExisting = false
    if (!customerId && hasAnyCustomerData()) {
      const customer = await customersService.create(buildCustomerPayload())
      customerId = customer.customer_id
      customerWasExisting = Boolean(customer.was_existing)
      savedCustomerId.value = customerId
    }

    // Step 1b — customer description (DOB / Gender / Occupation / etc.)
    // Only attempted when we have a customer to attach it to. Skipped if
    // the form didn't fill any description-specific fields.
    if (customerId && !descriptionId && hasAnyDescriptionData()) {
      const desc = await customersService.createDescription(customerId, buildDescriptionPayload())
      descriptionId = desc.customer_desc_id
      savedDescriptionId.value = descriptionId
    }

    // Step 2 — create the case skeleton. Customer link + signature flags
    // are folded into the case row itself. For PCN cases the legacy app
    // also creates the vehicle BEFORE the case so the case row can store
    // vehicle_id. We do the same — the vehicle endpoint takes case_id but
    // doesn't actually store it; the linkage is one-way via revp_case.
    if (isPcnCase.value && !vehicleId && hasAnyVehicleData()) {
      // case_id is required by the vehicle validator; we don't have one
      // yet at this point. Pass a placeholder UUID — the field isn't
      // stored on the vehicle row, only used for the validator gate.
      const v = await vehiclesService.create(buildVehiclePayload('pending'))
      vehicleId = v.vehicle_id
      savedVehicleId.value = vehicleId
    }

    const casePayload = buildCreateCasePayload()
    if (customerId) casePayload.customer_id = customerId
    if (vehicleId)  casePayload.vehicle_id  = vehicleId
    Object.assign(casePayload, signatureFlags())
    createdCase = await casesService.create(casePayload)

    // Step 2b — claim the address search reference now that we have both
    // customer_id and case_id. The modal already allocated the slot; this
    // write atomically locks it and records the address + search rows.
    if (customerId && form.addressSearchReference) {
      await addressesService.claimReference({
        address_search_reference_id: form.addressSearchReference,
        customer_id: customerId,
        case_id:     createdCase.case_id,
        post_code:   form.postcode,
        address1:    form.address1,
        address2:    form.address2,
        town:        form.town,
        country:     form.country,
        first_name:  form.firstName,
        last_name:   form.lastName,
        phone:       form.telephone,
      })
    }

    // Step 3 — create the journey, FK back to the case (non-PCN cases only).
    if (!isPcnCase.value && !journeyId && hasAnyJourneyData()) {
      const journey = await journeyService.create(buildJourneyPayload(createdCase.case_id))
      journeyId = journey.journey_id
      savedJourneyId.value = journeyId
    }

    // Step 3b — verification (revp_case_verification) hangs off the case.
    if (!verificationId && hasAnyVerificationData()) {
      const v = await casesService.createVerification(createdCase.case_id, buildVerificationPayload())
      verificationId = v.verification_id
      savedVerificationId.value = verificationId
    }

    // Step 3c — queued notes. Each entry has a `note` text field;
    // anything with a non-local id has already been saved on a prior attempt
    // so we skip it to keep the chain idempotent under retry.
    for (const n of notes.value) {
      if (typeof n.id === 'string' && n.id.startsWith('local-')) {
        const created = await casesService.createNote(createdCase.case_id, n.note)
        n.id = created.note_id   // mark as persisted; safe on retry
      }
    }

    // Step 3d — queued attachments. Same idempotency trick: anything whose
    // local id was replaced with the backend's attachment_id on a previous
    // attempt is skipped on this one.
    for (const a of attachments.value) {
      if (typeof a.id === 'string' && a.id.startsWith('local-') && a.file) {
        const created = await casesService.uploadAttachment(createdCase.case_id, a.file)
        a.id = created.attachment_id
        a.file = null   // free the File reference once it's persisted
      }
    }

    // Step 4 — if a journey was created, PUT the case to back-fill journey_id
    // so the case-detail page can find it without a reverse-FK lookup.
    if (journeyId) {
      await casesService.update(createdCase.case_id, { journey_id: journeyId })
    }

    // Full success — clear the cache so the next case starts fresh.
    savedCustomerId.value     = null
    savedJourneyId.value      = null
    savedDescriptionId.value  = null
    savedVerificationId.value = null
    savedVehicleId.value      = null

    // Spell out what was actually saved so a partially-populated form
    // can't silently look like a full save. Distinguish between "customer
    // was reused" (matched legacy by the 6-field rule, or picked from the
    // address-search modal) and "new customer created" so the operator
    // can see at a glance which path ran.
    const savedBits = ['case']
    if (customerId) {
      savedBits.push(customerWasExisting ? 'reused existing customer' : 'new customer')
    }
    if (descriptionId)         savedBits.push('description')
    if (journeyId)             savedBits.push('journey')
    if (vehicleId)             savedBits.push('vehicle')
    if (verificationId)        savedBits.push('verification')
    if (notes.value.length)    savedBits.push(`${notes.value.length} note(s)`)
    if (attachments.value.length) savedBits.push(`${attachments.value.length} attachment(s)`)
    submitSuccess.value =
      `Case ${createdCase.case_num} created with ${savedBits.join(' + ')}. Opening case details…`
    setTimeout(
      () => router.push({ name: 'case-details', params: { caseid: createdCase.case_id } }),
      900,
    )
  } catch (err) {
    // Surface the first server-side error if there is one, else a generic msg.
    const data = err?.data
    let detail = ''
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const firstVal = data[firstKey]
      const msg = Array.isArray(firstVal) ? firstVal[0] : firstVal
      detail = `${firstKey}: ${msg}`
    } else {
      detail = err?.message || 'Failed to create case.'
    }
    // Tell the user what *did* land so they know where the chain broke.
    // The cached IDs let Retry pick up where the chain stopped without
    // duplicating customer / journey rows.
    let context = ''
    if (createdCase) {
      context = ` (case ${createdCase.case_num} was saved — the journey step failed; you can edit the case to add journey details)`
    } else if (customerId) {
      context = ` (customer was saved — Retry will reuse it, not duplicate it)`
    }
    submitError.value = `${detail}${context}`
  } finally {
    submitting.value = false
  }
}
// ── Notes (queued locally until the case is created) ───────────────────────────
// Each entry: { id, datetime, author, note }. On submit, addThisCase loops
// through pendingNotes and POSTs each one to /api/revp/cases/<id>/notes/.
const noteModalOpen = ref(false)
const noteText      = ref('')
const noteError     = ref('')

function addNote() {
  noteText.value = ''
  noteError.value = ''
  noteModalOpen.value = true
}

function saveQueuedNote() {
  const text = (noteText.value || '').trim()
  if (!text) {
    noteError.value = 'Note text is required.'
    return
  }
  notes.value.push({
    id:       `local-${Date.now()}`,
    datetime: new Date().toLocaleString(),
    author:   '(you)',
    note:     text,
  })
  noteModalOpen.value = false
}

function removeQueuedNote(id) {
  const idx = notes.value.findIndex(n => n.id === id)
  if (idx !== -1) notes.value.splice(idx, 1)
}

// ── Attachments (queued File objects until the case is created) ────────────────
// Each entry: { id, datetime, uploader, filename, size, file }. `file` is
// the real File reference used by addThisCase when it uploads to the new case.
const fileInputRef = ref(null)

function addAttach() {
  // Trigger the hidden <input type="file"> click.
  fileInputRef.value?.click()
}

function onAttachmentChosen(event) {
  const fileList = event.target.files
  if (!fileList || fileList.length === 0) return
  for (const file of fileList) {
    attachments.value.push({
      id:       `local-${Date.now()}-${file.name}`,
      datetime: new Date().toLocaleString(),
      uploader: '(you)',
      filename: file.name,
      size:     `${Math.max(1, Math.round(file.size / 1024))} KB`,
      file,
    })
  }
  // Reset so the same file can be re-picked if the user changes their mind.
  event.target.value = ''
}

function openAttach() {
  // Pre-save the file isn't persisted yet — there's nothing to download.
  // Show a brief info message via the submitError banner so the operator
  // knows why "open" doesn't do anything until after the case is saved.
  submitError.value = 'Attachments can be opened after the case is saved.'
  setTimeout(() => { if (submitError.value.startsWith('Attachments can')) submitError.value = '' }, 3000)
}

function deleteAttach() {
  // Remove every selected attachment from the local queue.
  for (const id of selectedAttachments.value) {
    const idx = attachments.value.findIndex(a => a.id === id)
    if (idx !== -1) attachments.value.splice(idx, 1)
  }
  selectedAttachments.value = []
}
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
  width: 22px; height: 22px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.help-icon:hover:not(:disabled) { background: var(--primary-hover); }
.help-icon:disabled { opacity: 0.5; cursor: wait; }

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
.btn-add-case:hover:not(:disabled) { background: #128968; }
.btn-add-case:disabled { opacity: 0.5; cursor: not-allowed; }

/* Submit feedback banners shown above the ADD THIS CASE button. */
.submit-banner {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
}
.submit-banner-error   { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.submit-banner-success { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
.linked-customer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 13px;
  color: #1d4ed8;
}
.link-unlink-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #1d4ed8;
  border-radius: 4px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.link-unlink-btn:hover { background: #dbeafe; }

/* Wrapper for input + inline error inside the 2-col form grid.
   Without this, the error <span> would become a third grid child and shift
   every subsequent label/input out of alignment. */
.field-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.field-cell > select,
.field-cell > input { width: 100%; }

/* Case Issuer autocomplete */
.autocomplete { position: relative; }
.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0; right: 0;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-height: 240px;
  overflow-y: auto;
  z-index: 50;
  padding: 4px;
}
.autocomplete-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  text-align: left;
  color: var(--text-default);
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  cursor: pointer;
}
.autocomplete-item:hover,
.autocomplete-item.active {
  background: var(--bg-hover);
  color: var(--text-strong);
}
.autocomplete-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-light);
}

.form-info {
  font-size: 11px;
  color: #15a982;
  margin-top: 2px;
}

/* Address picker modal */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.modal-panel {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  width: 100%; max-width: 520px;
  max-height: 80vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 15px; font-weight: 600;
  color: var(--text-strong);
}
.modal-close {
  width: 28px; height: 28px;
  border: none; background: none;
  font-size: 22px; line-height: 1;
  color: var(--text-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-strong); }
.modal-body {
  padding: 14px 18px;
  overflow-y: auto;
}
.modal-sub {
  font-size: 12px; color: var(--text-light);
  margin-bottom: 10px;
}
.addr-list { list-style: none; padding: 0; margin: 0; }
.addr-list li + li { margin-top: 4px; }
.addr-item {
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text-default);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition);
}
.addr-item:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--text-strong);
}

/* Wide modal + footer for the legacy-style search dialogs */
.modal-panel-wide {
  max-width: 1100px;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  background: #fafbfc;
}

/* Offender Description modal layout */
.desc-modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media (max-width: 900px) {
  .desc-modal-body { grid-template-columns: 1fr; }
}
.desc-col { display: flex; flex-direction: column; gap: 10px; }
.desc-row {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 12px;
  align-items: center;
}
.desc-row-textarea { align-items: start; }
.desc-row-textarea .desc-label { padding-top: 8px; }
.desc-label {
  font-size: 13px;
  color: var(--text-default);
  font-weight: 500;
}
.desc-row select,
.desc-row input[type="text"],
.desc-row textarea { width: 100%; }
.desc-row input[type="checkbox"] {
  width: 16px; height: 16px;
  justify-self: start;
}

/* Offender search modal layout */
.offender-search-body {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
}
@media (max-width: 900px) {
  .offender-search-body { grid-template-columns: 1fr; }
}
.offender-search-left { display: flex; flex-direction: column; gap: 12px; }
.offender-search-right { display: flex; flex-direction: column; gap: 12px; }
.search-btn { align-self: flex-start; }

.result-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
}
.result-panel-title {
  padding: 8px 12px;
  font-size: 12px; font-weight: 700;
  color: var(--text-strong);
  background: var(--bg-page);
  border-bottom: 1px solid var(--border);
}
.result-table table { width: 100%; border-collapse: collapse; }
.result-table th, .result-table td {
  padding: 7px 10px;
  font-size: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.result-table th { background: #f3f4f6; color: var(--text-muted); font-weight: 600; }
.result-table tbody tr { cursor: pointer; }
.result-table tbody tr:hover { background: var(--primary-light); }
.result-empty { color: var(--text-light); font-style: italic; cursor: default; text-align: center; }
.result-empty:hover { background: none; }

/* Saved address reference pill */
.ref-pill {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 10px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 999px;
  font-size: 12px;
}
.ref-clear {
  width: 18px; height: 18px;
  border: none;
  background: none;
  color: var(--primary);
  font-size: 14px; line-height: 1;
  cursor: pointer;
}
.ref-clear:hover { color: var(--danger); }

@media (max-width: 720px) {
  .form-row-left { grid-template-columns: 1fr; }
  .form-label-left { margin-bottom: -6px; }
}

/* Click-to-apply postcode suggestion dropdown.
   Anchored to the relative-positioned .field-cell wrapper around the
   postcode input — sits flush under the input with a border and shadow
   so it reads as a popover, not part of the form layout. */
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
</style>
