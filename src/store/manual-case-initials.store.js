import { defineStore } from 'pinia'
import { ref } from 'vue'
import { manualCaseInitialsService } from '@/services/manual-case-initials.service.js'

export const useManualCaseInitialsStore = defineStore('manualCaseInitials', () => {
  const initials = ref([])
  const caseTypes = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, ct] = await Promise.all([
        manualCaseInitialsService.getAll(),
        manualCaseInitialsService.getCaseTypes(),
      ])
      initials.value = all
      caseTypes.value = ct
    } finally {
      loading.value = false
    }
  }

  async function fetchInitial(id) {
    return manualCaseInitialsService.getOne(id)
  }

  async function createInitial(payload) {
    const item = await manualCaseInitialsService.create(payload)
    initials.value.push(item)
  }

  async function updateInitial(id, payload) {
    const updated = await manualCaseInitialsService.update(id, payload)
    const idx = initials.value.findIndex(i => i.case_initials_id === id)
    if (idx !== -1) initials.value[idx] = updated
  }

  return {
    initials, caseTypes, loading,
    init, fetchInitial, createInitial, updateInitial,
  }
})
