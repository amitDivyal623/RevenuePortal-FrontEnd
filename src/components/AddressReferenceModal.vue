<script setup>
import { ref, watch } from 'vue'
import { addressesService } from '@/services/addresses.service.js'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  // Edit mode: supply customerId to look up / claim against an existing customer.
  // Add mode:  omit customerId; the parent claims the reference on final submit.
  customerId:  { type: String,  default: '' },
  caseId:      { type: String,  default: '' },
  // Address fields passed in so the claim can write revp_address in one shot.
  postCode:    { type: String,  default: '' },
  address1:    { type: String,  default: '' },
  address2:    { type: String,  default: '' },
  town:        { type: String,  default: '' },
  country:     { type: String,  default: '' },
  firstName:   { type: String,  default: '' },
  lastName:    { type: String,  default: '' },
  phone:       { type: String,  default: '' },
})

const emit = defineEmits(['update:modelValue', 'save'])

// ── state ─────────────────────────────────────────────────────────────────────
const loading    = ref(false)
const saving     = ref(false)
const error      = ref('')
const referenceId = ref('')
// true when the customer already has a claimed reference (show read-only)
const isReadOnly = ref(false)

// ── open / close ───────────────────────────────────────────────────────────────
watch(() => props.modelValue, async (open) => {
  if (!open) return
  error.value      = ''
  referenceId.value = ''
  isReadOnly.value  = false
  loading.value     = true

  try {
    if (props.customerId) {
      // Edit mode — check for an existing reference first.
      try {
        const existing = await addressesService.getCustomerReference(props.customerId)
        referenceId.value = existing.address_search_reference_id
        isReadOnly.value  = true
        return
      } catch (e) {
        if (e?.status !== 404 && e?.response?.status !== 404) throw e
        // 404 = no existing reference → fall through to allocate
      }
    }
    // Add mode, or edit mode with no prior reference → allocate a free slot.
    const slot = await addressesService.allocateReference()
    referenceId.value = slot.address_search_reference_id
  } catch (e) {
    error.value = e?.data?.detail || e?.response?.data?.detail || e?.message || 'Could not load address reference.'
  } finally {
    loading.value = false
  }
})

function close() { emit('update:modelValue', false) }

async function save() {
  if (isReadOnly.value) {
    // Nothing to write — just surface the existing reference to the parent.
    emit('save', referenceId.value)
    emit('update:modelValue', false)
    return
  }

  if (props.customerId) {
    // Edit mode — claim immediately (we have a customer_id).
    saving.value = true
    error.value  = ''
    try {
      await addressesService.claimReference({
        address_search_reference_id: referenceId.value,
        customer_id: props.customerId,
        case_id:     props.caseId,
        post_code:   props.postCode,
        address1:    props.address1,
        address2:    props.address2,
        town:        props.town,
        country:     props.country,
        first_name:  props.firstName,
        last_name:   props.lastName,
        phone:       props.phone,
      })
    } catch (e) {
      error.value = e?.data?.detail || e?.response?.data?.detail || e?.message || 'Failed to save reference.'
      return
    } finally {
      saving.value = false
    }
  }
  // Add mode — emit reference ID; parent will claim after customer creation.
  emit('save', referenceId.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="arm-backdrop">
    <div class="arm-panel" role="dialog" aria-modal="true" aria-labelledby="ref-modal-title">

      <div class="arm-head">
        <h2 id="ref-modal-title" class="arm-title">Address Search Reference</h2>
        <button type="button" class="arm-close" aria-label="Close" @click="close">×</button>
      </div>

      <div class="arm-body">
        <div v-if="loading" class="arm-hint">Loading reference…</div>

        <template v-else-if="!error">
          <div class="arm-field">
            <label class="arm-label" for="ref-input">Reference ID</label>
            <input
              id="ref-input"
              :value="referenceId"
              type="text"
              :readonly="isReadOnly"
              class="arm-input"
              :class="{ 'arm-input-readonly': isReadOnly }"
              maxlength="45"
              placeholder="Reference ID"
              @input="referenceId = $event.target.value"
            />
          </div>
          <p v-if="isReadOnly" class="arm-hint arm-hint-info">
            This customer already has an address search reference on record.
          </p>
        </template>

        <p v-if="error" class="arm-error" role="alert">{{ error }}</p>
      </div>

      <div class="arm-foot">
        <button type="button" class="arm-btn arm-btn-cancel" @click="close" :disabled="saving">CANCEL</button>
        <button
          v-if="!loading && !error"
          type="button"
          class="arm-btn arm-btn-save"
          :disabled="saving || !referenceId"
          @click="save"
        >
          {{ saving ? 'SAVING…' : isReadOnly ? 'OK' : 'SAVE' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.arm-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  padding: 20px;
}
.arm-panel {
  background: #fff;
  border-radius: var(--radius, 6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
  width: 100%; max-width: 480px;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.arm-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: var(--primary, #1d4ed8);
  color: #fff;
}
.arm-title {
  font-size: 15px; font-weight: 600;
  margin: 0;
}
.arm-close {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none;
  color: #fff; font-size: 22px; line-height: 1;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background 120ms;
}
.arm-close:hover { background: rgba(255, 255, 255, 0.18); }
.arm-body {
  padding: 20px 18px;
  display: flex; flex-direction: column;
  gap: 12px;
}
.arm-field {
  display: flex; flex-direction: column;
  gap: 6px;
}
.arm-label {
  font-size: 13px; font-weight: 500;
  color: var(--text-default, #374151);
}
.arm-input {
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid var(--border, #d1d5db);
  border-radius: var(--radius-sm, 4px);
  outline: none;
  transition: border-color 120ms, box-shadow 120ms;
  background: #fff;
  color: var(--text-strong, #111827);
}
.arm-input:focus { border-color: var(--primary, #1d4ed8); box-shadow: 0 0 0 3px var(--primary-light, #dbeafe); }
.arm-input-readonly {
  background: var(--bg-page, #f8fafc);
  color: var(--text-muted, #6b7280);
  cursor: default;
}
.arm-hint {
  font-size: 13px;
  color: var(--text-muted, #6b7280);
  padding: 8px 10px;
  background: var(--bg-page, #f8fafc);
  border-radius: var(--radius-sm, 4px);
}
.arm-hint-info {
  border-left: 3px solid var(--primary, #1d4ed8);
  color: var(--primary, #1d4ed8);
}
.arm-error {
  font-size: 13px;
  color: var(--danger, #dc2626);
  padding: 10px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm, 4px);
  margin: 0;
}
.arm-foot {
  display: flex; justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--border, #e5e7eb);
  background: var(--bg-page, #f8fafc);
}
.arm-btn {
  padding: 8px 18px;
  font-size: 13px; font-weight: 600;
  letter-spacing: 0.04em;
  border: none; border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background 120ms, opacity 120ms;
}
.arm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.arm-btn-cancel {
  background: var(--danger, #dc2626);
  color: #fff;
}
.arm-btn-cancel:hover:not(:disabled) { background: #b91c1c; }
.arm-btn-save {
  background: var(--success, #059669);
  color: #fff;
}
.arm-btn-save:hover:not(:disabled) { background: #047857; }
</style>
