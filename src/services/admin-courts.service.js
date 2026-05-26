import { api } from '@/services/api.js'

export const adminCourtsService = {
  getAll:  (params = {}) => api.get(`/revp/courts/?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/revp/courts/${encodeURIComponent(id)}/`),
  create:  (payload) => api.post('/revp/courts/create/', payload),
  update:  (id, payload) => api.put(`/revp/courts/${encodeURIComponent(id)}/update/`, payload),
  remove:  (id) => api.delete(`/revp/courts/${encodeURIComponent(id)}/delete/`),
}
