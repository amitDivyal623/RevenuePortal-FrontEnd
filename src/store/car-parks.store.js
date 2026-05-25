import { defineStore } from 'pinia'
import { ref } from 'vue'
import { carParksService } from '@/services/car-parks.service.js'

export const useCarParksStore = defineStore('carParks', () => {
  const carParks = ref([])
  const stations = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, stList] = await Promise.all([
        carParksService.getAll(),
        carParksService.getStations(),
      ])
      carParks.value = all
      stations.value = stList
    } finally {
      loading.value = false
    }
  }

  async function createCarPark(payload) {
    const item = await carParksService.create(payload)
    carParks.value.push(item)
  }

  async function updateCarPark(id, payload) {
    await carParksService.update(id, payload)
    const item = carParks.value.find(c => c.car_park_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeCarPark(id) {
    await carParksService.remove(id)
    const item = carParks.value.find(c => c.car_park_id === id)
    if (item) item.active = 0
  }

  return {
    carParks, stations, loading,
    init, createCarPark, updateCarPark, removeCarPark,
  }
})
