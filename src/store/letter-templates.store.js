import { defineStore } from 'pinia'
import { ref } from 'vue'
import { letterTemplatesService } from '@/services/letter-templates.service.js'
import { caseTypesService } from '@/services/case-types.service.js'

export const useLetterTemplatesStore = defineStore('letterTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const tocUsers = ref([])
  const loading = ref(false)
  const caseTypesLoading = ref(false)
  const caseTypesError = ref(null)

  async function init() {
    loading.value = true
    caseTypesLoading.value = true
    caseTypesError.value = null

    const [templatesResult, refDataResult, caseTypesResult] = await Promise.allSettled([
      letterTemplatesService.getAll(),
      letterTemplatesService.getReferenceData(),
      caseTypesService.getAll(),
    ])

    if (templatesResult.status === 'fulfilled') {
      const data = templatesResult.value
      templates.value = Array.isArray(data) ? data : (data.results ?? [])
    }
    if (refDataResult.status === 'fulfilled') {
      tocUsers.value = refDataResult.value.tocUsers ?? []
    }

    if (caseTypesResult.status === 'fulfilled') {
      caseTypes.value = caseTypesResult.value
    } else {
      caseTypesError.value = 'Failed to load case types. Please refresh the page.'
    }

    loading.value = false
    caseTypesLoading.value = false
  }

  async function createTemplate(formData) {
    const item = await letterTemplatesService.create(formData)
    templates.value.push(item)
  }

  async function updateTemplate(id, formData) {
    const updated = await letterTemplatesService.update(id, formData)
    const idx = templates.value.findIndex(t => t.letter_template_id === id)
    if (idx !== -1) templates.value[idx] = updated
  }

  async function removeTemplate(id) {
    await letterTemplatesService.remove(id)
    templates.value = templates.value.filter(t => t.letter_template_id !== id)
  }

  async function downloadTemplate(id, filename) {
    await letterTemplatesService.downloadFile(id, filename)
  }

  return {
    templates, caseTypes, tocUsers, loading,
    caseTypesLoading, caseTypesError,
    init, createTemplate, updateTemplate, removeTemplate, downloadTemplate,
  }
})
