import { initials as seedData, caseTypes } from '@/mock/manualCaseInitialsData.js'

let _initials = [...seedData]

export const manualCaseInitialsService = {
  getCaseTypes: () => Promise.resolve([...caseTypes]),
  getAll: () => Promise.resolve([..._initials]),
  create: (payload) => {
    const item = { case_initials_id: _uuid(), active: 1, ...payload }
    _initials.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _initials.find(i => i.case_initials_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _initials.find(i => i.case_initials_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
