import { api } from '@/services/api.js'

// Thin HTTP transport for the /revp/filters/ endpoints.
// No state, no loading flags — the filterPresets store owns those.
export const filterPresetsService = {
  // GET /api/revp/filters/?section=<section>
  // Returns { personal: [...], team: [...] }
  list: (section = 'case_list') =>
    api.get(`/revp/filters/?section=${encodeURIComponent(section)}`),

  // GET /api/revp/filters/chips/?section=<section>
  // Returns { results: [...] } — up to 3 recently used presets
  listChips: (section = 'case_list') =>
    api.get(`/revp/filters/chips/?section=${encodeURIComponent(section)}`),

  // POST /api/revp/filters/
  // Returns the created preset dict on 201, or { exists: true } on 200 (duplicate name)
  create: (payload) => api.post('/revp/filters/', payload),

  // PUT /api/revp/filters/<id>/
  // payload: { filter_name?, json_field? } — at least one required
  // Returns updated preset dict on 200, or { exists: true } on 200 (duplicate name on rename)
  update: (id, payload) =>
    api.put(`/revp/filters/${encodeURIComponent(id)}/`, payload),

  // DELETE /api/revp/filters/<id>/
  // Soft-delete. Returns { detail: 'deleted' }
  remove: (id) =>
    api.delete(`/revp/filters/${encodeURIComponent(id)}/`),

  // POST /api/revp/filters/<id>/use/
  // Stamps last_used_at, which drives chip ordering. Returns { id, last_used_at }
  recordUse: (id) =>
    api.post(`/revp/filters/${encodeURIComponent(id)}/use/`, {}),
}
