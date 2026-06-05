import { api } from '@/services/api.js'

// HTTP calls for the /api/revp/printqueue/... endpoints. The Print Queue
// is the per-tenant worklist of revp_print rows queued by Action Tracker's
// CREATE LETTER button. Listing + lookups land in this file; the actual
// PDF rendering pipeline (PRINT SELECTED / VIEW SELECTED) is Phase 4B.
export const printQueueService = {
  list: ({
    page = 1,
    pageSize = 25,
    ordering = '-created_dt',
    dateFrom,
    dateTo,
    printedFrom,
    printedTo,
    caseNum,
    documentType,
    agent,
    letterStatusIds,
  } = {}) => {
    const p = new URLSearchParams({
      page:      String(page),
      page_size: String(pageSize),
      ordering,
    })
    if (dateFrom)     p.set('date_from',     dateFrom)
    if (dateTo)       p.set('date_to',       dateTo)
    if (printedFrom)  p.set('printed_from',  printedFrom)
    if (printedTo)    p.set('printed_to',    printedTo)
    if (caseNum)      p.set('case_num',      caseNum)
    if (documentType) p.set('document_type', documentType)
    if (agent)        p.set('agent',         agent)
    if (letterStatusIds && letterStatusIds.length) {
      p.set('letter_status', letterStatusIds.join(','))
    }
    return api.get(`/revp/printqueue/?${p.toString()}`)
  },

  // Reference data for the filter row.
  // Returns: { letter_statuses: [...], document_types: [...], agents: [...] }
  lookups: () => api.get('/revp/printqueue/lookups/'),
}
