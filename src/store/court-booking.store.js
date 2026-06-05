import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courtBookingService } from '@/services/court-booking.service.js'

export const useCourtBookingStore = defineStore('courtBooking', () => {
  const courts      = ref([])
  const bookings    = ref([])
  const prosecutors = ref([])
  const totalRecords = ref(0)
  const loading = ref(false)
  const error   = ref(null)

  async function fetchCourts() {
    try {
      const data = await courtBookingService.getCourts({ page_size: 100 })
      courts.value = Array.isArray(data.results) ? data.results : []
    } catch {
      courts.value = []
    }
  }

  async function fetchProsecutors() {
    try {
      const data = await courtBookingService.getProsecutors()
      prosecutors.value = Array.isArray(data) ? data : []
    } catch {
      prosecutors.value = []
    }
  }

  async function fetchBookings(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const data = await courtBookingService.getBookings(params)
      bookings.value     = data.results ?? []
      totalRecords.value = data.total   ?? 0
    } catch (err) {
      error.value        = 'Failed to load bookings.'
      bookings.value     = []
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

  return {
    courts, bookings, prosecutors, totalRecords, loading, error,
    fetchCourts, fetchProsecutors, fetchBookings,
    createBooking, updateBooking,
  }
})
