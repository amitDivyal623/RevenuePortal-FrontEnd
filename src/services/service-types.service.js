import { api } from '@/services/api.js'

export const serviceTypesService = {
  getAll: (params = {}) => api.get(`/v1/revp/service-types/?${new URLSearchParams(params)}`),
  create: (payload) => api.post('/v1/revp/service-types/', payload),
  update: (id, payload) => api.put(`/v1/revp/service-types/${id}/`, payload),
  remove: (id) => api.delete(`/v1/revp/service-types/${id}/`),
}
