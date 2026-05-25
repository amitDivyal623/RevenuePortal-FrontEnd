import { defineStore } from 'pinia'
import { ref } from 'vue'
import { actionTemplateService } from '@/services/action-template.service.js'
import { caseTypesService } from '@/services/case-types.service.js'

export const useActionTemplateStore = defineStore('actionTemplate', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const holderOwnerOptions = ref([])
  const actionTypes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchTemplates(caseTypeId = null) {
    loading.value = true
    error.value = null
    try {
      templates.value = await actionTemplateService.getAll(caseTypeId)
    } catch (err) {
      error.value = err?.message || 'Failed to load action templates'
    } finally {
      loading.value = false
    }
  }

  async function fetchReferenceData() {
    try {
      const [caseTypeData, modalOpts, actionTypeData] = await Promise.all([
        caseTypesService.getAll(),
        actionTemplateService.getModalOptions(),
        actionTemplateService.getActionTypes(),
      ])
      caseTypes.value = caseTypeData
      holderOwnerOptions.value = modalOpts.holder_owner_options
      actionTypes.value = actionTypeData.map(t => ({
        actionTypeID: t.action_type_id,
        actionTypeName: t.action_type_name,
      }))
    } catch (err) {
      error.value = err?.message || 'Failed to load reference data'
    }
  }

  async function fetchEmailTemplates(caseTypeId) {
    const data = await actionTemplateService.getEmailTemplates(caseTypeId)
    return data.results ?? []
  }

  async function fetchLetterTemplates(caseTypeId) {
    const data = await actionTemplateService.getLetterTemplates(caseTypeId)
    return data.results ?? []
  }

  async function fetchPredecessors(caseTypeId, excludeId = null) {
    if (!caseTypeId) return []
    const data = await actionTemplateService.getAll(caseTypeId)
    return excludeId ? data.filter(t => t.action_template_id !== excludeId) : data
  }

  async function createTemplate(payload) {
    await actionTemplateService.create(payload)
    await fetchTemplates()
  }

  async function updateTemplate(id, payload) {
    await actionTemplateService.update(id, payload)
    await fetchTemplates()
  }

  async function removeTemplate(id) {
    await actionTemplateService.remove(id)
    await fetchTemplates()
  }

  return {
    templates, caseTypes, holderOwnerOptions, actionTypes, loading, error,
    fetchTemplates, fetchReferenceData, fetchEmailTemplates, fetchLetterTemplates,
    fetchPredecessors, createTemplate, updateTemplate, removeTemplate,
  }
})
