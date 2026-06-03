import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardService } from '@/services/dashboard.service.js'

// Holds the four widgets' data. Each fetch is independent — Promise.allSettled
// on mount so a single failing widget doesn't blank the others. The Case Type
// Wise widget refetches when the user toggles its date_type tab, so it owns
// its own loading flag.
export const useDashboardStore = defineStore('dashboard', () => {
  const prosecution     = ref(null)   // { case_types, statuses, total, closed_count }
  const recentCases     = ref(null)   // { total, page, page_size, results }
  const actionSummary   = ref(null)   // { rows: [{status, today, last_week, last_month}] }
  const caseTypeWise    = ref(null)   // { date_type, rows: [...] }

  const initialLoading      = ref(false)
  const caseTypeWiseLoading = ref(false)
  const error               = ref(null)

  async function fetchAll() {
    initialLoading.value = true
    error.value = null
    const [pros, recent, action, ctw] = await Promise.allSettled([
      dashboardService.getProsecutionSummary(),
      dashboardService.getRecentCases({ page: 1, pageSize: 10 }),
      dashboardService.getActionSummary(),
      dashboardService.getCaseTypeWise({ dateType: 'OffenceDate' }),
    ])
    if (pros.status   === 'fulfilled') prosecution.value   = pros.value
    if (recent.status === 'fulfilled') recentCases.value   = recent.value
    if (action.status === 'fulfilled') actionSummary.value = action.value
    if (ctw.status    === 'fulfilled') caseTypeWise.value  = ctw.value
    // Collect the first failure message for the banner — but don't blank
    // out widgets that did load.
    const firstReject = [pros, recent, action, ctw].find(r => r.status === 'rejected')
    if (firstReject) {
      error.value = firstReject.reason?.data?.detail
        || firstReject.reason?.message
        || 'One or more dashboard widgets failed to load.'
    }
    initialLoading.value = false
  }

  async function fetchCaseTypeWise(dateType) {
    caseTypeWiseLoading.value = true
    try {
      caseTypeWise.value = await dashboardService.getCaseTypeWise({ dateType })
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load case-type breakdown.'
    } finally {
      caseTypeWiseLoading.value = false
    }
  }

  async function refreshRecentCases({ page = 1, pageSize = 10 } = {}) {
    try {
      recentCases.value = await dashboardService.getRecentCases({ page, pageSize })
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load recent cases.'
    }
  }

  return {
    prosecution, recentCases, actionSummary, caseTypeWise,
    initialLoading, caseTypeWiseLoading, error,
    fetchAll, fetchCaseTypeWise, refreshRecentCases,
  }
})
