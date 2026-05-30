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
            <div>
              <input id="newAppealEmail" type="email" v-model.trim="form.newAppealNotificationEmail" @input="touched.email = true" />
              <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
            </div>
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
        <button type="submit" class="btn btn-success" :disabled="saving">{{ saving ? 'Saving…' : 'SAVE' }}</button>
      </div>
    </form>
  </AppLayout>
</template>

<script setup>
import { reactive, ref, onMounted, watchEffect } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { apiGet, apiPut } from '@/services/api.js'
import { swal } from '@/utils/swal.js'

const form = reactive({
  parkingChargeNoticeDiscounted: '',
  parkingChargeNotice: '',
  noteToOwner: '',
  chargeCertificate: '',
  discountedPeriodDays: '',
  pcnAppealDeadlineDays: '',
  pfAppealDeadlineDays: '',
  ufnAppealDeadlineDays: '',
  newAppealNotificationEmail: '',
  pfnTotalPenalty: '',
  discountPercent: '',
  pfnDiscountedDays: '',
  pfNewCalculationStartDate: '',
  additionalDiscountAndLetterDaysOnAppeal: '',
})

const errors = reactive({})
const touched = reactive({})
const saving = ref(false)

onMounted(async () => {
  const data = await apiGet('/revp/misc/charges-appeals/')
  form.parkingChargeNoticeDiscounted = norm(data.parkingcharge_discount ?? '')
  form.parkingChargeNotice           = norm(data.parkingcharge ?? '')
  form.noteToOwner                   = norm(data.noteto_owner ?? '')
  form.chargeCertificate             = norm(data.charge_certificate ?? '')
  form.discountedPeriodDays          = data.discount_period ?? ''
  form.pcnAppealDeadlineDays         = data.pcn_deadline ?? ''
  form.pfAppealDeadlineDays          = data.pf_deadline ?? ''
  form.ufnAppealDeadlineDays         = data.ufn_deadline ?? ''
  form.newAppealNotificationEmail    = data.newAppealNotifications ?? ''
  form.pfnTotalPenalty               = norm(data.pfn_total_penalty ?? '')
  form.discountPercent               = norm(data.pfn_discount_percentage ?? '')
  form.pfnDiscountedDays             = data.pfn_discounted_days ?? ''
  form.pfNewCalculationStartDate     = data.PFNewCalculationStartDate ?? ''
  form.additionalDiscountAndLetterDaysOnAppeal = data.additionalDiscountAndLetterDaysonAppeal ?? ''
})

// Real-time email validation
watchEffect(() => {
  if (touched.email) {
    if (form.newAppealNotificationEmail && !/^.+@.+\..+$/.test(form.newAppealNotificationEmail))
      errors.email = 'Please enter a valid email'
    else delete errors.email
  } else delete errors.email
}, { flush: 'sync' })

function norm(v) {
  v = String(v ?? '').trim()
  if (!v) return ''
  if (v.indexOf('.') === -1) return v + '.00'
  const [w, f] = v.split('.')
  if (f.length === 1) return `${w}.${f}0`
  if (f.length > 2) return parseFloat(v).toFixed(2)
  return v
}

async function save() {
  touched.email = true
  if (errors.email) return

  const payload = Object.fromEntries(
    Object.entries({
      parkingcharge_discount:                  form.parkingChargeNoticeDiscounted,
      parkingcharge:                           form.parkingChargeNotice,
      noteto_owner:                            form.noteToOwner,
      charge_certificate:                      form.chargeCertificate,
      discount_period:                         String(form.discountedPeriodDays ?? ''),
      pcn_deadline:                            String(form.pcnAppealDeadlineDays ?? ''),
      pf_deadline:                             String(form.pfAppealDeadlineDays ?? ''),
      ufn_deadline:                            String(form.ufnAppealDeadlineDays ?? ''),
      newAppealNotifications:                  form.newAppealNotificationEmail,
      pfn_total_penalty:                       form.pfnTotalPenalty,
      pfn_discount_percentage:                 form.discountPercent,
      pfn_discounted_days:                     String(form.pfnDiscountedDays ?? ''),
      PFNewCalculationStartDate:               form.pfNewCalculationStartDate,
      additionalDiscountAndLetterDaysonAppeal: String(form.additionalDiscountAndLetterDaysOnAppeal ?? ''),
    }).filter(([, v]) => v !== '' && v !== 'undefined' && v !== 'null')
  )

  if (Object.keys(payload).length === 0) {
    await swal.success('Charges & Appeals saved successfully')
    return
  }

  saving.value = true
  try {
    await apiPut('/revp/misc/charges-appeals/', payload)
    await swal.success('Charges & Appeals saved successfully')
  } finally {
    saving.value = false
  }
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
</style>
