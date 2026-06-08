import { api, apiDownload } from '@/services/api.js'

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

  // Action Tracker grid — cross-case worklist with the legacy filter set.
  // Backend: GET /api/revp/actions/tracker/. See action_tracker_view.
  tracker: ({
    page = 1,
    pageSize = 25,
    ordering = '-case__case_dt',
    status,          // csv of action_status_id
    caseType,        // csv of case_type_id
    caseStatus,      // csv of case_status_id
    holder,
    owner,
    actionName,      // partial match on revp_actions.actionName
    caseNum,
    court,
    addby,
    correspondence,  // 'email' | 'letter'
    dateFrom,
    dateTo,
    actionClosed = false,
  } = {}) => {
    const p = new URLSearchParams({
      page:      String(page),
      page_size: String(pageSize),
      ordering,
    })
    if (status)         p.set('status',         status)
    if (caseType)       p.set('case_type',      caseType)
    if (caseStatus)     p.set('case_status',    caseStatus)
    if (holder)         p.set('holder',         holder)
    if (owner)          p.set('owner',          owner)
    if (actionName)     p.set('action_name',    actionName)
    if (caseNum)        p.set('case_num',       caseNum)
    if (court)          p.set('court',          court)
    if (addby)          p.set('addby',          addby)
    if (correspondence) p.set('correspondence', correspondence)
    if (dateFrom)       p.set('date_from',      dateFrom)
    if (dateTo)         p.set('date_to',        dateTo)
    if (actionClosed)   p.set('action_closed',  'true')
    return api.get(`/revp/actions/tracker/?${p.toString()}`)
  },

  statuses: () => api.get('/revp/actions/statuses/'),

  // CLOSE & ACTION (bulk) — flip selected actions to CLOSED and unlock
  // successors via predecessor cascade. Backend response:
  //   { closed: <int>, unlocked: <int>, skipped: [{action_id, reason}, ...] }
  closeAndAction: (actionIds) =>
    api.post('/revp/actions/close-and-action/', { action_ids: actionIds }),

  // Create a new action against a case.
  // Required: case_id. Optional: title, holder, owner, action_status_id,
  //           action_due_dt (ISO datetime), notes, instruction, action_template_id.
  create: (payload) => api.post('/revp/actions/create/', payload),

  // Partial update of an existing action.
  // Allowed fields: title, description, holder, owner, action_status_id,
  //                 action_closed, action_closed_dt, actioned_dt, notes, instruction.
  update: (actionId, payload) => api.put(`/revp/actions/${actionId}/update/`, payload),

  // Holder/Owner options for action modals — returns ACTION_ROLE lookup values.
  modalOptions: () => api.get('/revp/actions/templates/modal-options/'),

  // Path string for the address-label PDF endpoint. Use with apiDownload
  // so the auth header is carried (browser nav strips it).
  printLabelPath: '/revp/actions/print-label/',

  // CREATE LETTER (bulk) — queues the chosen template against selected cases.
  // Response: { created: <int>, skipped: [...], comm_ids: [...] }
  createLetter: ({ caseIds, letterTemplateId, copies = 1, language = 'English' } = {}) =>
    api.post('/revp/actions/create-letter/', {
      case_ids:           caseIds,
      letter_template_id: letterTemplateId,
      copies,
      language,
    }),

  // Letter templates for the dropdown. Returns the active list for the tenant.
  letterTemplates: () => api.get('/revp/templates/letters/?active=1'),

  // ASSIGN COURT BOOKINGS — picker options for selected cases.
  // Returns [{court_id, court_name, cases: [{case_id, case_num}], bookings: [...]}, ...]
  courtBookingOptions: (caseIds) =>
    api.get(`/revp/actions/court-booking-options/?case_ids=${encodeURIComponent(caseIds.join(','))}`),

  // Export all actions for a case as CSV. Uses apiDownload so the Bearer
  // token is carried; browser nav strips auth headers.
  exportByCase: (caseId) => {
    const params = new URLSearchParams({ case_id: caseId })
    return apiDownload(`/revp/actions/export/?${params.toString()}`, `actions-${caseId}.csv`)
  },

  // ASSIGN COURT BOOKINGS — write back court_booking_id per case.
  // Body: { assignments: [{ case_id, court_booking_id }, ...] }
  assignCourtBookings: (assignments) =>
    api.post('/revp/actions/court-booking-assign/', { assignments }),
}
