import { api } from '@/services/api.js'

export const courtBookingService = {
  getCourts:      (params = {}) => api.get(`/revp/courts/?${new URLSearchParams(params)}`),
  getProsecutors: () => api.get('/revp/courts/prosecutors/'),
  getBookings:    (params = {}) => api.get(`/revp/courts/bookings/?${new URLSearchParams(params)}`),
  createBooking:  (payload) => api.post('/revp/courts/bookings/create/', payload),
  getBookingById: (id) => api.get(`/revp/courts/bookings/${encodeURIComponent(id)}/`),
  updateBooking:  (id, payload) => api.put(`/revp/courts/bookings/${encodeURIComponent(id)}/update/`, payload),
}
