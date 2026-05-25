import { defineStore } from 'pinia'
import { ref } from 'vue'
import { lookupValuesService } from '@/services/lookup-values.service.js'

const PAGE_SIZE = 25

export const useLookupValuesStore = defineStore('lookupValues', () => {
  const rows = ref([])
  const lookupTypes = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchTypes() {
    try {
      const data = await lookupValuesService.getTypes()
      lookupTypes.value = data.results ?? []
    } catch {
      // non-critical — filter just won't populate
    }
  }

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await lookupValuesService.getAll({ page_size: PAGE_SIZE, ...params })
      rows.value = data.results ?? []
      total.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load lookup values. Please try again.'
      rows.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function createValue(payload) {
    return lookupValuesService.create(payload)
  }

  async function updateValue(id, payload) {
    return lookupValuesService.update(id, payload)
  }

  async function removeValue(id) {
    return lookupValuesService.remove(id)
  }

  return {
    rows, lookupTypes, total, loading, error, pageSize: PAGE_SIZE,
    fetchTypes, fetchAll, createValue, updateValue, removeValue,
  }
})
