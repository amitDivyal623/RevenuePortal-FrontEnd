import { defineStore } from 'pinia'
import { ref } from 'vue'
import { offencesService } from '@/services/offences.service.js'

export const useOffencesStore = defineStore('offences', () => {
  const offences = ref([])
  const chargeTypes = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, modalData] = await Promise.all([
        offencesService.getAll(),
        offencesService.getModalData(),
      ])
      offences.value = all
      chargeTypes.value = modalData.chargeTypes
    } finally {
      loading.value = false
    }
  }

  async function fetchOffence(id) {
    return offencesService.getOne(id)
  }

  async function createOffence(payload) {
    const item = await offencesService.create(payload)
    offences.value.push(item)
  }

  async function updateOffence(id, payload) {
    const updated = await offencesService.update(id, payload)
    const idx = offences.value.findIndex(o => o.offence_id === id)
    if (idx !== -1) offences.value[idx] = updated
  }

  return {
    offences, chargeTypes, loading,
    init, fetchOffence, createOffence, updateOffence,
  }
})
