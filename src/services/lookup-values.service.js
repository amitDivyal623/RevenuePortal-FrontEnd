import { api } from '@/services/api.js'

export const lookupValuesService = {
  getTypes: () => api.get('/revp/lookup/types/'),
  getAll: (params = {}) => api.get(`/revp/lookup/data/?${new URLSearchParams(params)}`),
  create: (payload) => api.post('/revp/lookup/data/', payload),
  update: (id, payload) => api.put(`/revp/lookup/data/${id}/`, payload),
  remove: (id) => api.delete(`/revp/lookup/data/${id}/`),
}
