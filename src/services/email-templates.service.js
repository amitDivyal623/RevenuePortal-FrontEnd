import { apiDel, apiGet, apiPost, apiPut } from '@/services/api.js'

export const emailTemplatesService = {
  getAll: () =>
    apiGet('/revp/templates/emails/?page_size=100&active=true').then(r => r.results ?? []),

  getReferenceData: () =>
    apiGet('/revp/templates/emails/modal-data/').then(data => ({
      // list_case_types returns {type_id, code, description} — normalize to {case_type_id, case_option}
      caseTypes: (data.case_types ?? []).map(ct => ({
        case_type_id: ct.type_id ?? ct.case_type_id,
        case_option: ct.code ?? ct.case_option,
      })),
      tocUsers: data.users ?? [],
      letterTemplates: data.letter_templates ?? [],
      tocEmailTemplates: data.template_names ?? [],
      communicationAutomationEnabled: data.revp_communication_automation === 'Enable',
    })),

  getOne: (id) =>
    apiGet(`/revp/templates/emails/${id}/`),

  create: (payload) =>
    apiPost('/revp/templates/emails/create/', payload),

  update: (id, payload) =>
    apiPut(`/revp/templates/emails/${id}/`, payload),

  remove: (id) =>
    apiDel(`/revp/templates/emails/${id}/`),

  getLetterTemplates: (caseTypeIds = []) => {
    if (caseTypeIds.length === 0) {
      return apiGet('/revp/templates/letters/?page_size=100').then(r => r.results ?? [])
    }
    return Promise.all(
      caseTypeIds.map(id =>
        apiGet(`/revp/templates/letters/?page_size=100&case_type_id=${encodeURIComponent(id)}`).then(r => r.results ?? [])
      )
    ).then(results => {
      const seen = new Set()
      const merged = []
      for (const arr of results) {
        for (const item of arr) {
          if (!seen.has(item.letter_template_id)) {
            seen.add(item.letter_template_id)
            merged.push(item)
          }
        }
      }
      return merged.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    })
  },
}
