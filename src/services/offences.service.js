import { offences as seedData, chargeOptions } from '@/mock/offencesData.js'

let _offences = [...seedData]

export const offencesService = {
  getChargeOptions: () => Promise.resolve([...chargeOptions]),
  getAll: () => Promise.resolve([..._offences]),
  create: (payload) => {
    const item = { offence_id: _uuid(), active: 1, ...payload }
    _offences.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _offences.find(o => o.offence_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _offences.find(o => o.offence_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
