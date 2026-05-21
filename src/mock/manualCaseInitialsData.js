/**
 * Mock data for Manual Case Initials.
 * Mirrors RevpConfig.manualCaseInitial. Fields:
 *   case_initials_id, case_initials, case_type_ids[] (mapping to multiple case types), active
 */
import { caseTypes } from './ticketPadsData.js'
export { caseTypes }

export const initials = [
  { case_initials_id: 'MCI-001', case_initials: 'UFN/A', case_type_ids: ['CT-UFN'], active: 1 },
  { case_initials_id: 'MCI-002', case_initials: 'UFN/B', case_type_ids: ['CT-UFN', 'CT-PFN'], active: 1 },
  { case_initials_id: 'MCI-003', case_initials: 'PCN-LDN', case_type_ids: ['CT-PCN'], active: 1 },
  { case_initials_id: 'MCI-004', case_initials: 'PF/Q', case_type_ids: ['CT-PF'], active: 0 }
]
