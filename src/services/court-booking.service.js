import { api } from '@/services/api.js'

export const courtBookingService = {
  getCourts: (params = {}) => api.get(`/v1/courts/?${new URLSearchParams(params)}`),
  getBookings: (params = {}) => api.get(`/v1/court-bookings/?${new URLSearchParams(params)}`),
  createBooking: (payload) => api.post('/v1/court-bookings/', payload),
  updateBooking: (id, payload) => api.put(`/v1/court-bookings/${id}/`, payload),
  deleteBooking: (id) => api.delete(`/v1/court-bookings/${id}/`),
}
