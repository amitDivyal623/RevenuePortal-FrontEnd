import { carParks as seedData, stations } from '@/mock/carParkData.js'

let _carParks = [...seedData]

export const carParksService = {
  getStations: () => Promise.resolve([...stations]),
  getAll: () => Promise.resolve([..._carParks]),
  create: (payload) => {
    const item = { car_park_id: _uuid(), active: 1, ...payload }
    _carParks.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _carParks.find(c => c.car_park_id === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _carParks.find(c => c.car_park_id === id)
    if (item) item.active = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return 'CP-' + (crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).slice(0, 8)
}
