import { api } from '@/services/api.js'

// All HTTP calls for the /revp/cases/case-appeals|appeal-save|appeal-reopen endpoints.
export const appealsService = {
  // Fetch all appeal rows for a case (ordered by appeal_date ascending).
  listByCase: (caseId) =>
    api.get(`/revp/cases/case-appeals/?case_id=${encodeURIComponent(caseId)}`),

  // Create a new appeal (appeal_action='Start Appeal') or record a decision
  // on an existing appeal (Decline / Accept).
  // payload: { case_id, appeal_action, appeal_date, decision_reason?,
  //            appeal_id_for_action?, case_status_id? }
  save: (payload) => api.post('/revp/cases/appeal-save/', payload),

  // Reopen a declined appeal — clears decline fields and restores 'Under Appeal'.
  // payload: { case_id, appeal_id, reopen_date, reopen_desc }
  reopen: (payload) => api.post('/revp/cases/appeal-reopen/', payload),
}
