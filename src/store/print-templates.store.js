import { defineStore } from 'pinia'
import { ref } from 'vue'
import { printTemplatesService } from '@/services/print-templates.service.js'

export const usePrintTemplatesStore = defineStore('printTemplates', () => {
  const templates = ref([])
  const caseTypes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function init() {
    loading.value = true
    error.value = null
    try {
      const [response, ct] = await Promise.all([
        printTemplatesService.getAll(),
        printTemplatesService.getCaseTypes(),
      ])
      templates.value = response.results ?? []
      caseTypes.value = ct
    } catch (e) {
      error.value = e.message || 'Failed to load print templates'
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(printTemplateId) {
    return printTemplatesService.getDetail(printTemplateId)
  }

  async function createTemplate(payload) {
    // payload: { title, active, contents, case_type_id_data }
    const result = await printTemplatesService.save(payload)
    templates.value.push(result)
    return result
  }

  async function updateTemplate(id, payload) {
    // payload: { title, active, contents }
    const result = await printTemplatesService.save({ ...payload, print_template_id: id })
    const idx = templates.value.findIndex(t => t.print_template_id === id)
    if (idx >= 0) templates.value[idx] = result
    return result
  }

  async function removeTemplate(id) {
    const item = templates.value.find(t => t.print_template_id === id)
    if (!item) return
    const detail = await printTemplatesService.getDetail(id)
    await printTemplatesService.save({
      print_template_id: id,
      title: detail.title,
      active: false,
      contents: detail.contents,
    })
    item.active = false
  }

  return {
    templates, caseTypes, loading, error,
    init, fetchDetail, createTemplate, updateTemplate, removeTemplate,
  }
})
