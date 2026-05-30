import { api } from '@/services/api.js'

// All HTTP calls for the /revp/journey/... endpoints. A journey row is
// tied 1-to-1 to a case via revp_case.journey_id (set after the journey
// row is created — the Add Case flow back-fills it).
export const journeyService = {
  create: (payload) => api.post('/revp/journey/create/', payload),
  get:    (id)      => api.get(`/revp/journey/${encodeURIComponent(id)}/`),
}
