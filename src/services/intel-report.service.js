import {
  intelConfig as seedConfig,
  intelStations,
  intelReports,
} from '@/mock/intelReportData.js'

let _config = { ...seedConfig }

export const intelReportService = {
  getConfig: () => Promise.resolve({ ..._config }),
  getStations: () => Promise.resolve([...intelStations]),
  getReports: () => Promise.resolve([...intelReports]),
  saveConfig: (payload) => {
    Object.assign(_config, payload)
    return Promise.resolve({ ..._config })
  },
}
