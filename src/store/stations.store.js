import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stationsService } from '@/services/stations.service.js'
import { useAuthStore } from '@/store/auth.js'

export const useStationsStore = defineStore('stations', () => {
  const rows = ref([])
  const total = ref(0)
  const serviceTypes = ref([])
  const caseTypes = ref([])
  const loading = ref(false)
  const error = ref(null)

  function getTocId() {
    const auth = useAuthStore()
    return auth.user?.toc_id || import.meta.env.VITE_DEFAULT_TOC_ID || ''
  }

  async function fetchReferenceData() {
    const tocId = getTocId()
    try {
      const [svcData, ctData] = await Promise.all([
        stationsService.getEnabledServiceTypes(tocId),
        stationsService.getCaseTypes(tocId),
      ])
      serviceTypes.value = svcData.results ?? []
      caseTypes.value = ctData.results ?? []
    } catch (err) {
      console.error('Failed to load station reference data:', err)
    }
  }

  async function fetchAll(params = {}) {
    loading.value = true
    error.value = null
    try {
      const tocId = getTocId()
      const data = await stationsService.getAll({ toc_id: tocId, ...params })
      rows.value = data.results ?? []
      total.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load stations. Please try again.'
      rows.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    return stationsService.getById(id, getTocId())
  }

  async function createStation(payload) {
    return stationsService.create({ toc_id: getTocId(), ...payload })
  }

  async function updateStation(id, payload) {
    return stationsService.update(id, payload)
  }

  async function removeStation(id) {
    return stationsService.remove(id)
  }

  return {
    rows, total, serviceTypes, caseTypes, loading, error,
    fetchReferenceData, fetchAll, fetchById, createStation, updateStation, removeStation,
  }
})
