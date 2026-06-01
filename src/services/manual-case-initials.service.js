import { apiGet, apiPost, apiPut } from '@/services/api.js'

export const manualCaseInitialsService = {
  getCaseTypes: () =>
    apiGet('/revp/cases/case-types/?active=true').then(data => {
      const arr = Array.isArray(data) ? data : (data.results ?? data.data ?? [])
      return arr.map(ct => ({
        case_type_id: ct.type_id ?? ct.case_type_id,
        case_option: ct.code ?? ct.case_option,
      }))
    }),

  getAll: () =>
    apiGet('/revp/cases/manual-initials/?page_size=100').then(r => r.data ?? []),

  getOne: (id) =>
    apiGet(`/revp/cases/manual-initials/${id}/`),

  create: (payload) =>
    apiPost('/revp/cases/manual-initials/create/', payload),

  update: (id, payload) =>
    apiPut(`/revp/cases/manual-initials/${id}/`, payload),

}
