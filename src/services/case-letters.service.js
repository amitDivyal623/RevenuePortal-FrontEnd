import { api } from '@/services/api.js'

// HTTP calls for the Letters tab on Case Details.
// All endpoints live under /api/revp/cases/{case_id}/letters/... so the
// data is implicitly tenant-scoped via the existing case-tenancy check.
export const caseLettersService = {
  // List letters queued / printed for a case.
  // Response: [{ comm_id, letter_template_id, letter_template_title,
  //              letter_status_id, letter_status_name, copies, printed,
  //              printed_dt, created_dt, updated_dt, created_by_name, ... }, ...]
  list: (caseId) =>
    api.get(`/revp/cases/${encodeURIComponent(caseId)}/letters/`),

  // Edit a queued letter — change template or copies. Refused by the
  // server if the letter is already PRINTED.
  update: (caseId, commId, { letterTemplateId, copies } = {}) => {
    const body = {}
    if (letterTemplateId != null) body.letter_template_id = letterTemplateId
    if (copies != null)           body.copies             = copies
    return api.put(
      `/revp/cases/${encodeURIComponent(caseId)}/letters/${encodeURIComponent(commId)}/`,
      body,
    )
  },

  // Manually flip the letter's status. Accepts a status NAME, not id —
  // e.g. 'IN_PRINT_QUEUE', 'PRINTED', 'CANCELLED'.
  changeStatus: (caseId, commId, newStatusName) =>
    api.post(
      `/revp/cases/${encodeURIComponent(caseId)}/letters/${encodeURIComponent(commId)}/status/`,
      { new_status_name: newStatusName },
    ),
}
