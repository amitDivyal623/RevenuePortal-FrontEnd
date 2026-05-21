/**
 * Mock data for Letter Templates.
 * Mirrors RevpConfig.lettertemplate. Fields:
 *   letter_template_id, title, description, filename, filelocation, filesize,
 *   admincost, pcnNoticeToOwner, pcnChargeCertificate, active,
 *   case_type_ids[] (mapping rows in legacy), CreatedDT, CreatedBy, enteredbyname
 */
import { caseTypes } from './ticketPadsData.js'
import { tocUsers } from './ticketPadsData.js'
export { caseTypes, tocUsers }

export const letterTemplates = [
  { letter_template_id: 'LT-001', title: 'UFN — Initial demand', description: 'Standard demand letter for unpaid fares (first attempt)', filename: 'ufn-initial.pdf', filelocation: 's3://templates/ufn-initial.pdf', filesize: 184320, admincost: '5.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, case_type_ids: ['CT-UFN'], CreatedDT: '2026-01-12T10:14:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { letter_template_id: 'LT-002', title: 'UFN — Reminder',        description: 'Second reminder letter for unpaid fares', filename: 'ufn-reminder.pdf', filelocation: 's3://templates/ufn-reminder.pdf', filesize: 192040, admincost: '10.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, case_type_ids: ['CT-UFN'], CreatedDT: '2026-01-12T10:20:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { letter_template_id: 'LT-003', title: 'PFN — Final reminder',  description: 'Final reminder for penalty fare notices', filename: 'pfn-final.pdf', filelocation: 's3://templates/pfn-final.pdf', filesize: 178522, admincost: '10.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 1, case_type_ids: ['CT-PFN'], CreatedDT: '2026-02-03T11:00:00', CreatedBy: 'USR-002', enteredbyname: 's.morris' },
  { letter_template_id: 'LT-004', title: 'PCN — Notice to Owner', description: 'PCN Notice to Owner with applicable charges', filename: 'pcn-nto.pdf', filelocation: 's3://templates/pcn-nto.pdf', filesize: 210432, admincost: '15.00', pcnNoticeToOwner: '70.00', pcnChargeCertificate: '0.00', active: 1, case_type_ids: ['CT-PCN'], CreatedDT: '2026-02-14T09:30:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { letter_template_id: 'LT-005', title: 'PCN — Charge Certificate', description: 'PCN charge certificate after NTO expiry', filename: 'pcn-cc.pdf', filelocation: 's3://templates/pcn-cc.pdf', filesize: 198001, admincost: '0.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '60.00', active: 1, case_type_ids: ['CT-PCN'], CreatedDT: '2026-02-14T09:45:00', CreatedBy: 'USR-001', enteredbyname: 'a.ansari' },
  { letter_template_id: 'LT-006', title: 'Court cover letter',   description: 'Cover letter for Magistrate court summons', filename: 'court-cover.pdf', filelocation: 's3://templates/court-cover.pdf', filesize: 156211, admincost: '25.00', pcnNoticeToOwner: '0.00', pcnChargeCertificate: '0.00', active: 0, case_type_ids: ['CT-UFN', 'CT-PFN'], CreatedDT: '2026-03-01T15:12:00', CreatedBy: 'USR-002', enteredbyname: 's.morris' }
]
