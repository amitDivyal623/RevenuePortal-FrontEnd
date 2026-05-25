import { defineStore } from 'pinia'
import { ref } from 'vue'
import { printTemplatesService } from '@/services/print-templates.service.js'

export const usePrintTemplatesStore = defineStore('printTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, ct] = await Promise.all([
        printTemplatesService.getAll(),
        printTemplatesService.getCaseTypes(),
      ])
      templates.value = all
      caseTypes.value = ct
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(payload) {
    const item = await printTemplatesService.create(payload)
    templates.value.push(item)
  }

  async function updateTemplate(id, payload) {
    await printTemplatesService.update(id, payload)
    const item = templates.value.find(t => t.print_template_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeTemplate(id) {
    await printTemplatesService.remove(id)
    const item = templates.value.find(t => t.print_template_id === id)
    if (item) item.active = 0
  }

  return {
    templates, caseTypes, loading,
    init, createTemplate, updateTemplate, removeTemplate,
  }
})
