/**
 * Mock data for Address Search Log (read-only audit).
 * Mirrors RevpConfig.addressLog. Fields:
 *   searchType, CreatedDT, Username, userid, TOC_ID
 */
import { tocUsers } from './ticketPadsData.js'
export { tocUsers }

export const addressLogs = [
  { id: 'AL-001', searchType: 'Postcode',  CreatedDT: '2026-05-15T09:14:00', Username: 'a.ansari',  userid: 'USR-001' },
  { id: 'AL-002', searchType: 'Surname',   CreatedDT: '2026-05-15T10:22:00', Username: 's.morris',  userid: 'USR-002' },
  { id: 'AL-003', searchType: 'Postcode',  CreatedDT: '2026-05-14T14:55:00', Username: 'j.patel',   userid: 'USR-003' },
  { id: 'AL-004', searchType: 'Full Match', CreatedDT: '2026-05-14T16:09:00', Username: 'a.ansari', userid: 'USR-001' },
  { id: 'AL-005', searchType: 'DOB',       CreatedDT: '2026-05-13T11:34:00', Username: 'e.taylor',  userid: 'USR-005' },
  { id: 'AL-006', searchType: 'Postcode',  CreatedDT: '2026-05-13T08:48:00', Username: 'd.chen',    userid: 'USR-006' },
  { id: 'AL-007', searchType: 'Surname',   CreatedDT: '2026-05-12T13:20:00', Username: 'r.johnson', userid: 'USR-007' },
  { id: 'AL-008', searchType: 'Postcode',  CreatedDT: '2026-05-12T15:11:00', Username: 'm.brown',   userid: 'USR-008' },
  { id: 'AL-009', searchType: 'Full Match', CreatedDT: '2026-05-11T17:02:00', Username: 's.morris', userid: 'USR-002' },
  { id: 'AL-010', searchType: 'Postcode',  CreatedDT: '2026-05-11T09:30:00', Username: 'k.singh',   userid: 'USR-004' }
]
