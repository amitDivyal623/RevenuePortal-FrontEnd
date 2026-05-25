import { defineStore } from 'pinia'
import { ref } from 'vue'
import { prosecutorsService } from '@/services/prosecutors.service.js'

export const useProsecutorsStore = defineStore('prosecutors', () => {
  const prosecutors = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      prosecutors.value = await prosecutorsService.getAll()
    } finally {
      loading.value = false
    }
  }

  async function createProsecutor(payload) {
    const item = await prosecutorsService.create(payload)
    prosecutors.value.push(item)
  }

  async function updateProsecutor(id, payload) {
    await prosecutorsService.update(id, payload)
    const item = prosecutors.value.find(p => p.prosecutor_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeProsecutor(id) {
    await prosecutorsService.remove(id)
    const idx = prosecutors.value.findIndex(p => p.prosecutor_id === id)
    if (idx !== -1) prosecutors.value.splice(idx, 1)
  }

  return {
    prosecutors, loading,
    init, createProsecutor, updateProsecutor, removeProsecutor,
  }
})
