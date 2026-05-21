/**
 * Mock data for the Ticket Pads admin screen.
 *
 * Shapes mirror what the legacy ColdFusion endpoints return so the API swap
 * is a drop-in later:
 *   RevpConfig.ticketPad              → loads page (filters + datatable bootstrap)
 *   RevpConfig.ticketPadModal         → modal HTML (returns caselist, getTocUsers, getPAD_ISSUER)
 *   RevpConfig.GetTicketPadsData      → list of ticket pads (DataTables payload)
 *   RevpConfig.GetEditTicketPadsData  → single ticket pad by id (edit/view)
 *   RevpConfig.SaveTicketPadsData     → insert/update
 *   RevpConfig.caseIssuerCheck        → "does this user already have a pad for this case type?"
 *   RevpConfig.getcaseIssueList       → autocomplete for Issued To (TOC users)
 *
 * Field names match the CF model exactly:
 *   ticket_pad: ticket_pad_id, case_type_id, issuedBy, issuedTo, issuedDate,
 *               startNum, endNum, Totaltickets, Issuedtickets, Firstused,
 *               Lastused, active, CreatedBy, CreatedDT, UpdatedBy, UpdatedDT,
 *               TOC_ID
 *   joined:     code, enteredbyname, issuedbyuser, issuedtouser, FirstName, Surname
 *
 * Legacy quirk preserved: `active = 1` means active, `active = 0` means
 * disabled. The legacy "Disabled" checkbox is CHECKED when fld_disabled == '0'.
 */

// revp_case_type — filtered to only UFN / PF / PCN / PFN per the legacy view
export const caseTypes = [
  { case_type_id: 'CT-UFN', code: 'UFN', case_option: 'Unpaid Fare Notice', app_casetype_code: 'UFN' },
  { case_type_id: 'CT-PFN', code: 'PFN', case_option: 'Penalty Fare Notice', app_casetype_code: 'PFN' },
  { case_type_id: 'CT-PCN', code: 'PCN', case_option: 'Penalty Charge Notice', app_casetype_code: 'PCN' },
  { case_type_id: 'CT-PF',  code: 'PF',  case_option: 'Penalty Fare',          app_casetype_code: 'PF' }
]

// TOCUserService.getRevpUsers(TOC_ID, interface='REVP', orderby='Username')
export const tocUsers = [
  { UserID: 'USR-001', Username: 'a.ansari',    FirstName: 'Asif',    Surname: 'Ansari' },
  { UserID: 'USR-002', Username: 's.morris',    FirstName: 'Sarah',   Surname: 'Morris' },
  { UserID: 'USR-003', Username: 'j.patel',     FirstName: 'Jay',     Surname: 'Patel' },
  { UserID: 'USR-004', Username: 'k.singh',     FirstName: 'Karan',   Surname: 'Singh' },
  { UserID: 'USR-005', Username: 'e.taylor',    FirstName: 'Emma',    Surname: 'Taylor' },
  { UserID: 'USR-006', Username: 'd.chen',      FirstName: 'David',   Surname: 'Chen' },
  { UserID: 'USR-007', Username: 'r.johnson',   FirstName: 'Rachel',  Surname: 'Johnson' },
  { UserID: 'USR-008', Username: 'm.brown',     FirstName: 'Michael', Surname: 'Brown' }
]

// revp_lookup_data — lookupTypeName='PAD_ISSUER'
export const padIssuers = [
  { lookup_data_id: 'PI-RP-AGENT',   lookup_data_value: 'RP Agent' },
  { lookup_data_id: 'PI-RP-ADMIN',   lookup_data_value: 'RP Admin' },
  { lookup_data_id: 'PI-RP-OFFICE',  lookup_data_value: 'RP Office' },
  { lookup_data_id: 'PI-RP-MANAGER', lookup_data_value: 'RP Manager' }
]

// Default-logged-in user (mirrors `session.userid` in legacy view)
export const sessionUserId = 'USR-001'

// revp_ticket_pad — joined output as in GetTicketPadsData
export const ticketPads = [
  {
    ticket_pad_id: 'TP-001',
    case_type_id: 'CT-UFN',
    code: 'UFN',
    issuedBy: 'PI-RP-ADMIN',
    issuedbyuser: 'RP Admin',
    issuedTo: 'USR-002',
    issuedtouser: 's.morris',
    FirstName: 'Sarah',
    Surname: 'Morris',
    issuedDate: '2026-04-12',
    startNum: 10001,
    endNum: 10100,
    Totaltickets: 100,
    Issuedtickets: 42,
    Firstused: '2026-04-13',
    Lastused: '2026-05-10',
    active: 1,
    CreatedBy: 'USR-001',
    enteredbyname: 'a.ansari',
    CreatedDT: '2026-04-12T09:14:00'
  },
  {
    ticket_pad_id: 'TP-002',
    case_type_id: 'CT-PFN',
    code: 'PFN',
    issuedBy: 'PI-RP-AGENT',
    issuedbyuser: 'RP Agent',
    issuedTo: 'USR-003',
    issuedtouser: 'j.patel',
    FirstName: 'Jay',
    Surname: 'Patel',
    issuedDate: '2026-04-22',
    startNum: 20001,
    endNum: 20050,
    Totaltickets: 50,
    Issuedtickets: 18,
    Firstused: '2026-04-23',
    Lastused: '2026-05-09',
    active: 1,
    CreatedBy: 'USR-001',
    enteredbyname: 'a.ansari',
    CreatedDT: '2026-04-22T11:02:00'
  },
  {
    ticket_pad_id: 'TP-003',
    case_type_id: 'CT-PCN',
    code: 'PCN',
    issuedBy: 'PI-RP-OFFICE',
    issuedbyuser: 'RP Office',
    issuedTo: 'USR-004',
    issuedtouser: 'k.singh',
    FirstName: 'Karan',
    Surname: 'Singh',
    issuedDate: '2026-03-15',
    startNum: 30001,
    endNum: 30200,
    Totaltickets: 200,
    Issuedtickets: 200,
    Firstused: '2026-03-16',
    Lastused: '2026-05-02',
    active: 1,
    CreatedBy: 'USR-002',
    enteredbyname: 's.morris',
    CreatedDT: '2026-03-15T14:48:00'
  },
  {
    ticket_pad_id: 'TP-004',
    case_type_id: 'CT-UFN',
    code: 'UFN',
    issuedBy: 'PI-RP-ADMIN',
    issuedbyuser: 'RP Admin',
    issuedTo: 'USR-005',
    issuedtouser: 'e.taylor',
    FirstName: 'Emma',
    Surname: 'Taylor',
    issuedDate: '2026-05-01',
    startNum: 10101,
    endNum: 10200,
    Totaltickets: 100,
    Issuedtickets: 5,
    Firstused: '2026-05-03',
    Lastused: '2026-05-15',
    active: 1,
    CreatedBy: 'USR-001',
    enteredbyname: 'a.ansari',
    CreatedDT: '2026-05-01T08:30:00'
  },
  {
    ticket_pad_id: 'TP-005',
    case_type_id: 'CT-PF',
    code: 'PF',
    issuedBy: 'PI-RP-MANAGER',
    issuedbyuser: 'RP Manager',
    issuedTo: 'USR-006',
    issuedtouser: 'd.chen',
    FirstName: 'David',
    Surname: 'Chen',
    issuedDate: '2026-02-08',
    startNum: 40001,
    endNum: 40050,
    Totaltickets: 50,
    Issuedtickets: 0,
    Firstused: null,
    Lastused: null,
    active: 0,
    CreatedBy: 'USR-001',
    enteredbyname: 'a.ansari',
    CreatedDT: '2026-02-08T16:20:00'
  },
  {
    ticket_pad_id: 'TP-006',
    case_type_id: 'CT-PFN',
    code: 'PFN',
    issuedBy: 'PI-RP-AGENT',
    issuedbyuser: 'RP Agent',
    issuedTo: 'USR-007',
    issuedtouser: 'r.johnson',
    FirstName: 'Rachel',
    Surname: 'Johnson',
    issuedDate: '2026-05-09',
    startNum: 20051,
    endNum: 20150,
    Totaltickets: 100,
    Issuedtickets: 2,
    Firstused: '2026-05-10',
    Lastused: '2026-05-14',
    active: 1,
    CreatedBy: 'USR-002',
    enteredbyname: 's.morris',
    CreatedDT: '2026-05-09T10:15:00'
  }
]
