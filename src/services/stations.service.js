import { api } from '@/services/api.js'

// api.get() / api.post() already prepend the global '/api' from api.js,
// so this BASE must NOT include '/api' — otherwise every call hits
// /api/api/revp/stations/... and 404s.
const BASE = '/revp/stations'

export const stationsService = {
  // ── List (DataTables endpoint — supports all filters) ──────────────────────
  list: (params = {}) => {
    const q = new URLSearchParams()
    if (params.page)          q.set('page',          params.page)
    if (params.page_size)     q.set('page_size',     params.page_size)
    if (params.station_name)  q.set('station_name',  params.station_name)
    if (params.crs_code)      q.set('crs_code',      params.crs_code)
    if (params.nlc_code)      q.set('nlc_code',      params.nlc_code)
    if (params.service_id)    q.set('service_id',    params.service_id)
    if (params.casetype_yes)  q.set('casetype_yes',  params.casetype_yes)
    if (params.ordering)      q.set('ordering',      params.ordering)
    return api.get(`${BASE}/datatable/?${q}`)
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  create: (payload) => api.post(`${BASE}/create/`, payload),

  // ── Detail ─────────────────────────────────────────────────────────────────
  get: (stationId) => api.get(`${BASE}/${stationId}/`),

  // ── Update ─────────────────────────────────────────────────────────────────
  update: (stationId, payload) => api.put(`${BASE}/${stationId}/`, payload),

  // ── Soft-delete ────────────────────────────────────────────────────────────
  delete: (stationId) => api.delete(`${BASE}/${stationId}/`),

  // ── Duplicate check ────────────────────────────────────────────────────────
  check: (payload) => api.post(`${BASE}/check/`, payload),

  // ── Autocomplete (used by Add Station name typeahead) ──────────────────────
  autocomplete: (query, limit = 20) => {
    const q = (query ?? '').toString().trim()
    if (!q) return Promise.resolve({ results: [] })
    const params = new URLSearchParams({ q, limit: String(limit) })
    return api.get(`${BASE}/autocomplete/?${params}`)
  },

  // ── Modal bootstrap data (service types, case types, next order) ───────────
  modalData: () => api.get(`${BASE}/modal-data/`),

  // ── Case type mappings for a single station ────────────────────────────────
  updateCaseTypes: (stationId, updates) =>
    api.post(`${BASE}/${stationId}/casetype/`, { updates }),

  // ── Service types ──────────────────────────────────────────────────────────
  listServiceTypes: () => api.get(`${BASE}/service-types/`),

  // ── TOC case types ─────────────────────────────────────────────────────────
  listCaseTypes: () => api.get(`${BASE}/case-types/`),
}
