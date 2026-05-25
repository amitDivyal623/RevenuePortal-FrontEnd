import {
  emailTemplates as seedData,
  caseTypes,
  tocUsers,
  letterTemplates,
  tocEmailTemplates,
  communicationAutomationEnabled,
} from '@/mock/emailTemplatesData.js'

let _templates = [...seedData]

export const emailTemplatesService = {
  getReferenceData: () =>
    Promise.resolve({ caseTypes, tocUsers, letterTemplates, tocEmailTemplates, communicationAutomationEnabled }),
  getAll: () => Promise.resolve([..._templates]),
  create: (payload) => {
    const item = { email_template_id: _uuid(), active: 1, ...payload }
    _templates.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _templates.find(t => t.email_template_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _templates.find(t => t.email_template_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
