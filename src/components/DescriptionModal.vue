<template>
  <div v-if="modelValue" class="modal-backdrop">
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="desc-modal-title"
         style="max-width:780px;width:96%;">
      <div class="modal-head">
        <h2 id="desc-modal-title" class="modal-title">Physical Description</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="handleCancel">×</button>
      </div>

      <div style="padding:16px 20px;max-height:70vh;overflow-y:auto;">
        <p v-if="displayError" style="color:#b91c1c;font-size:12px;margin-bottom:12px;">{{ displayError }}</p>
        <div v-if="isReadOnly && !hasAnyValue" class="tab-hint tab-hint-info" style="margin-bottom:0;">
          No physical description has been recorded for this customer yet.
        </div>

        <!-- Outer fieldset[disabled] locks every descendant control in read-only mode -->
        <fieldset :disabled="isReadOnly" style="border:none;padding:0;margin:0;">

          <!-- Appearance -->
          <fieldset class="legend-group" style="margin-bottom:12px;">
            <legend>Appearance</legend>
            <div class="form-row-left" style="grid-template-columns:140px 1fr 140px 1fr;gap:6px 12px;">
              <label class="form-label-left">Build</label>
              <select v-model="descForm.build" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.build" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Height</label>
              <input v-model="descForm.height" maxlength="100" placeholder="e.g. 5ft 10in" class="field-editable" />

              <label class="form-label-left">Hair Colour</label>
              <select v-model="descForm.hairColour" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.hairColour" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Other Hair Colour</label>
              <input v-model="descForm.otherHairColour" maxlength="100" class="field-editable" />

              <label class="form-label-left">Hair Type</label>
              <select v-model="descForm.hairType" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.hairType" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Eye Colour</label>
              <select v-model="descForm.eyeColour" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.eyeColour" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Other Eye Colour</label>
              <input v-model="descForm.otherEyeColour" maxlength="100" class="field-editable" />

              <label class="form-label-left">Ethnic Appearance</label>
              <input v-model="descForm.ethnicAppearance" maxlength="50" class="field-editable" />

              <label class="form-label-left">Ethnicity</label>
              <select v-model="descForm.ethnicity" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.ethnicity" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Facial Hair</label>
              <select v-model="descForm.facialHairType" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.facialHairType" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Other Facial Hair</label>
              <input v-model="descForm.otherFacialHairType" maxlength="100" class="field-editable" />

              <label class="form-label-left">Handed</label>
              <select v-model="descForm.handed" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.handedness" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Glasses</label>
              <select v-model="descForm.glasses" class="field-editable">
                <option value="">Select</option>
                <option v-for="o in descLookups.glasses" :key="o.lookup_data_id" :value="o.lookup_data_id">{{ o.lookup_data_value }}</option>
              </select>

              <label class="form-label-left">Body Camera</label>
              <select v-model="descForm.bodyCamera" class="field-editable">
                <option value="">Select</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>

              <label class="form-label-left">Complexion</label>
              <input v-model="descForm.complexion" maxlength="100" class="field-editable" />
            </div>
          </fieldset>

          <!-- Jewellery -->
          <fieldset class="legend-group" style="margin-bottom:12px;">
            <legend>Jewellery</legend>
            <div style="display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:8px;">
              <label v-for="item in JEWELLERY_ITEMS" :key="item[0]"
                     style="display:flex;align-items:center;gap:4px;font-size:13px;">
                <input type="checkbox" v-model="descForm[item[0]]" /> {{ item[1] }}
              </label>
            </div>
            <label class="form-label-left" style="font-size:13px;">Jewellery Description</label>
            <input v-model="descForm.jewelleryDesc" maxlength="2000" class="field-editable" style="width:100%;" />
          </fieldset>

          <!-- Other -->
          <fieldset class="legend-group">
            <legend>Other</legend>
            <div class="form-row-left" style="grid-template-columns:140px 1fr;gap:6px 12px;">
              <label class="form-label-left">Marks &amp; Scars</label>
              <input v-model="descForm.marksAndScars" maxlength="2000" class="field-editable" />

              <label class="form-label-left">Tattoos</label>
              <input v-model="descForm.tattoos" maxlength="250" class="field-editable" />

              <label class="form-label-left">Habitual Dress</label>
              <input v-model="descForm.habitualDress" maxlength="50" class="field-editable" />

              <label class="form-label-left">Additional Description</label>
              <textarea v-model="descForm.additionalDesc" maxlength="5000" rows="3"
                        style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;"></textarea>
            </div>
          </fieldset>

        </fieldset>
      </div>

      <div style="padding:12px 20px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e5e7eb;">
        <template v-if="!isReadOnly">
          <button type="button" class="btn-action-red"   @click="handleCancel" :disabled="busy">CANCEL</button>
          <button type="button" class="btn-action-green" @click="handleSave"   :disabled="busy">
            {{ busy ? 'SAVING…' : 'SAVE' }}
          </button>
        </template>
        <button v-else type="button" class="btn-action-light" @click="handleCancel">CLOSE</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { lookupService } from '@/services/lookup.service.js'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  isReadOnly:      { type: Boolean, default: false },
  // Pre-populate form on open. Uses component field names (see _EMPTY_FORM).
  // CaseDetailsView must convert the API response to this format before passing.
  descriptionData: { type: Object,  default: null  },
  busy:            { type: Boolean, default: false },
  // External save error — shown alongside internal validation errors.
  error:           { type: String,  default: ''    },
})
const emit = defineEmits(['update:modelValue', 'save'])

const JEWELLERY_ITEMS = [
  ['bracelet', 'Bracelet'], ['necklace', 'Necklace'], ['watch', 'Watch'],
  ['brooch',   'Brooch'],   ['pin',      'Pin'],      ['pendant',  'Pendant'],
  ['earrings', 'Earrings'], ['ring',     'Ring'],     ['otherJewellery', 'Other'],
]

const _EMPTY_FORM = {
  build: '', hairColour: '', otherHairColour: '',
  hairType: '', eyeColour: '', otherEyeColour: '',
  ethnicAppearance: '', ethnicity: '',
  facialHairType: '', otherFacialHairType: '',
  height: '', handed: '', glasses: '', bodyCamera: '', complexion: '',
  bracelet: false, brooch: false, necklace: false, watch: false,
  pin: false, pendant: false, earrings: false, ring: false, otherJewellery: false,
  jewelleryDesc: '', marksAndScars: '', tattoos: '', habitualDress: '', additionalDesc: '',
}

const descForm      = reactive({ ..._EMPTY_FORM })
const descLookups   = reactive({ build: [], hairColour: [], hairType: [], eyeColour: [], ethnicity: [], facialHairType: [], handedness: [], glasses: [] })
const internalError = ref('')
let _lookupsLoaded  = false

const displayError = computed(() => internalError.value || props.error || '')
const hasAnyValue  = computed(() =>
  Object.values(descForm).some(v => v !== '' && v !== false && v !== null)
)

function _resetForm() { Object.assign(descForm, _EMPTY_FORM) }

function _populateForm(d) {
  if (!d) return
  Object.assign(descForm, {
    build:               d.build               || '',
    hairColour:          d.hairColour          || '',
    otherHairColour:     d.otherHairColour     || '',
    hairType:            d.hairType            || '',
    eyeColour:           d.eyeColour           || '',
    otherEyeColour:      d.otherEyeColour      || '',
    ethnicAppearance:    d.ethnicAppearance    || '',
    ethnicity:           d.ethnicity           || '',
    facialHairType:      d.facialHairType      || '',
    otherFacialHairType: d.otherFacialHairType || '',
    height:              d.height              || '',
    handed:              d.handed              || '',
    glasses:             d.glasses             || '',
    bodyCamera:          d.bodyCamera          || '',
    complexion:          d.complexion          || '',
    bracelet:       Boolean(d.bracelet),
    brooch:         Boolean(d.brooch),
    necklace:       Boolean(d.necklace),
    watch:          Boolean(d.watch),
    pin:            Boolean(d.pin),
    pendant:        Boolean(d.pendant),
    earrings:       Boolean(d.earrings),
    ring:           Boolean(d.ring),
    otherJewellery: Boolean(d.otherJewellery),
    jewelleryDesc:  d.jewelleryDesc  || '',
    marksAndScars:  d.marksAndScars  || '',
    tattoos:        d.tattoos        || '',
    habitualDress:  d.habitualDress  || '',
    additionalDesc: d.additionalDesc || '',
  })
}

async function _loadLookups() {
  if (_lookupsLoaded) return
  const [build, hairC, hairT, eyeC, eth, facial, hand, gl] = await Promise.allSettled([
    lookupService.listByType('PERSON_BUILD'),
    lookupService.listByType('PERSON_HAIR_COLOUR'),
    lookupService.listByType('PERSON_HAIR_TYPE'),
    lookupService.listByType('PERSON_EYE_COLOUR'),
    lookupService.listByType('PERSON_ETHNICITY'),
    lookupService.listByType('PERSON_FACIAL_HAIR_TYPE'),
    lookupService.listByType('PERSON_HANDEDNESS'),
    lookupService.listByType('PERSON_GLASSES'),
  ])
  const _r = r => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [])
  descLookups.build          = _r(build)
  descLookups.hairColour     = _r(hairC)
  descLookups.hairType       = _r(hairT)
  descLookups.eyeColour      = _r(eyeC)
  descLookups.ethnicity      = _r(eth)
  descLookups.facialHairType = _r(facial)
  descLookups.handedness     = _r(hand)
  descLookups.glasses        = _r(gl)
  _lookupsLoaded = true
}

watch(() => props.modelValue, open => {
  if (open) {
    internalError.value = ''
    _resetForm()
    _populateForm(props.descriptionData)
    _loadLookups()
  }
})

function handleCancel() { emit('update:modelValue', false) }

function handleSave() {
  if (!hasAnyValue.value) {
    internalError.value = 'Enter at least one field.'
    return
  }
  internalError.value = ''
  emit('save', { ...descForm })
}
</script>

<style scoped>
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

.tab-hint {
  margin: 0 0 14px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid transparent;
}
.tab-hint-info { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

.legend-group {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: var(--radius, 6px);
  padding: 14px 16px 16px;
}
.legend-group legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong, #111827);
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
  color: var(--text-default, #374151);
  font-weight: 500;
}

.field-editable {
  background: #fff;
  color: var(--text-strong, #111827);
  border: 1px solid var(--primary, #5b8def);
  border-radius: var(--radius-sm, 4px);
  padding: 6px 10px;
  font-size: 12px;
  width: 100%;
}
.field-editable:focus {
  outline: none;
  border-color: var(--primary, #5b8def);
  box-shadow: 0 0 0 2px rgba(91, 141, 239, 0.18);
}

.btn-action-light {
  padding: 7px 14px;
  background: #d1ede0;
  color: #15a982;
  border-radius: var(--radius-sm, 4px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.15s ease;
}
.btn-action-light:hover:not(:disabled) { background: #15a982; color: #fff; }
.btn-action-light:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-action-green {
  padding: 7px 14px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm, 4px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background 0.15s ease;
}
.btn-action-green:hover { background: #128968; }

.btn-action-red {
  padding: 7px 14px;
  background: #fee2e2;
  color: var(--danger, #dc2626);
  border-radius: var(--radius-sm, 4px);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.15s ease;
}
.btn-action-red:hover:not(:disabled) { background: var(--danger, #dc2626); color: #fff; }
.btn-action-red:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
