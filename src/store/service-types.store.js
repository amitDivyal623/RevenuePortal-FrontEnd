import { defineStore } from 'pinia'
import { ref } from 'vue'
import { serviceTypesService } from '@/services/service-types.service.js'

export const useServiceTypesStore = defineStore('serviceTypes', () => {
  const rows    = ref([])
  const loading = ref(false)
  const error   = ref(null)

  // List endpoint returns a plain array (no pagination wrapper)
  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const data  = await serviceTypesService.getAll()
      rows.value  = Array.isArray(data) ? data : []
    } catch (err) {
      error.value = 'Failed to load service types. Please try again.'
      rows.value  = []
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    return serviceTypesService.getById(id)
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
    rows, loading, error,
    fetchAll, fetchById, createServiceType, updateServiceType, removeServiceType,
  }
})
