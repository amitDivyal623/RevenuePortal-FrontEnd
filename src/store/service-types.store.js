import { defineStore } from 'pinia'
import { ref } from 'vue'
import { serviceTypesService } from '@/services/service-types.service.js'

export const useServiceTypesStore = defineStore('serviceTypes', () => {
  const rows = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await serviceTypesService.getAll(params)
      rows.value = data.results ?? []
      total.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load service types. Please try again.'
      rows.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function createServiceType(payload) {
    return serviceTypesService.create(payload)
  }

  async function updateServiceType(id, payload) {
    return serviceTypesService.update(id, payload)
  }

  async function removeServiceType(id) {
    return serviceTypesService.remove(id)
  }

  return {
    rows, total, loading, error,
    fetchAll, createServiceType, updateServiceType, removeServiceType,
  }
})
