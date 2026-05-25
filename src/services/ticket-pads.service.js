import {
  caseTypes,
  tocUsers,
  padIssuers,
  sessionUserId,
  ticketPads as seedData,
} from '@/mock/ticketPadsData.js'

let _pads = [...seedData]

export const ticketPadsService = {
  getReferenceData: () =>
    Promise.resolve({ caseTypes, tocUsers, padIssuers, sessionUserId }),
  getAll: () => Promise.resolve([..._pads]),
  create: (payload) => {
    const item = { ticket_pad_id: _uuid(), ...payload }
    _pads.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const i = _pads.findIndex(p => p.ticket_pad_id === id)
    if (i !== -1) Object.assign(_pads[i], payload)
    return Promise.resolve(_pads[i])
  },
  remove: (id) => {
    const item = _pads.find(p => p.ticket_pad_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
