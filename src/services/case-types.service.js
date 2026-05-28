import { apiGet } from '@/services/api.js'

export const caseTypesService = {
  getAll: () =>
    apiGet('/revp/cases/case-types/').then(items =>
      (items ?? []).map(ct => ({
        case_type_id: ct.type_id,
        code:         ct.code,
        case_option:  ct.description,
      }))
    ),
}
