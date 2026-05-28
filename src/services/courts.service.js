import { api } from '@/services/api.js'

// All HTTP calls for the /revp/courts/... endpoints. Bookings are a
// separate resource hung off the same root (/revp/courts/bookings/) —
// kept under one service because the Court Booking screen + case detail
// both need to query courts and bookings together.
export const courtsService = {
  // Courts collection
  getAll: () => api.get('/revp/courts/'),
  get:    (id) => api.get(`/revp/courts/${encodeURIComponent(id)}/`),

  // Bookings collection
  listBookings: () => api.get('/revp/courts/bookings/'),
  getBooking:   (id) => api.get(`/revp/courts/bookings/${encodeURIComponent(id)}/`),
}
