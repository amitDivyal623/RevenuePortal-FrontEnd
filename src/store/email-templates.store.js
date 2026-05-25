import { defineStore } from 'pinia'
import { ref } from 'vue'
import { emailTemplatesService } from '@/services/email-templates.service.js'

export const useEmailTemplatesStore = defineStore('emailTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const tocUsers = ref([])
  const letterTemplates = ref([])
  const tocEmailTemplates = ref([])
  const communicationAutomationEnabled = ref(false)
  const loading = ref(false)

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

  async function createTemplate(payload) {
    const item = await emailTemplatesService.create(payload)
    templates.value.push(item)
  }

  async function updateTemplate(id, payload) {
    await emailTemplatesService.update(id, payload)
    const item = templates.value.find(t => t.email_template_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeTemplate(id) {
    await emailTemplatesService.remove(id)
    const item = templates.value.find(t => t.email_template_id === id)
    if (item) item.active = 0
  }

  return {
    templates, caseTypes, tocUsers, letterTemplates, tocEmailTemplates,
    communicationAutomationEnabled, loading,
    init, createTemplate, updateTemplate, removeTemplate,
  }
})
