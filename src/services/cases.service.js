import { api } from '@/services/api.js'

// All HTTP calls for the /revp/cases/... endpoints. Pure transport —
// no state, no loading flags. Stores own state; views read from stores.
// One method per backend endpoint, named verb-first so call sites read
// naturally: casesService.getAll(filters), casesService.createNote(id, text).
export const casesService = {
  // ── Reference data ────────────────────────────────────────────────────────
  listTypes:    ({ activeOnly = true } = {}) =>
    api.get(`/revp/cases/case-types/${activeOnly ? '' : '?active=false'}`),
  listStatuses: () => api.get('/revp/cases/statuses/'),
  listIssuers:  ({ search } = {}) =>
    api.get(`/revp/cases/issuers/${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // ── Cases collection ──────────────────────────────────────────────────────
  getAll:      (filters = {}) => api.get(`/revp/cases/?${_buildListParams(filters)}`),
  create:      (payload)      => api.post('/revp/cases/create/', payload),
  quickSearch: ({ term = '', page = 1, pageSize = 25 } = {}) => {
    const params = new URLSearchParams()
    params.set('page',      String(page))
    params.set('page_size', String(pageSize))
    const t = (term ?? '').toString().trim()
    if (t) params.set('q', t)
    return api.get(`/revp/cases/quick-search/?${params.toString()}`)
  },

  // ── Single case ───────────────────────────────────────────────────────────
  get:    (id) => api.get(`/revp/cases/${encodeURIComponent(id)}/`),
  update: (id, payload) => api.put(`/revp/cases/${encodeURIComponent(id)}/`, payload),

  // ── Verification (= revp_case_verification) ──────────────────────────────
  getVerification:    (id)          => api.get(`/revp/cases/${encodeURIComponent(id)}/verification/`),
  createVerification: (id, payload) => api.post(`/revp/cases/${encodeURIComponent(id)}/verification/`, payload),

  // ── Audit / offences / notes ──────────────────────────────────────────────
  listAudit:    (id)               => api.get(`/revp/cases/${encodeURIComponent(id)}/audit/`),
  listOffences: (id)               => api.get(`/revp/cases/${encodeURIComponent(id)}/offences/`),
  listNotes:    (id)               => api.get(`/revp/cases/${encodeURIComponent(id)}/notes/`),
  createNote:   (id, description)  =>
    api.post(`/revp/cases/${encodeURIComponent(id)}/notes/`, { description }),

  // ── Linked cases (revp_linked) ────────────────────────────────────────────
  listLinked:      (id) => api.get(`/revp/cases/${encodeURIComponent(id)}/linked/`),
  listLinkable:    (id) => api.get(`/revp/cases/${encodeURIComponent(id)}/linkable/`),
  link:            (id, linkedCaseId) =>
    api.post(`/revp/cases/${encodeURIComponent(id)}/linked/`, { linked_case_id: linkedCaseId }),
  unlink:          (id, linkedId) =>
    api.delete(`/revp/cases/${encodeURIComponent(id)}/linked/${encodeURIComponent(linkedId)}/`),
  getLinkedDetail: (id) => api.get(`/revp/cases/${encodeURIComponent(id)}/linked-detail/`),

  // ── Purge by reference (admin — irreversible hard-delete) ────────────────
  removeByRef: (caseRefNo) =>
    api.delete(`/revp/cases/by-ref/${encodeURIComponent(caseRefNo)}/remove/`),

  // ── Attachments (revp_attachment) ─────────────────────────────────────────
  listAttachments:  (id)       => api.get(`/revp/cases/${encodeURIComponent(id)}/attachments/`),
  uploadAttachment: (id, file) => {
    const fd = new FormData()
    fd.append('file', file, file.name)
    return api.upload(`/revp/cases/${encodeURIComponent(id)}/attachments/`, fd)
  },
}

// Private helper — turns the filter args object into the query string the
// /revp/cases/ endpoint validates against. Keeping this here (not in the
// store) so views can call casesService.getAll() in one-off cases without
// having to go through the store.
function _buildListParams(filters) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    offenderName = '',
    status = '',
    caseType = '',
    courtId = '',
    courtBookingId = '',
    closureReason = '',
    addedBy = '',
    contact = '',
    dateFrom = '',
    dateTo = '',
    dateSearchBy = 'case_dt',
    ordering = '-case_dt',
  } = filters
  const params = new URLSearchParams()
  params.set('page',      String(page))
  params.set('page_size', String(pageSize))
  if (ordering)     params.set('ordering',       ordering)
  if (dateSearchBy) params.set('date_search_by', dateSearchBy)
  const add = (k, v) => {
    const s = (v ?? '').toString().trim()
    if (s) params.set(k, s)
  }
  add('search',           search)
  add('offender_name',    offenderName)
  add('status',           status)
  add('case_type',        caseType)
  add('court_id',         courtId)
  add('court_booking_id', courtBookingId)
  add('closure_reason',   closureReason)
  add('added_by',         addedBy)
  add('contact',          contact)
  add('date_from',        dateFrom)
  add('date_to',          dateTo)
  return params.toString()
}
