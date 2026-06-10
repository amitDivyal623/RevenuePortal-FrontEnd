import { api, apiDownload } from '@/services/api.js'

// All HTTP calls for the /revp/payments/... endpoints. `payment_deleted`
// defaults to false so the standard list call hides soft-deleted rows —
// callers asking for the full audit set must pass includeDeleted=true.
export const paymentsService = {
  listByCase: (caseId, { pageSize = 100, includeDeleted = false } = {}) => {
    const params = new URLSearchParams({
      case_id:   caseId,
      page_size: String(pageSize),
    })
    if (!includeDeleted) params.set('payment_deleted', 'false')
    return api.get(`/revp/payments/case-payment-list/?${params.toString()}`)
  },

  // Create or update a payment and recalculate case.amount_paid / amount_due.
  // payload: { case_id, paid_on (YYYY-MM-DD), amt_paid, refund (0|1),
  //            payment_id? (omit for new), pay_type?, pay_method?, pay_ref? }
  // Returns: { amount_paid, amount_due }
  save: (payload) => api.post('/revp/payments/save/', payload),

  // Soft-delete one or more payments and recalculate case.amount_paid.
  // payload: { case_id, payment_ids: string[] }
  // Returns: { amount_paid }
  bulkDelete: (payload) => api.post('/revp/payments/bulk-delete/', payload),

  // Download all active payments for a case as a formatted .xlsx file.
  exportByCase: (caseId) => {
    const today = new Date().toISOString().slice(0, 10)
    return apiDownload(
      `/revp/payments/export-case-payments/?case_id=${encodeURIComponent(caseId)}`,
      `payments_${caseId.slice(0, 8)}_${today}.xlsx`,
    )
  },
}
