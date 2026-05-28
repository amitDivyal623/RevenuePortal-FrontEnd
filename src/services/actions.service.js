import { api } from '@/services/api.js'

// All HTTP calls for the /revp/actions/... endpoints. Actions are the
// "what happens next on this case" rows from the legacy action tracker.
export const actionsService = {
  listByCase: (caseId, { pageSize = 100 } = {}) => {
    const params = new URLSearchParams({
      case_id:   caseId,
      page_size: String(pageSize),
    })
    return api.get(`/revp/actions/?${params.toString()}`)
  },
}
