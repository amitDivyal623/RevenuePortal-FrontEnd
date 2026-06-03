import { defineStore } from 'pinia'
import { ref } from 'vue'
import { carParksService } from '@/services/car-parks.service.js'

export const useCarParksStore = defineStore('carParks', () => {
  const carParks  = ref([])
  const stations  = ref([])
  const loading   = ref(false)
  const error     = ref('')

  async function loadStations() {
    stations.value = await carParksService.getStations()
  }

  async function fetchAll(stationId = '') {
    loading.value = true
    error.value   = ''
    try {
      carParks.value = await carParksService.getAll(stationId)
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load car park locations.'
      carParks.value = []
    } finally {
      loading.value = false
    }
  }

  async function init() {
    await Promise.all([fetchAll(), loadStations()])
  }

  async function createCarPark(payload) {
    return carParksService.create(payload)
  }

  async function updateCarPark(id, payload) {
    return carParksService.update(id, payload)
  }

  async function removeCarPark(id) {
    return carParksService.remove(id)
  }

  return {
    carParks, stations, loading, error,
    init, fetchAll, loadStations, createCarPark, updateCarPark, removeCarPark,
  }
})
