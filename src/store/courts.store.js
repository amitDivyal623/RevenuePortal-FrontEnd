import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { courtsService } from '@/services/courts.service.js'

export const useCourtsStore = defineStore('courts', () => {
  const courts = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error = ref(null)

  const totalPages = (perPage) => computed(() =>
    Math.max(1, Math.ceil(totalRecords.value / perPage.value))
  )

  async function fetchCourts(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await courtsService.getAll(params)
      courts.value = Array.isArray(data.results) ? data.results : []
      totalRecords.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load courts. Please refresh the page.'
      courts.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCourtById(id) {
    return courtsService.getById(id)
  }

  async function createCourt(payload) {
    return courtsService.create(payload)
  }

  async function updateCourt(id, payload) {
    return courtsService.update(id, payload)
  }

  async function removeCourt(id) {
    await courtsService.remove(id)
  }

  return {
    courts, totalRecords, loading, error, totalPages,
    fetchCourts, fetchCourtById, createCourt, updateCourt, removeCourt,
  }
})
