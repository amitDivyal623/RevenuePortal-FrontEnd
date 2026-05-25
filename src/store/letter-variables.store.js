import { defineStore } from 'pinia'
import { ref } from 'vue'
import { letterVariablesService } from '@/services/letter-variables.service.js'

export const useLetterVariablesStore = defineStore('letterVariables', () => {
  const variables = ref([])
  const dataTypes = ref([])
  const styleOptions = ref({})
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, meta] = await Promise.all([
        letterVariablesService.getAll(),
        letterVariablesService.getMetadata(),
      ])
      variables.value = all
      dataTypes.value = meta.dataTypes
      styleOptions.value = meta.styleOptions
    } finally {
      loading.value = false
    }
  }

  async function createVariable(payload) {
    const item = await letterVariablesService.create(payload)
    variables.value.push(item)
  }

  async function updateVariable(id, payload) {
    await letterVariablesService.update(id, payload)
    const item = variables.value.find(v => v.variableID === id)
    if (item) Object.assign(item, payload)
  }

  async function removeVariable(id) {
    await letterVariablesService.remove(id)
    const item = variables.value.find(v => v.variableID === id)
    if (item) item.bActive = 0
  }

  return {
    variables, dataTypes, styleOptions, loading,
    init, createVariable, updateVariable, removeVariable,
  }
})
