import { defineStore } from 'pinia'
import { ref } from 'vue'
import { intelReportService } from '@/services/intel-report.service.js'

// Owns the IR listing page state. Refetches on every fetchReports() call —
// the view drives this on mount, on filter SEARCH, on pagination change,
// and on sort-header click. There's no client-side filtering / sorting;
// everything goes to the server so the backend can use its indexes.
export const useIntelReportStore = defineStore('intelReport', () => {
  const reports = ref([])
  const total   = ref(0)
  const loading = ref(false)
  const error   = ref(null)

  // For the "VIEW" modal — populated lazily by fetchOne(); the list rows
  // already carry enough columns for the table so we only hit /<id>/
  // when the user actually clicks VIEW.
  const current = ref(null)
  const currentLoading = ref(false)

  async function fetchReports(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const resp = await intelReportService.list(filters)
      reports.value = resp.data ?? []
      // Backend returns DataTables-shaped keys; either of these will be the
      // total count.
      total.value = resp.recordsTotal ?? resp.iTotalDisplayRecords ?? 0
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load intelligence reports.'
      reports.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(reportId) {
    currentLoading.value = true
    error.value = null
    try {
      current.value = await intelReportService.get(reportId)
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load report.'
      current.value = null
    } finally {
      currentLoading.value = false
    }
  }

  return {
    reports, total, loading, error,
    current, currentLoading,
    fetchReports, fetchOne,
  }
})
