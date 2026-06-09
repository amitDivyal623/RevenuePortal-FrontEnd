import { api, apiPostBlob } from '@/services/api.js'

// HTTP calls for the /api/revp/printqueue/... endpoints. The Print Queue
// is the per-tenant worklist of revp_print rows queued by Action Tracker's
// CREATE LETTER button. Listing + lookups + render-merged.
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

  // Render selected letters as a single merged PDF.
  // Resolves to: { blob, failed } where `failed` is the parsed
  // X-Render-Failed header (null when all rendered cleanly).
  viewMerged: (printIds) =>
    apiPostBlob('/revp/printqueue/view-merged/', { print_ids: printIds }),

  // Flip selected rows' letter_status to PRINTED.
  // After this resolves, the rows fall out of the default IN_PRINT_QUEUE
  // filter and disappear from the queue on next refresh.
  // Response: { marked: <int>, skipped: [{print_id, reason}, ...] }
  markPrinted: (printIds) =>
    api.post('/revp/printqueue/mark-printed/', { print_ids: printIds }),

  // PRINT SELECTED full pipeline — renders, saves per-letter PDFs as
  // case attachments, flips status to PRINTED, then returns the merged
  // PDF as a Blob for download. One backend call, one render pass.
  // Resolves to { blob, failed } same shape as viewMerged.
  finalizePrint: (printIds) =>
    apiPostBlob('/revp/printqueue/finalize-print/', { print_ids: printIds }),
}
