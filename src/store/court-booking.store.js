import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courtBookingService } from '@/services/court-booking.service.js'

export const useCourtBookingStore = defineStore('courtBooking', () => {
  const courts = ref([])
  const bookings = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error = ref(null)

  async function fetchCourts() {
    try {
      const data = await courtBookingService.getCourts({ page_size: 200 })
      courts.value = Array.isArray(data.results) && data.results.length
        ? data.results
        : [{ court_id: 'fallback-0', name: 'Barkingside' }]
    } catch {
      courts.value = [{ court_id: 'fallback-0', name: 'Barkingside' }]
    }
  }

  async function fetchBookings(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await courtBookingService.getBookings(params)
      bookings.value = data.results ?? []
      totalRecords.value = data.total ?? 0
    } catch (err) {
      error.value = 'Failed to load bookings.'
      bookings.value = []
      totalRecords.value = 0
    } finally {
      loading.value = false
    }
  }

  async function createBooking(payload) {
    return courtBookingService.createBooking(payload)
  }

  async function updateBooking(id, payload) {
    return courtBookingService.updateBooking(id, payload)
  }

  async function removeBooking(id) {
    return courtBookingService.deleteBooking(id)
  }

  return {
    courts, bookings, totalRecords, loading, error,
    fetchCourts, fetchBookings, createBooking, updateBooking, removeBooking,
  }
})
