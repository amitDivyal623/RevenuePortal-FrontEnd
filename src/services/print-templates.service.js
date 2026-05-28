import { api } from '@/services/api.js'
import { caseTypesService } from '@/services/case-types.service.js'

export const printTemplatesService = {
  getCaseTypes: () => caseTypesService.getAll(),

  getAll: (page = 1, pageSize = 100) =>
    api.get(`/revp/templates/print/?page=${page}&page_size=${pageSize}`),

  getDetail: (printTemplateId) =>
    api.get(`/revp/templates/print/detail/?print_template_id=${encodeURIComponent(printTemplateId)}`),

  // payload: { print_template_id?, title, active, contents, case_type_id_data? }
  save: (payload) => api.post('/revp/templates/print/save/', payload),
}
