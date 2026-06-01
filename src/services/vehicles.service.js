import { api } from '@/services/api.js'

// All HTTP calls for the /revp/vehicles/... endpoints. Used by the PCN
// flow on Add Case + the Car Parking Details sub-section on Case Detail.
// Legacy parity: a case has either a journey OR a vehicle, never both.
export const vehiclesService = {
  create: (payload) => api.post('/revp/vehicles/create/', payload),
  get:    (id) => api.get(`/revp/vehicles/${encodeURIComponent(id)}/`),
  update: (id, payload) =>
    api.put(`/revp/vehicles/${encodeURIComponent(id)}/update/`, payload),
}
