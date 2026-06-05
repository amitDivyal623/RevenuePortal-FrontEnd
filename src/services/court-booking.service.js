import { api, apiDownload } from '@/services/api.js'

export const courtBookingService = {
  getCourts:      (params = {}) => api.get(`/revp/courts/?${new URLSearchParams(params)}`),
  getProsecutors: () => api.get('/revp/courts/prosecutors/'),
  getBookings:    (params = {}) => api.get(`/revp/courts/bookings/?${new URLSearchParams(params)}`),
  createBooking:  (payload) => api.post('/revp/courts/bookings/create/', payload),
  getBookingById: (id) => api.get(`/revp/courts/bookings/${encodeURIComponent(id)}/`),
  updateBooking:  (id, payload) => api.put(`/revp/courts/bookings/${encodeURIComponent(id)}/update/`, payload),
  downloadProsecutorDiary(params = {}) {
    const qs = new URLSearchParams()
    if (params.date_from)     qs.set('date_from',     params.date_from)
    if (params.date_to)       qs.set('date_to',       params.date_to)
    if (params.prosecutor_id) qs.set('prosecutor_id', params.prosecutor_id)
    const filename = `prosecutors_diary_${params.date_from}_to_${params.date_to}.pdf`
    return apiDownload(`/revp/courts/bookings/pdf/?${qs}`, filename)
  },
}
