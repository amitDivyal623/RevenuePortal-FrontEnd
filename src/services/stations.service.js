import { api } from '@/services/api.js'

// All HTTP calls for the /revp/stations/... endpoints. Autocomplete is
// the only public method right now — Add Case binds station_from / to.
// `query` shorter than 1 char short-circuits to an empty result so the
// dropdown doesn't pulse a request on every keystroke before typing.
export const stationsService = {
  autocomplete: (query, limit = 20) => {
    const q = (query ?? '').toString().trim()
    if (!q) return Promise.resolve({ results: [] })
    const params = new URLSearchParams({ q, limit: String(limit) })
    return api.get(`/revp/stations/autocomplete/?${params.toString()}`)
  },
}
