<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Print Templates</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> /
        <a href="#" @click.prevent>Revenue Protection Admin</a> /
        <span class="breadcrumb-active">Print Templates</span>
      </div>
    </div>

    <p v-if="store.error" class="form-error mb-md" style="font-size:13px">{{ store.error }}</p>

    <div class="card card-padded mb-lg">
      <div class="card-title">Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Case Type</label>
          <select v-model="filterCaseType">
            <option value="">All</option>
            <option v-for="ct in caseTypes" :key="ct.case_type_id" :value="ct.case_type_id">{{ ct.case_option }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="applyFilters">Search</button>
        <button class="btn btn-secondary btn-sm" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="card card-padded">
      <div class="card-title">Print Templates ({{ filtered.length }})</div>
      <div v-if="store.loading" class="text-muted text-center" style="padding:32px 0">Loading…</div>
      <div v-else class="table-wrap">
        <table class="tbl-print">
          <colgroup>
            <col style="width:14%">
            <col style="width:20%">
            <col>
            <col style="width:9%">
            <col style="width:13%">
          </colgroup>
          <thead>
            <tr>
              <th>Case Option</th>
              <th>Title</th>
              <th>Contents (preview)</th>
              <th>Active</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length===0">
              <td colspan="5">
                <div class="empty-state"><div class="empty-state-icon">🖨️</div><p class="empty-state-title">No print templates found</p></div>
              </td>
            </tr>
            <tr v-for="row in filtered" :key="row.print_template_id">
              <td><span class="badge badge-primary">{{ row.case_option || caseTypeLabel(row.case_type_id) }}</span></td>
              <td class="cell-clip"><strong>{{ row.title }}</strong></td>
              <td class="cell-clip">
                <div class="preview-inner">
                  <span v-if="isZpl(row)" class="badge badge-zpl">ZPL</span>
                  <span class="preview-text text-muted">{{ contentsPreview(row) }}</span>
                </div>
              </td>
              <td><span :class="`badge badge-${row.active ? 'success' : 'neutral'}`">{{ row.active ? 'Active' : 'Disabled' }}</span></td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button class="btn btn-secondary btn-sm" @click="openView(row)">View</button>
                  <button class="btn btn-secondary btn-sm" @click="openEdit(row)">Edit</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit / View modal -->
    <AdminModal v-if="modalOpen" :title="modalTitle" size="lg" :mode="modalMode" @close="closeModal" @save="saveTpl">
      <div v-if="loadingDetail" class="text-muted text-center" style="padding:32px 0">Loading…</div>
      <template v-else>
        <p v-if="saveError" class="form-error" style="font-size:13px;margin-bottom:4px">{{ saveError }}</p>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Title <span class="req">*</span></label>
            <input v-model.trim="form.title" :disabled="modalMode==='view'" placeholder="Template title" maxlength="225" />
            <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Case Type</label>
            <input :value="form.case_option || caseTypeLabel(form.case_type_id)" disabled />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Contents <span class="req">*</span></label>
          <textarea v-model="form.contents" :disabled="modalMode==='view'" rows="10" placeholder="Print template contents (ZPL code)." style="font-family:ui-monospace,Monaco,monospace;font-size:12px"></textarea>
          <span v-if="errors.contents" class="form-error">{{ errors.contents }}</span>
        </div>

        <!-- Preview / Print area — mirrors old project layout -->
        <div class="form-group">
          <div class="flex gap-sm">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="previewLoading || !form.contents"
              @click="previewZpl"
            >{{ previewLoading ? 'Rendering…' : 'Preview' }}</button>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="printLoading || !form.contents"
              @click="printZpl"
            >{{ printLoading ? 'Opening…' : 'Print' }}</button>
          </div>
          <p v-if="previewError" class="form-error" style="margin-top:8px;font-size:12px">{{ previewError }}</p>
          <div v-if="previewImageUrl" style="margin-top:12px">
            <img :src="previewImageUrl" alt="Label preview" style="width:200px;border:1px solid var(--border);border-radius:var(--radius);display:block" />
          </div>
        </div>

        <div class="form-group inline-row">
          <label class="form-label">Active</label>
          <label class="toggle"><input type="checkbox" v-model="form.active" :true-value="true" :false-value="false" :disabled="modalMode==='view'" /><span class="toggle-track"></span></label>
        </div>
      </template>
    </AdminModal>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AdminModal from '@/components/AdminModal.vue'
import { usePrintTemplatesStore } from '@/store/print-templates.store.js'
import { swal } from '@/utils/swal.js'

const store = usePrintTemplatesStore()
onMounted(() => store.init())

const rows = computed(() => store.templates)
const caseTypes = computed(() => store.caseTypes)
const filterCaseType   = ref('')
const appliedCaseType  = ref('')

function applyFilters() { appliedCaseType.value = filterCaseType.value; page.value = 1 }
function clearFilters()  { filterCaseType.value = ''; appliedCaseType.value = ''; page.value = 1 }
const page = ref(1)
const modalOpen = ref(false)
const modalMode = ref('edit')
const loadingDetail = ref(false)
const saveError = ref('')

const blank = () => ({ print_template_id: '', title: '', contents: '', case_type_id: '', case_option: '', active: true })
const form = reactive(blank())
const errors = reactive({})

const modalTitle = computed(() => modalMode.value === 'edit' ? 'Edit Print Template' : 'View Print Template')
const filtered = computed(() => rows.value.filter(r => !appliedCaseType.value || r.case_type_id === appliedCaseType.value))

function isZpl(row) {
  const c = (row.contents_preview ?? row.contents ?? '').trim()
  return c.toLowerCase().startsWith('^xa')
}

function contentsPreview(row) {
  const raw  = row.contents_preview ?? (row.contents || '').slice(0, 100)
  // Collapse whitespace/newlines so ZPL doesn't wrap across lines in the cell
  const text = raw.replace(/\s+/g, ' ').trim()
  return text.length >= 80 ? text.slice(0, 80) + '…' : text
}

function caseTypeLabel(id) { return caseTypes.value.find(c => c.case_type_id === id)?.case_option ?? id }

/* ───────── Preview / Print state ───────── */
const previewLoading  = ref(false)
const printLoading    = ref(false)
const previewError    = ref('')
const previewImageUrl = ref('')

// Cache: stores the last successfully rendered ZPL and its object URL.
// If the user clicks Preview again without editing contents, the API call
// is skipped entirely and the cached image is shown instantly.
let _cachedZpl = ''
let _cachedUrl = ''
let _abortCtrl = null   // AbortController for any in-flight preview request

function _clearCache() {
  if (_cachedUrl) { URL.revokeObjectURL(_cachedUrl); _cachedUrl = '' }
  _cachedZpl = ''
}

function resetPreview() {
  _abortCtrl?.abort()
  _abortCtrl        = null
  previewLoading.value  = false
  printLoading.value    = false
  previewError.value    = ''
  previewImageUrl.value = ''
  _clearCache()
}

function reset() {
  Object.assign(form, blank())
  Object.keys(errors).forEach(k => delete errors[k])
  saveError.value = ''
  resetPreview()
}

function closeModal() { modalOpen.value = false; reset() }
function load(r) { Object.assign(form, blank(), { ...r }) }

async function openEdit(row) {
  reset()
  modalMode.value = 'edit'
  loadingDetail.value = true
  modalOpen.value = true
  try {
    const detail = await store.fetchDetail(row.print_template_id)
    load(detail)
  } catch (e) {
    saveError.value = e.message || 'Failed to load template details'
  } finally {
    loadingDetail.value = false
  }
}

async function openView(row) {
  reset()
  modalMode.value = 'view'
  loadingDetail.value = true
  modalOpen.value = true
  try {
    const detail = await store.fetchDetail(row.print_template_id)
    load(detail)
  } catch (e) {
    saveError.value = e.message || 'Failed to load template details'
  } finally {
    loadingDetail.value = false
  }
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!form.title) { errors.title = 'Please enter title'; ok = false }
  if (!form.contents) { errors.contents = 'Please enter contents'; ok = false }
  return ok
}

watch(() => form.title,    v => { if (errors.title && v?.trim()) delete errors.title })
watch(() => form.contents, v => { if (errors.contents && v?.trim()) delete errors.contents })

async function saveTpl() {
  if (!validate()) return
  saveError.value = ''
  try {
    await store.updateTemplate(form.print_template_id, {
      title: form.title,
      contents: form.contents,
      active: form.active,
    })
    closeModal()
    await swal.success('Print template updated successfully.')
  } catch (e) {
    saveError.value = e.message || 'Failed to save template'
  }
}

/* ───────────── Labelary ZPL rendering ───────────── */
const LABELARY_URL = 'https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/'

function isValidZpl(contents) {
  return (contents || '').trim().toLowerCase().startsWith('^xa')
}

async function previewZpl() {
  previewError.value = ''
  const zpl = (form.contents || '').trim()

  if (!isValidZpl(zpl)) {
    previewError.value = 'Content does not contain valid ZPL code'
    return
  }

  // Cache hit — ZPL unchanged since last render, show instantly without API call
  if (zpl === _cachedZpl && _cachedUrl) {
    previewImageUrl.value = _cachedUrl
    return
  }

  // Cancel any previous in-flight request to avoid stale responses
  _abortCtrl?.abort()
  _abortCtrl = new AbortController()
  previewLoading.value  = true
  previewImageUrl.value = ''

  try {
    const resp = await fetch(LABELARY_URL, {
      method:  'POST',
      headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    zpl,
      signal:  _abortCtrl.signal,
    })
    if (!resp.ok) throw new Error(`Labelary error (${resp.status})`)
    const blob = await resp.blob()

    if (_cachedUrl) URL.revokeObjectURL(_cachedUrl)
    _cachedZpl = zpl
    _cachedUrl = URL.createObjectURL(blob)
    previewImageUrl.value = _cachedUrl
  } catch (e) {
    if (e.name !== 'AbortError') previewError.value = e.message || 'Failed to render label preview'
  } finally {
    previewLoading.value = false
    _abortCtrl = null
  }
}

async function printZpl() {
  previewError.value = ''
  const zpl = (form.contents || '').trim()

  if (!isValidZpl(zpl)) {
    previewError.value = 'Content does not contain valid ZPL code'
    return
  }

  printLoading.value = true
  try {
    const resp = await fetch(LABELARY_URL, {
      method:  'POST',
      headers: { Accept: 'application/pdf', 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    zpl,
    })
    if (!resp.ok) throw new Error(`Labelary error (${resp.status})`)
    const blob = await resp.blob()
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } catch (e) {
    previewError.value = e.message || 'Failed to generate PDF'
  } finally {
    printLoading.value = false
  }
}
</script>

<style scoped>
/* table-layout: fixed is required so colgroup widths are strictly respected
   and overflow/ellipsis on cells actually works */
.tbl-print { table-layout: fixed; width: 100%; }

/* Any cell that should clip + ellipsis */
.cell-clip {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Flex row inside the contents cell: badge + text */
.preview-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

/* The text part must have min-width:0 so flex doesn't prevent it shrinking */
.preview-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  min-width: 0;
  flex: 1;
}

/* ZPL badge */
.badge-zpl {
  flex-shrink: 0;
  background: #e8f0fe;
  color: #3c5bb5;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
