/**
 * Mock data for Email Templates.
 * Mirrors RevpConfig.emailtemplate. Fields:
 *   email_template_id, tocEmailTemplate_id, title, description, adminCost,
 *   pcnNoticeToOwner, pcnChargeCertificate, active, letter_template_id (backup),
 *   case_type_ids[]
 */
import { caseTypes, tocUsers } from './ticketPadsData.js'
import { letterTemplates } from './letterTemplatesData.js'
export { caseTypes, tocUsers, letterTemplates }

export const communicationAutomationEnabled = true

// Mock list of "Set Email Templates" used by the parent automation engine
export const tocEmailTemplates = [
  { tocEmailTemplate_id: 'TOCEMAIL-001', name: 'Generic Outbound (TOC default)' },
  { tocEmailTemplate_id: 'TOCEMAIL-002', name: 'Branded HTML wrapper' },
  { tocEmailTemplate_id: 'TOCEMAIL-003', name: 'Plain text fallback' }
]

export const emailTemplates = [
  { email_template_id: 'EM-001', tocEmailTemplate_id: 'TOCEMAIL-002', title: 'UFN — Initial demand (email)', description: 'Email version of initial UFN demand', adminCost: '5.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, letter_template_id: 'LT-001', case_type_ids: ['CT-UFN'], CreatedDT: '2026-01-12T11:00:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { email_template_id: 'EM-002', tocEmailTemplate_id: 'TOCEMAIL-002', title: 'UFN — Reminder (email)', description: 'Second reminder via email', adminCost: '10.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, letter_template_id: 'LT-002', case_type_ids: ['CT-UFN'], CreatedDT: '2026-01-12T11:05:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { email_template_id: 'EM-003', tocEmailTemplate_id: 'TOCEMAIL-001', title: 'Court summons confirmation', description: 'Confirms court summons has been issued', adminCost: '0.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, letter_template_id: '', case_type_ids: ['CT-UFN', 'CT-PFN'], CreatedDT: '2026-02-08T14:22:00', CreatedBy: 'USR-002', enteredbyname: 's.morris' },
  { email_template_id: 'EM-004', tocEmailTemplate_id: 'TOCEMAIL-002', title: 'Settlement confirmation', description: 'Payment received — settlement reached', adminCost: '0.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 0, letter_template_id: '', case_type_ids: ['CT-UFN', 'CT-PFN', 'CT-PCN'], CreatedDT: '2026-03-15T09:10:00', CreatedBy: 'USR-002', enteredbyname: 's.morris' }
]
