import {
  letterTemplates as seedData,
  caseTypes,
  tocUsers,
} from '@/mock/letterTemplatesData.js'

let _templates = [...seedData]

export const letterTemplatesService = {
  getReferenceData: () => Promise.resolve({ caseTypes, tocUsers }),
  getAll: () => Promise.resolve([..._templates]),
  create: (payload) => {
    const item = { letter_template_id: _uuid(), active: 1, ...payload }
    _templates.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _templates.find(t => t.letter_template_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _templates.find(t => t.letter_template_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
