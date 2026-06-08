import { api } from '@/services/api.js'

// All HTTP calls for the /revp/addresses/... endpoints. Wraps the
// upstream postcode-lookup provider — backend throws on bad postcode,
// missing key, quota exhausted, or upstream failure.
export const addressesService = {
  lookup: (postcode) =>
    api.get(`/revp/addresses/lookup/?postcode=${encodeURIComponent(postcode)}`),

  autocomplete: (partial) =>
    api.get(`/revp/addresses/autocomplete/?q=${encodeURIComponent(partial)}`),

  // Addressy/Loqate two-step: find (partial → list) then retrieve (id → full address).
  // Mirrors searchAddressId / searchFullAddressId from address.cfc.
  addressyFind: (q, container = '') =>
    api.get(`/revp/addresses/addressy/find/?q=${encodeURIComponent(q)}&container=${encodeURIComponent(container)}`),

  addressyRetrieve: (id) =>
    api.get(`/revp/addresses/addressy/retrieve/?id=${encodeURIComponent(id)}`),

  // Returns {address_search_reference_id} for one free slot in the tenant pool.
  // 503 when the pool is empty.
  allocateReference: () =>
    api.get('/revp/addresses/search-reference/allocate/'),

  // Returns {address_search_reference_id} for an existing claim on this customer.
  // 404 when no prior claim exists.
  getCustomerReference: (customerId) =>
    api.get(`/revp/addresses/search-reference/customer/${encodeURIComponent(customerId)}/`),

  // Atomically writes revp_address + revp_address_search and marks the
  // reference slot as used.  Returns {address_search_reference_id, address_search_id}.
  claimReference: (payload) =>
    api.post('/revp/addresses/search-reference/claim/', payload),
}
