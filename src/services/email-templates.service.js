import { api } from '@/services/api.js'

export const emailTemplatesService = {
  getAll: () =>
    api.get('/revp/templates/emails/?page_size=100&active=true').then(r => r.results ?? []),

  getReferenceData: () =>
    api.get('/revp/templates/emails/modal-data/').then(data => ({
      // Case types come bundled in this endpoint rather than from the
      // standalone /revp/cases/types/ — but we normalise to the exact same
      // {case_type_id, code, case_option} shape that caseTypesService.getAll()
      // produces, so views can swap data sources without changing field names.
      // Defensive `??` handles both the new shape (case_type_id) and any
      // legacy responses still in the wild that used type_id.
      caseTypes: (data.case_types ?? []).map(ct => ({
        case_type_id: ct.case_type_id ?? ct.type_id ?? '',
        code:         ct.code         ?? '',
        case_option:  ct.case_option  ?? ct.description ?? '',
      })),
      tocUsers: data.users ?? [],
      letterTemplates: data.letter_templates ?? [],
      tocEmailTemplates: data.template_names ?? [],
      communicationAutomationEnabled: data.revp_communication_automation === 'Enable',
    })),

  getOne: (id) =>
    api.get(`/revp/templates/emails/${id}/`),

  create: (payload) =>
    api.post('/revp/templates/emails/create/', payload),

  update: (id, payload) =>
    api.put(`/revp/templates/emails/${id}/`, payload),

  remove: (id) =>
    api.delete(`/revp/templates/emails/${id}/`),

  getLetterTemplates: (caseTypeIds = []) => {
    if (caseTypeIds.length === 0) {
      return api.get('/revp/templates/letters/?page_size=100').then(r => r.results ?? [])
    }
    return Promise.all(
      caseTypeIds.map(id =>
        api.get(`/revp/templates/letters/?page_size=100&case_type_id=${encodeURIComponent(id)}`).then(r => r.results ?? [])
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
