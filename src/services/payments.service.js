import { api } from '@/services/api.js'

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
    return api.get(`/revp/payments/?${params.toString()}`)
  },
}
