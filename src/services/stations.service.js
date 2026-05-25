import { api } from '@/services/api.js'

export const stationsService = {
  getAll: (params = {}) => api.get(`/v1/revp/stations/?${new URLSearchParams(params)}`),
  getById: (id, tocId) => api.get(`/v1/revp/stations/${id}/?toc_id=${encodeURIComponent(tocId)}`),
  create: (payload) => api.post('/v1/revp/stations/', payload),
  update: (id, payload) => api.put(`/v1/revp/stations/${id}/`, payload),
  remove: (id) => api.delete(`/v1/revp/stations/${id}/`),
  getEnabledServiceTypes: (tocId) =>
    api.get(`/v1/revp/service-types/enabled/?toc_id=${encodeURIComponent(tocId)}`),
  getCaseTypes: (tocId) =>
    api.get(`/v1/revp/case-types/?toc_id=${encodeURIComponent(tocId)}`),
}
