import { defineStore } from 'pinia'
import { ref } from 'vue'
import { emailTemplatesService } from '@/services/email-templates.service.js'

export const useEmailTemplatesStore = defineStore('emailTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const tocUsers = ref([])
  const letterTemplates = ref([])
  const filteredLetterTemplates = ref([])
  const tocEmailTemplates = ref([])
  const communicationAutomationEnabled = ref(false)
  const loading = ref(false)
  const letterTemplatesLoading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, refData] = await Promise.all([
        emailTemplatesService.getAll(),
        emailTemplatesService.getReferenceData(),
      ])
      templates.value = all
      caseTypes.value = refData.caseTypes
      tocUsers.value = refData.tocUsers
      letterTemplates.value = refData.letterTemplates
      tocEmailTemplates.value = refData.tocEmailTemplates
      communicationAutomationEnabled.value = refData.communicationAutomationEnabled
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplate(id) {
    return emailTemplatesService.getOne(id)
  }

  function syncToEmailTemplates(item) {
    const entry = { email_template_id: item.email_template_id, title: item.title }
    const idx = tocEmailTemplates.value.findIndex(t => t.email_template_id === item.email_template_id)
    if (idx !== -1) tocEmailTemplates.value[idx] = entry
    else tocEmailTemplates.value.push(entry)
    tocEmailTemplates.value = [...tocEmailTemplates.value].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  }

  async function createTemplate(payload) {
    const item = await emailTemplatesService.create(payload)
    templates.value.push(item)
    if (item.active === 1) syncToEmailTemplates(item)
  }

  async function updateTemplate(id, payload) {
    const updated = await emailTemplatesService.update(id, payload)
    if (updated.active === 0) {
      templates.value = templates.value.filter(t => t.email_template_id !== id)
      tocEmailTemplates.value = tocEmailTemplates.value.filter(t => t.email_template_id !== id)
    } else {
      const idx = templates.value.findIndex(t => t.email_template_id === id)
      if (idx !== -1) templates.value[idx] = updated
      syncToEmailTemplates(updated)
    }
  }

  async function removeTemplate(id) {
    await emailTemplatesService.remove(id)
    templates.value = templates.value.filter(t => t.email_template_id !== id)
    tocEmailTemplates.value = tocEmailTemplates.value.filter(t => t.email_template_id !== id)
  }

  async function fetchLetterTemplatesForCaseTypes(caseTypeIds) {
    letterTemplatesLoading.value = true
    try {
      filteredLetterTemplates.value = await emailTemplatesService.getLetterTemplates(caseTypeIds)
    } finally {
      letterTemplatesLoading.value = false
    }
  }

  function clearFilteredLetterTemplates() {
    filteredLetterTemplates.value = []
  }

  return {
    templates, caseTypes, tocUsers, letterTemplates, filteredLetterTemplates,
    tocEmailTemplates, communicationAutomationEnabled, loading, letterTemplatesLoading,
    init, fetchTemplate, createTemplate, updateTemplate, removeTemplate,
    fetchLetterTemplatesForCaseTypes, clearFilteredLetterTemplates,
  }
})
