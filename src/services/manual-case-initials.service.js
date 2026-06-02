import { api } from '@/services/api.js'
import { caseTypesService } from '@/services/case-types.service.js'

export const manualCaseInitialsService = {
  // Single source of truth for the case-type dropdown across the app. The
  // previous inline fetch mapped `ct.type_id` (a field that doesn't exist on
  // the response) into `case_type_id`, producing undefined ids and breaking
  // every "select Case Type" validation in this module.
  getCaseTypes: () => caseTypesService.getAll(),

  getAll: () =>
    api.get('/revp/cases/manual-initials/?page_size=100').then(r => r.data ?? []),

  getOne: (id) =>
    api.get(`/revp/cases/manual-initials/${id}/`),

  create: (payload) =>
    api.post('/revp/cases/manual-initials/create/', payload),

  update: (id, payload) =>
    api.put(`/revp/cases/manual-initials/${id}/`, payload),
}
