<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Intelligence Report Config</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Intelligence Report Config</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Intelligence Report Configuration</div>
        <button class="btn btn-primary btn-sm" @click="openEdit" :disabled="loading">Edit Config</button>
      </div>

      <div v-if="loading" style="padding:24px;text-align:center">Loading…</div>

      <template v-else>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input :value="config.email_address || '—'" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Pre-Confirmation Message</label>
          <div class="html-preview" v-html="config.pre_confirmation_message || '<em>Not set</em>'"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirmation Message</label>
          <div class="html-preview" v-html="config.confirmation_message || '<em>Not set</em>'"></div>
        </div>
      </template>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Intelligence Report Configuration" size="lg" mode="edit" @close="closeModal" @save="save">
      <div class="form-group">
        <label class="form-label">Email Address <span class="req">*</span></label>
        <input v-model.trim="form.email_address" type="email" placeholder="email@example.com" />
        <span v-if="errors.email_address" class="form-error">{{ errors.email_address }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Pre-Confirmation Message</label>
        <textarea v-model="form.pre_confirmation_message" rows="6" style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Confirmation Message</label>
        <textarea v-model="form.confirmation_message" rows="6" style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { apiGet, apiPut } from '@/services/api.js'
import { swal } from '@/utils/swal.js'

const loading = ref(false)
const config = reactive({
  email_address: '',
  pre_confirmation_message: '',
  confirmation_message: '',
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await apiGet('/revp/cases/ir-details/')
    Object.assign(config, data)
  } catch (err) {
    if (err?.status !== 404) {
      await swal.error(err?.data?.detail ?? 'Failed to load intelligence report config.')
    }
    // 404 = no row yet — form stays empty, first save will create it
  } finally {
    loading.value = false
  }
})

const modalOpen = ref(false)
const form = reactive({ email_address: '', pre_confirmation_message: '', confirmation_message: '' })
const errors = reactive({})

function openEdit() {
  form.email_address           = config.email_address           ?? ''
  form.pre_confirmation_message = config.pre_confirmation_message ?? ''
  form.confirmation_message    = config.confirmation_message    ?? ''
  Object.keys(errors).forEach(k => delete errors[k])
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false }

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.email_address) {
    errors.email_address = 'Email address is required'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address)) {
    errors.email_address = 'Please enter a valid email address'
    return
  }

  try {
    const updated = await apiPut('/revp/cases/ir-details/', {
      email_address:            form.email_address,
      pre_confirmation_message: form.pre_confirmation_message,
      confirmation_message:     form.confirmation_message,
    })
    Object.assign(config, updated)
    closeModal()
    await swal.success('Intelligence report config saved successfully.')
  } catch (err) {
    closeModal()
    await swal.error(err?.data?.detail ?? 'Failed to save. Please try again.')
  }
}
</script>

<style scoped>
.html-preview {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-page);
  font-size: 13px;
  min-height: 70px;
}
.html-preview :deep(p) { margin-bottom: 6px; }
.form-error { color: var(--danger, #dc3545); font-size: 12px; display: block; margin-top: 4px; }
.req { color: var(--danger, #dc3545); }
</style>
