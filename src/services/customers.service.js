import { api } from '@/services/api.js'

// All HTTP calls for the /customers/... endpoints. Customer description
// (revp_customer_desc) is a one-to-many sub-record — backend creates a new
// row every POST; GET returns the most recent.
export const customersService = {
  search: ({
    firstName, middleName, lastName,
    postcode, address1, address2, town,
  } = {}) => {
    const params = new URLSearchParams()
    const add = (k, v) => {
      const s = (v ?? '').toString().trim()
      if (s) params.set(k, s)
    }
    add('first_name',  firstName)
    add('middle_name', middleName)
    add('last_name',   lastName)
    add('postcode',    postcode)
    add('address1',    address1)
    add('address2',    address2)
    add('town',        town)
    const qs = params.toString()
    return api.get(`/customers/search/${qs ? '?' + qs : ''}`)
  },

  create: (payload) => api.post('/customers/create/', payload),
  get:    (id)      => api.get(`/customers/${encodeURIComponent(id)}/`),

  createDescription: (id, payload) =>
    api.post(`/customers/${encodeURIComponent(id)}/description/`, payload),
  getDescription:    (id) =>
    api.get(`/customers/${encodeURIComponent(id)}/description/`),
}
