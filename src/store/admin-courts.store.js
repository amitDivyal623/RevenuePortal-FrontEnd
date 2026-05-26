import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminCourtsService } from '@/services/admin-courts.service.js'

export const useAdminCourtsStore = defineStore('adminCourts', () => {
  const courts = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchCourts(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await adminCourtsService.getAll(params)
      courts.value = Array.isArray(data.results) ? data.results : []
      totalRecords.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load courts.'
      courts.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCourtById(id) {
    return adminCourtsService.getById(id)
  }

  async function createCourt(payload) {
    return adminCourtsService.create(payload)
  }

  async function updateCourt(id, payload) {
    return adminCourtsService.update(id, payload)
  }

  async function removeCourt(id) {
    await adminCourtsService.remove(id)
  }

  return {
    courts, totalRecords, loading, error,
    fetchCourts, fetchCourtById, createCourt, updateCourt, removeCourt,
  }
})
