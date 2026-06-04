import { api } from '@/services/api.js'

export const serviceTypesService = {
  getAll:  () => api.get('/revp/stations/service-types/'),
  getById: (id) => api.get(`/revp/stations/service-types/${id}/`),
  create:  (payload) => api.post('/revp/stations/service-types/create/', payload),
  update:  (id, payload) => api.put(`/revp/stations/service-types/${id}/`, payload),
  remove:  (id) => api.delete(`/revp/stations/service-types/${id}/`),
}
