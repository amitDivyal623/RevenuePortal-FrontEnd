import { api } from '@/services/api.js'

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
    if (params.casetype_no)   q.set('casetype_no',   params.casetype_no)
    if (params.not_entry)     q.set('not_entry',     params.not_entry)
    if (params.ordering)      q.set('ordering',      params.ordering)
    return api.get(`${BASE}/datatable/?${q}`)
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  create: (payload) => api.post(`${BASE}/create/`, payload),

  // ── Detail ─────────────────────────────────────────────────────────────────
  get: (stationId) => api.get(`${BASE}/${stationId}/`),

  // ── Update ─────────────────────────────────────────────────────────────────
  update: (stationId, payload) => api.put(`${BASE}/${stationId}/`, payload),

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

  // ── Case type mappings for a single station ───────────────────────────────
  updateCaseTypes: (stationId, updates) =>
    api.post(`${BASE}/${stationId}/casetype/`, { updates }),

  // ── Service type assignment for a station ─────────────────────────────────
  assignServiceType: (stationId, serviceTypeId) =>
    api.post(`${BASE}/${stationId}/service-type/`, { service_type_id: serviceTypeId }),

  removeServiceType: (stationId) =>
    api.delete(`${BASE}/${stationId}/service-type/`),

  // ── Column order / visibility preferences ─────────────────────────────────
  getColumnOrder: () => api.get(`${BASE}/column-order/`),

  saveColumnOrder: (columnOrder, columnVisibility) =>
    api.post(`${BASE}/column-order/`, {
      station_column_order: columnOrder,
      station_column_visibility: columnVisibility ?? null,
    }),
}
