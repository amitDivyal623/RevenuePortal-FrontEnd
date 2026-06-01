import { apiGet, apiPost, apiPut } from '@/services/api.js'

export const offencesService = {
  getAll: () =>
    apiGet('/revp/offences/?page_size=100').then(r => r.results ?? []),

  getModalData: () =>
    apiGet('/revp/offences/modal-data/').then(data => ({
      chargeTypes: (data.charge_types ?? [])
        .filter(c => c.active)
        .map(c => c.lookup_data_value),
    })),

  getOne: (id) =>
    apiGet(`/revp/offences/${id}/`),

  create: (payload) =>
    apiPost('/revp/offences/', payload),

  update: (id, payload) =>
    apiPut(`/revp/offences/${id}/`, payload),
}
