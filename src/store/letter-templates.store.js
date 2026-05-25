import { defineStore } from 'pinia'
import { ref } from 'vue'
import { letterTemplatesService } from '@/services/letter-templates.service.js'

export const useLetterTemplatesStore = defineStore('letterTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const tocUsers = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, refData] = await Promise.all([
        letterTemplatesService.getAll(),
        letterTemplatesService.getReferenceData(),
      ])
      templates.value = all
      caseTypes.value = refData.caseTypes
      tocUsers.value = refData.tocUsers
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(payload) {
    const item = await letterTemplatesService.create(payload)
    templates.value.push(item)
  }

  async function updateTemplate(id, payload) {
    await letterTemplatesService.update(id, payload)
    const item = templates.value.find(t => t.letter_template_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeTemplate(id) {
    await letterTemplatesService.remove(id)
    const item = templates.value.find(t => t.letter_template_id === id)
    if (item) item.active = 0
  }

  return {
    templates, caseTypes, tocUsers, loading,
    init, createTemplate, updateTemplate, removeTemplate,
  }
})
