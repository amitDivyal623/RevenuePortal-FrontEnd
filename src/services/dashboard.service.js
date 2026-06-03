import { api } from '@/services/api.js'

// One method per dashboard widget. All read-only. Same field shape that
// the backend selectors return — no client-side renaming, so the store
// can pass payloads straight to the view.
export const dashboardService = {
  getProsecutionSummary: () => api.get('/revp/dashboard/prosecution-summary/'),

  getRecentCases: ({ page = 1, pageSize = 10 } = {}) => {
    const qs = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    return api.get(`/revp/dashboard/recent-cases/?${qs.toString()}`)
  },

  getActionSummary: () => api.get('/revp/dashboard/action-summary/'),

  getCaseTypeWise: ({ dateType = 'OffenceDate' } = {}) => {
    const qs = new URLSearchParams({ date_type: dateType })
    return api.get(`/revp/dashboard/case-type-wise/?${qs.toString()}`)
  },
}
