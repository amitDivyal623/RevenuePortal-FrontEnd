import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appControlService } from '@/services/app-control.service.js'

export const useAppControlStore = defineStore('appControl', () => {
  const caseTypes = ref([])
  const zeroFareRows = ref([])
  const printerAppRows = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [ct, zf, pa] = await Promise.all([
        appControlService.getCaseTypes(),
        appControlService.getZeroFareRows(),
        appControlService.getPrinterAppRows(),
      ])
      caseTypes.value = ct
      zeroFareRows.value = zf
      printerAppRows.value = pa
    } finally {
      loading.value = false
    }
  }

  async function saveZeroFareRow(caseTypeId, payload) {
    await appControlService.saveZeroFareRow(caseTypeId, payload)
    const item = zeroFareRows.value.find(r => r.case_type_id === caseTypeId)
    if (item) Object.assign(item, payload)
  }

  async function savePrinterAppRow(caseTypeId, payload) {
    await appControlService.savePrinterAppRow(caseTypeId, payload)
    const item = printerAppRows.value.find(r => r.case_type_id === caseTypeId)
    if (item) Object.assign(item, payload)
  }

  return {
    caseTypes, zeroFareRows, printerAppRows, loading,
    init, saveZeroFareRow, savePrinterAppRow,
  }
})
