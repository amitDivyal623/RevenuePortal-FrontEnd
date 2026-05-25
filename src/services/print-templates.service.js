import { printTemplates as seedData, caseTypes } from '@/mock/printTemplatesData.js'

let _templates = [...seedData]

export const printTemplatesService = {
  getCaseTypes: () => Promise.resolve([...caseTypes]),
  getAll: () => Promise.resolve([..._templates]),
  create: (payload) => {
    const item = { print_template_id: _uuid(), active: 1, ...payload }
    _templates.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _templates.find(t => t.print_template_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _templates.find(t => t.print_template_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
