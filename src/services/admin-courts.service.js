import { api } from '@/services/api.js'

export const adminCourtsService = {
  getAll: (params = {}) => api.get(`/v1/courts/?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/v1/courts/${id}/`),
  create: (payload) => api.post('/v1/courts/', payload),
  update: (id, payload) => api.put(`/v1/courts/${id}/`, payload),
}
