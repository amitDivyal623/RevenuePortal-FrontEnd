import { api } from '@/services/api.js'

const BASE = '/revp/stations'

export const carParksService = {
  // Carpark locations
  getAll: (stationId = '') => {
    const q = stationId ? `?station_id=${encodeURIComponent(stationId)}` : ''
    return api.get(`${BASE}/carpark-locations/${q}`)
  },

  // create: omit carpark_location_id → backend creates new record
  create: (payload) => api.post(`${BASE}/carpark-locations/`, payload),

  // update: include carpark_location_id → backend updates existing record
  update: (id, payload) =>
    api.post(`${BASE}/carpark-locations/`, { ...payload, carpark_location_id: id }),

  remove: (id) => api.delete(`${BASE}/carpark-locations/${id}/`),

  // All active stations for dropdowns — no pagination cap
  getStations: () =>
    api.get(`${BASE}/modal-data/`)
       .then(data => data.stations ?? []),
}
