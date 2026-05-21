<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Charges &amp; Appeals</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Charges and Appeals</span>
      </div>
    </div>

    <form class="config-form" @submit.prevent="save" novalidate>
      <div class="grid-2">
        <!-- Parking Charges -->
        <fieldset class="config-section">
          <legend class="config-legend">Parking Charges</legend>

          <div class="config-row">
            <label class="config-label" for="pcnDiscounted">Parking Charge Notice (Discounted)</label>
            <div class="input-prefix">
              <span class="prefix">£</span>
              <input id="pcnDiscounted" v-model.trim="form.parkingChargeNoticeDiscounted" @blur="form.parkingChargeNoticeDiscounted = norm(form.parkingChargeNoticeDiscounted)" />
            </div>
          </div>

          <div class="config-row">
            <label class="config-label" for="pcn">Parking Charge Notice</label>
            <div class="input-prefix">
              <span class="prefix">£</span>
              <input id="pcn" v-model.trim="form.parkingChargeNotice" @blur="form.parkingChargeNotice = norm(form.parkingChargeNotice)" />
            </div>
          </div>

          <div class="config-row">
            <label class="config-label" for="noteOwner">Note to Owner</label>
            <div class="input-prefix">
              <span class="prefix">£</span>
              <input id="noteOwner" v-model.trim="form.noteToOwner" @blur="form.noteToOwner = norm(form.noteToOwner)" />
            </div>
          </div>

          <div class="config-row">
            <label class="config-label" for="chargeCert">Charge Certificate</label>
            <div class="input-prefix">
              <span class="prefix">£</span>
              <input id="chargeCert" v-model.trim="form.chargeCertificate" @blur="form.chargeCertificate = norm(form.chargeCertificate)" />
            </div>
          </div>

          <div class="config-row">
            <label class="config-label" for="discountedDays">Discounted Period (Days)</label>
            <input id="discountedDays" type="number" min="0" v-model.number="form.discountedPeriodDays" />
          </div>
        </fieldset>

        <!-- Appeals -->
        <fieldset class="config-section">
          <legend class="config-legend">Appeals</legend>

          <div class="config-row">
            <label class="config-label" for="pcnDeadline">PCN Appeal Deadline (Days)</label>
            <input id="pcnDeadline" type="number" min="0" v-model.number="form.pcnAppealDeadlineDays" />
          </div>

          <div class="config-row">
            <label class="config-label" for="pfDeadline">PF Appeal Deadline (Days)</label>
            <input id="pfDeadline" type="number" min="0" v-model.number="form.pfAppealDeadlineDays" />
          </div>

          <div class="config-row">
            <label class="config-label" for="ufnDeadline">UFN Appeal Deadline (Days)</label>
            <input id="ufnDeadline" type="number" min="0" v-model.number="form.ufnAppealDeadlineDays" />
          </div>

          <div class="config-row">
            <label class="config-label" for="newAppealEmail">New Appeal Notifications</label>
            <input id="newAppealEmail" type="email" v-model.trim="form.newAppealNotificationEmail" />
            <span v-if="errors.newAppealNotificationEmail" class="form-error">{{ errors.newAppealNotificationEmail }}</span>
          </div>
        </fieldset>
      </div>

      <!-- PFN Charges Information -->
      <fieldset class="config-section pfn-section">
        <legend class="config-legend">PFN Charges Information</legend>
        <div class="grid-2">
          <div>
            <div class="config-row">
              <label class="config-label" for="pfnTotalPenalty">PFN Total Penalty</label>
              <div class="input-prefix">
                <span class="prefix">£</span>
                <input id="pfnTotalPenalty" v-model.trim="form.pfnTotalPenalty" @blur="form.pfnTotalPenalty = norm(form.pfnTotalPenalty)" />
              </div>
            </div>

            <div class="config-row">
              <label class="config-label" for="discountPct">Discount Percent</label>
              <div class="input-suffix">
                <input id="discountPct" v-model.trim="form.discountPercent" @blur="form.discountPercent = norm(form.discountPercent)" />
                <span class="suffix">%</span>
              </div>
            </div>

            <div class="config-row">
              <label class="config-label" for="pfnDiscountedDays">PFN Discounted Days</label>
              <input id="pfnDiscountedDays" type="number" min="0" v-model.number="form.pfnDiscountedDays" />
            </div>

            <div class="config-row">
              <label class="config-label" for="pfStartDate">PF New Calculation Start Days</label>
              <input id="pfStartDate" type="date" v-model="form.pfNewCalculationStartDate" />
            </div>

            <div class="config-row">
              <label class="config-label" for="addDiscountDays">Additional Discount And Letter Days on Appeal</label>
              <input id="addDiscountDays" type="number" min="0" v-model.number="form.additionalDiscountAndLetterDaysOnAppeal" />
            </div>
          </div>
        </div>
      </fieldset>

      <div class="config-footer">
        <p v-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
        <button type="submit" class="btn btn-success">SAVE</button>
      </div>
    </form>
  </AppLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const form = reactive({
  parkingChargeNoticeDiscounted: '35.00',
  parkingChargeNotice: '70.00',
  noteToOwner: '',
  chargeCertificate: '25.00',
  discountedPeriodDays: 14,

  pcnAppealDeadlineDays: 14,
  pfAppealDeadlineDays: 4,
  ufnAppealDeadlineDays: 25,
  newAppealNotificationEmail: 'shashank@divyaltech.com',

  pfnTotalPenalty: '100.00',
  discountPercent: '50.00',
  pfnDiscountedDays: 4,
  pfNewCalculationStartDate: '2022-11-29',
  additionalDiscountAndLetterDaysOnAppeal: 2
})

const errors = reactive({})
const savedMessage = ref('')

function norm(v){
  v = String(v ?? '').trim()
  if(!v) return ''
  if(v.indexOf('.') === -1) return v + '.00'
  const [w,f] = v.split('.')
  if(f.length === 1) return `${w}.${f}0`
  if(f.length > 2) return parseFloat(v).toFixed(2)
  return v
}

function validate(){
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if(form.newAppealNotificationEmail && !/^.+@.+\..+$/.test(form.newAppealNotificationEmail)){
    errors.newAppealNotificationEmail = 'Please enter a valid email'
    ok = false
  }
  return ok
}

function save(){
  savedMessage.value = ''
  if(!validate()) return
  savedMessage.value = 'Saved'
  setTimeout(() => { savedMessage.value = '' }, 2500)
}
</script>

<style scoped>
.config-form { display: flex; flex-direction: column; gap: 16px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

.config-section {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  margin: 0;
}
.config-legend {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-default);
  padding: 0 6px;
  margin-left: -6px;
}
.pfn-section :deep(.grid-2) > div { display: flex; flex-direction: column; }

.config-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 1.2fr);
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.config-label { font-size: 13px; color: var(--text-default); }

.input-prefix, .input-suffix { display: flex; align-items: stretch; }
.input-prefix .prefix, .input-suffix .suffix {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 10px; min-width: 36px;
  background: #e9ecef; color: #555;
  border: 1px solid var(--border);
  font-size: 13px;
}
.input-prefix .prefix { border-right: none; border-top-left-radius: var(--radius); border-bottom-left-radius: var(--radius); }
.input-suffix .suffix { border-left: none; border-top-right-radius: var(--radius); border-bottom-right-radius: var(--radius); }
.input-prefix input { border-top-left-radius: 0; border-bottom-left-radius: 0; flex: 1; }
.input-suffix input { border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1; }

.config-footer {
  display: flex; justify-content: flex-end; align-items: center; gap: 12px;
  padding-top: 4px;
}
.saved-message { color: var(--success, #2e7d32); font-size: 13px; }
</style>
