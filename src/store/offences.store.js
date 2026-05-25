import { defineStore } from 'pinia'
import { ref } from 'vue'
import { offencesService } from '@/services/offences.service.js'

export const useOffencesStore = defineStore('offences', () => {
  const offences = ref([])
  const chargeOptions = ref([])
  const loading = ref(false)

  async function init() {
    const [all, charges] = await Promise.all([
      offencesService.getAll(),
      offencesService.getChargeOptions(),
    ])
    offences.value = all
    chargeOptions.value = charges
  }

  async function createOffence(payload) {
    const item = await offencesService.create(payload)
    offences.value.push(item)
  }

  async function updateOffence(id, payload) {
    await offencesService.update(id, payload)
    const item = offences.value.find(o => o.offence_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeOffence(id) {
    await offencesService.remove(id)
    const item = offences.value.find(o => o.offence_id === id)
    if (item) item.active = 0
  }

  return {
    offences, chargeOptions, loading,
    init, createOffence, updateOffence, removeOffence,
  }
})
