import {
  caseTypes,
  zeroFareRows as seedZeroFare,
  printerAppRows as seedPrinterApp,
} from '@/mock/appControlData.js'

let _zeroFare = [...seedZeroFare]
let _printerApp = [...seedPrinterApp]

export const appControlService = {
  getCaseTypes: () => Promise.resolve([...caseTypes]),

  getZeroFareRows: () => Promise.resolve([..._zeroFare]),
  saveZeroFareRow: (caseTypeId, payload) => {
    const item = _zeroFare.find(r => r.case_type_id === caseTypeId)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },

  getPrinterAppRows: () => Promise.resolve([..._printerApp]),
  savePrinterAppRow: (caseTypeId, payload) => {
    const item = _printerApp.find(r => r.case_type_id === caseTypeId)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
}
