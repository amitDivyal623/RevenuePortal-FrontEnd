import { api } from '@/services/api.js'

// All HTTP calls for the /revp/addresses/... endpoints. Wraps the
// upstream postcode-lookup provider — backend throws on bad postcode,
// missing key, quota exhausted, or upstream failure.
export const addressesService = {
  lookup: (postcode) =>
    api.get(`/revp/addresses/lookup/?postcode=${encodeURIComponent(postcode)}`),
}
