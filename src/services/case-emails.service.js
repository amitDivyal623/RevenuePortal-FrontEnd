import { api } from '@/services/api.js'

export const caseEmailsService = {
  list: (caseId) =>
    api.get(`/revp/cases/${encodeURIComponent(caseId)}/emails/`),

  add: (caseId, emailTemplateId) =>
    api.post(`/revp/cases/${encodeURIComponent(caseId)}/emails/add/`, {
      email_template_id: emailTemplateId,
    }),

  remove: (caseId, commId) =>
    api.delete(`/revp/cases/${encodeURIComponent(caseId)}/emails/${encodeURIComponent(commId)}/`),
}
