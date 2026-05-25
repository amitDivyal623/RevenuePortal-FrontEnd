import { api } from '@/services/api.js'

export const actionTemplateService = {
  getAll: (caseTypeId = null) => {
    const path = caseTypeId
      ? `/revp/actions/templates/?case_type_id=${encodeURIComponent(caseTypeId)}`
      : '/revp/actions/templates/'
    return api.get(path)
  },
  getModalOptions: () => api.get('/revp/actions/templates/modal-options/'),
  getActionTypes: () => api.get('/revp/actions/types/'),
  getEmailTemplates: (caseTypeId) =>
    api.get(`/revp/templates/emails/?case_type_id=${encodeURIComponent(caseTypeId)}&active=true&page_size=100`),
  getLetterTemplates: (caseTypeId) =>
    api.get(`/revp/templates/letters/?case_type_id=${encodeURIComponent(caseTypeId)}&page_size=100`),
  create: (payload) => api.post('/revp/actions/templates/', payload),
  update: (id, payload) => api.put(`/revp/actions/templates/${encodeURIComponent(id)}/`, payload),
  remove: (id) => api.delete(`/revp/actions/templates/${encodeURIComponent(id)}/delete/`),
}
