import { defineStore } from 'pinia'
import { ref } from 'vue'
import { intelReportService } from '@/services/intel-report.service.js'

export const useIntelReportStore = defineStore('intelReport', () => {
  const config = ref({})
  const stations = ref([])
  const reports = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [cfg, stList, rpts] = await Promise.all([
        intelReportService.getConfig(),
        intelReportService.getStations(),
        intelReportService.getReports(),
      ])
      config.value = cfg
      stations.value = stList
      reports.value = rpts
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(payload) {
    config.value = await intelReportService.saveConfig(payload)
  }

  return { config, stations, reports, loading, init, saveConfig }
})
