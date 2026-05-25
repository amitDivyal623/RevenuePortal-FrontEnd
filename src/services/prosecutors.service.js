import { prosecutors as seedData } from '@/mock/prosecutorData.js'

let _prosecutors = [...seedData]

export const prosecutorsService = {
  getAll: () => Promise.resolve([..._prosecutors]),
  create: (payload) => {
    const item = { prosecutor_id: _uuid(), active: 1, ...payload }
    _prosecutors.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _prosecutors.find(p => p.prosecutor_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const idx = _prosecutors.findIndex(p => p.prosecutor_id === id)
    if (idx !== -1) _prosecutors.splice(idx, 1)
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
