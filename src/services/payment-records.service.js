import { api } from '@/services/api.js'

const BASE = import.meta.env.VITE_API_BASE || '/api'

export const paymentRecordsService = {
  /**
   * GET /api/revp/payments/payment-list/
   * Returns paginated Realex gateway records for the Payment Records page.
   */
  getList: (params = {}) =>
    api.get(`/revp/payments/payment-list/?${new URLSearchParams(params)}`),

  /**
   * GET /api/revp/payments/export-payments/
   * Returns a binary .xlsx file — cannot go through api.js (which only handles JSON).
   * Auth token is injected manually using the same lazy-import pattern as api.js.
   * Triggers a browser download directly.
   */
  async exportToExcel(params = {}) {
    // Lazy import to avoid circular dependency (same pattern as api.js loadAuth)
    const { useAuthStore } = await import('@/store/auth.js')
    const token = useAuthStore().accessToken

    const qs = new URLSearchParams(params).toString()
    const url = `${BASE}/revp/payments/export-payments/${qs ? '?' + qs : ''}`

    const resp = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!resp.ok) {
      throw new Error(`Export failed (${resp.status})`)
    }

    const blob = await resp.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'payment_records.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  },
}
