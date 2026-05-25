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

  async function createInitial(payload) {
    const item = await manualCaseInitialsService.create(payload)
    initials.value.push(item)
  }

  async function updateInitial(id, payload) {
    await manualCaseInitialsService.update(id, payload)
    const item = initials.value.find(i => i.case_initials_id === id)
    if (item) Object.assign(item, payload)
  }

  async function removeInitial(id) {
    await manualCaseInitialsService.remove(id)
    const item = initials.value.find(i => i.case_initials_id === id)
    if (item) item.active = 0
  }

  return {
    initials, caseTypes, loading,
    init, createInitial, updateInitial, removeInitial,
  }
})
