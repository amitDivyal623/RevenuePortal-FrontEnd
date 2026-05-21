/**
 * Mock data for Zero Fare / Printer App Control.
 * Mirrors RevpConfig.appControl / revp_appControl table. Fields:
 *   ID (appCaseTypeid), case_type_id, enabled (0|1), description, case_option
 */
import { caseTypes } from './ticketPadsData.js'
export { caseTypes }

// Zero Fare flags: which case types allow zero-fare creation
export const zeroFareRows = [
  { ID: 'ZF-UFN', case_type_id: 'CT-UFN', description: 'Allow zero-fare UFN creation', case_option: 'Unpaid Fare Notice', enabled: 1 },
  { ID: 'ZF-PFN', case_type_id: 'CT-PFN', description: 'Allow zero-fare PFN creation', case_option: 'Penalty Fare Notice', enabled: 0 },
  { ID: 'ZF-PCN', case_type_id: 'CT-PCN', description: 'Allow zero-fare PCN creation', case_option: 'Penalty Charge Notice', enabled: 0 },
  { ID: 'ZF-PF',  case_type_id: 'CT-PF',  description: 'Allow zero-fare PF creation',  case_option: 'Penalty Fare', enabled: 0 }
]

// Printer App control: which case types support handheld printer issuance
export const printerAppRows = [
  { ID: 'PA-UFN', case_type_id: 'CT-UFN', description: 'Printer app enabled for UFN', case_option: 'Unpaid Fare Notice', enabled: 1 },
  { ID: 'PA-PFN', case_type_id: 'CT-PFN', description: 'Printer app enabled for PFN', case_option: 'Penalty Fare Notice', enabled: 1 },
  { ID: 'PA-PCN', case_type_id: 'CT-PCN', description: 'Printer app enabled for PCN', case_option: 'Penalty Charge Notice', enabled: 0 },
  { ID: 'PA-PF',  case_type_id: 'CT-PF',  description: 'Printer app enabled for PF',  case_option: 'Penalty Fare', enabled: 1 }
]
