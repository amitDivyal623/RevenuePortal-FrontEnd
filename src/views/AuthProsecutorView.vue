<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Authorising Prosecutor</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Authorising Prosecutor</span>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Prosecutor Details</div>
        <button class="btn btn-primary btn-sm" @click="openEdit" :disabled="loading">Edit Config</button>
      </div>

      <div v-if="loading" style="padding:24px;text-align:center">Loading…</div>

      <template v-else>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input :value="details.name || '—'" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input :value="details.job_title || '—'" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Supplementary Info</label>
          <textarea :value="details.supplementary_info || '—'" disabled rows="4" style="resize:none"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Signature</label>
          <input :value="details.attachment?.filename || '—'" disabled />
        </div>
      </template>
    </div>

    <AdminModal v-if="modalOpen" title="Edit Prosecutor Details" size="md" mode="edit" @close="closeModal" @save="save">
      <div class="form-group">
        <label class="form-label">Name <span class="req">*</span></label>
        <input v-model.trim="form.name" placeholder="Enter name" maxlength="90" />
        <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Job Title</label>
        <input v-model.trim="form.job_title" placeholder="Enter job title" maxlength="150" />
      </div>
      <div class="form-group">
        <label class="form-label">Supplementary Info</label>
        <textarea v-model.trim="form.supplementary_info" rows="5" placeholder="Enter supplementary information"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Signature</label>
        <input type="file" ref="fileInput" @change="onFileChange"
               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff" />
        <p v-if="currentFilename && !selectedFile" class="text-muted" style="font-size:12px;margin-top:4px">
          Current: <strong>{{ currentFilename }}</strong>
        </p>
        <p v-if="selectedFile" class="text-muted" style="font-size:12px;margin-top:4px">
          Selected: <strong>{{ selectedFile.name }}</strong>
        </p>
        <span v-if="errors.file" class="form-error">{{ errors.file }}</span>
      </div>
    </AdminModal>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { apiGet, apiPost } from '@/services/api.js'
import { swal } from '@/utils/swal.js'

const loading = ref(false)
const details = reactive({
  prosecutor_id:    '',
  name:             '',
  job_title:        '',
  supplementary_info: '',
  attachment_id:    '',
  attachment:       null,
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await apiGet('/revp/courts/prosecutor-details/')
    Object.assign(details, data)
  } catch (err) {
    if (err?.status !== 404) {
      await swal.error(err?.data?.detail ?? 'Failed to load prosecutor details.')
    }
    // 404 = no row yet — form stays empty, first save creates it
  } finally {
    loading.value = false
  }
})

const modalOpen    = ref(false)
const form         = reactive({ name: '', job_title: '', supplementary_info: '' })
const errors       = reactive({})
const selectedFile = ref(null)
const currentFilename = ref('')
const fileInput    = ref(null)

function openEdit() {
  form.name               = details.name               ?? ''
  form.job_title          = details.job_title          ?? ''
  form.supplementary_info = details.supplementary_info ?? ''
  currentFilename.value   = details.attachment?.filename ?? ''
  selectedFile.value      = null
  Object.keys(errors).forEach(k => delete errors[k])
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value    = false
  selectedFile.value = null
}

function onFileChange(e) {
  selectedFile.value = e.target.files?.[0] ?? null
}

async function save() {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.name) {
    errors.name = 'Name is required'
    return
  }

  try {
    const fd = new FormData()
    fd.append('name',               form.name)
    fd.append('job_title',          form.job_title)
    fd.append('supplementary_info', form.supplementary_info)
    if (details.prosecutor_id) fd.append('prosecutor_id',  details.prosecutor_id)
    if (details.attachment_id) fd.append('attachment_id',  details.attachment_id)
    if (selectedFile.value)    fd.append('file',           selectedFile.value)

    const updated = await apiPost('/revp/courts/prosecutor-details/', fd)
    Object.assign(details, updated)
    closeModal()
    await swal.success('Prosecutor details saved successfully.')
  } catch (err) {
    if (err?.status === 400 && err?.data && typeof err.data === 'object' && !err.data.detail) {
      // Field-level validation errors — show inline, keep modal open
      Object.assign(errors, err.data)
      return
    }
    closeModal()
    await swal.error(err?.data?.detail ?? 'Failed to save. Please try again.')
  }
}
</script>

<style scoped>
.form-error { color: var(--danger, #dc3545); font-size: 12px; display: block; margin-top: 4px; }
.req { color: var(--danger, #dc3545); }
</style>
