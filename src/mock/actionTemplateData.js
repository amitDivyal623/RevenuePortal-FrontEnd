/**
 * Mock data for the Action Template screen.
 *
 * Shapes mirror what the legacy ColdFusion endpoints return so the API swap
 * is a drop-in later:
 *   RevpConfig.actiontemplate         → caseTypes / holderOwnerLookup / actionTypes
 *   RevpConfig.getAction              → list of action templates (DataTables payload)
 *   RevpConfig.getEditAction          → [actionTemplateRow, attachmentRows]
 *   RevpConfig.getPredecessor         → predecessors filtered by case_type_id
 *   RevpConfig.setAction              → save
 *   RevpConfig.deleteAction           → soft-delete (active = 0)
 *
 * Field names match the CF model exactly: action_template_id, case_type_id,
 * predecessor, workFromDate, days_offset, name, instruction, holder, owner,
 * pcnNoticeToOwner, pcnChargeCertificate, adminCost, action_type,
 * EmailTemplate, LetterTemplate, active.
 */

// revp_tocVarConfig.value where variableName='RevPCommunicationAutomation'
export const communicationAutomationEnabled = true

// revp_case_type — list(TOC_ID=..., status=1)
export const caseTypes = [
  { case_type_id: 'CT-UFN',   code: 'UFN',  description: 'Unpaid Fare Notice',   case_option: 'Standard' },
  { case_type_id: 'CT-PFN',   code: 'PFN',  description: 'Penalty Fare Notice',  case_option: 'Standard' },
  { case_type_id: 'CT-MG',    code: 'MG',   description: 'Magistrate Court',     case_option: 'Court' },
  { case_type_id: 'CT-MG11',  code: 'MG11', description: 'MG11 Statement',       case_option: 'Court' },
  { case_type_id: 'CT-FT',    code: 'FT',   description: 'Fraud Travel',         case_option: 'Investigation' },
  { case_type_id: 'CT-PCN',   code: 'PCN',  description: 'Penalty Charge Notice', case_option: 'Car park' },
  { case_type_id: 'CT-MICS',  code: 'MICS', description: 'Miscellaneous',        case_option: 'Other' }
]

// revp_lookup_data — lookupTypeName='ACTION_ROLE'
export const holderOwnerLookup = [
  { lookup_data_id: 'ROLE-RP-AGENT',   lookup_data_value: 'RP Agent' },
  { lookup_data_id: 'ROLE-RP-ADMIN',   lookup_data_value: 'RP Admin' },
  { lookup_data_id: 'ROLE-RP-MANAGER', lookup_data_value: 'RP Manager' },
  { lookup_data_id: 'ROLE-PROSECUTOR', lookup_data_value: 'Prosecutor' },
  { lookup_data_id: 'ROLE-CUSTOMER',   lookup_data_value: 'Customer' },
  { lookup_data_id: 'ROLE-FINANCE',    lookup_data_value: 'Finance' }
]

// revp_action_type — list(tocid, active=1)
export const actionTypes = [
  { actionTypeID: 'AT-MANUAL',     actionTypeName: 'Manual' },
  { actionTypeID: 'AT-SEND-EMAIL', actionTypeName: 'Send Email' },
  { actionTypeID: 'AT-SEND-LET',   actionTypeName: 'Send Letter' },
  { actionTypeID: 'AT-SEND-EMA',   actionTypeName: 'Send Email with Attachment' }
]

// revp_email_template — getemailtemplatedatalist(case_type_id=..., status=1)
export const emailTemplates = [
  { email_template_id: 'EMAIL-1', title: 'UFN — Initial demand letter (email)' },
  { email_template_id: 'EMAIL-2', title: 'UFN — Second reminder (email)' },
  { email_template_id: 'EMAIL-3', title: 'Court summons confirmation (email)' },
  { email_template_id: 'EMAIL-4', title: 'Settlement confirmation (email)' }
]

// revp_letter_template — getlist(TOC_ID=..., case_type_id=...)
export const letterTemplates = [
  { letter_template_id: 'LET-1', title: 'UFN — Initial demand letter' },
  { letter_template_id: 'LET-2', title: 'UFN — Second reminder' },
  { letter_template_id: 'LET-3', title: 'PFN — Final reminder' },
  { letter_template_id: 'LET-4', title: 'Court summons cover letter' },
  { letter_template_id: 'LET-5', title: 'Settlement offer letter' }
]

// revp_action_template — getList(case_type_id, TOC_ID, active=1, orderby, ascdsc)
export const actionTemplates = [
  {
    action_template_id: 'AT-UFN-001',
    case_type_id: 'CT-UFN',
    name: 'Initial Demand',
    instruction: 'Send initial demand letter to offender',
    predecessor: '',          // empty + workFromDate=1 → "*Offence Date*"
    workFromDate: 1,
    days_offset: 14,
    holder: 'ROLE-RP-AGENT',
    owner: 'ROLE-RP-AGENT',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '0.00',
    action_type: 'AT-SEND-LET',
    EmailTemplate: '',
    LetterTemplate: 'LET-1',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-UFN-002',
    case_type_id: 'CT-UFN',
    name: 'Second Reminder',
    instruction: 'Send second reminder if no payment received',
    predecessor: 'AT-UFN-001',
    workFromDate: 0,
    days_offset: 14,
    holder: 'ROLE-RP-AGENT',
    owner: 'ROLE-RP-AGENT',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '5.00',
    action_type: 'AT-SEND-EMAIL',
    EmailTemplate: 'EMAIL-2',
    LetterTemplate: '',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-UFN-003',
    case_type_id: 'CT-UFN',
    name: 'Court Summons',
    instruction: 'Prepare court summons documentation with attachments',
    predecessor: 'AT-UFN-002',
    workFromDate: 0,
    days_offset: 28,
    holder: 'ROLE-PROSECUTOR',
    owner: 'ROLE-RP-MANAGER',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '25.00',
    action_type: 'AT-SEND-EMA',
    EmailTemplate: 'EMAIL-3',
    LetterTemplate: '',
    attachments: ['LET-4'],
    active: 1
  },
  {
    action_template_id: 'AT-PFN-001',
    case_type_id: 'CT-PFN',
    name: 'PFN Issued',
    instruction: 'Issue penalty fare notice and set payment deadline',
    predecessor: '',
    workFromDate: 1,
    days_offset: 21,
    holder: 'ROLE-RP-AGENT',
    owner: 'ROLE-CUSTOMER',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '0.00',
    action_type: 'AT-MANUAL',
    EmailTemplate: '',
    LetterTemplate: '',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-PFN-002',
    case_type_id: 'CT-PFN',
    name: 'PFN Final Reminder',
    instruction: 'Send final reminder before referral to debt recovery',
    predecessor: 'AT-PFN-001',
    workFromDate: 0,
    days_offset: 14,
    holder: 'ROLE-RP-AGENT',
    owner: 'ROLE-FINANCE',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '10.00',
    action_type: 'AT-SEND-LET',
    EmailTemplate: '',
    LetterTemplate: 'LET-3',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-MG-001',
    case_type_id: 'CT-MG',
    name: 'MG Cover Letter',
    instruction: 'Prepare and send Magistrate Court cover letter',
    predecessor: '',
    workFromDate: 1,
    days_offset: 7,
    holder: 'ROLE-PROSECUTOR',
    owner: 'ROLE-PROSECUTOR',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '0.00',
    adminCost: '0.00',
    action_type: 'AT-SEND-LET',
    EmailTemplate: '',
    LetterTemplate: 'LET-4',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-PCN-001',
    case_type_id: 'CT-PCN',
    name: 'Notice to Owner',
    instruction: 'Issue Notice to Owner with applicable PCN charges',
    predecessor: '',
    workFromDate: 1,
    days_offset: 28,
    holder: 'ROLE-RP-ADMIN',
    owner: 'ROLE-CUSTOMER',
    pcnNoticeToOwner: '70.00',
    pcnChargeCertificate: '0.00',
    adminCost: '15.00',
    action_type: 'AT-MANUAL',
    EmailTemplate: '',
    LetterTemplate: '',
    attachments: [],
    active: 1
  },
  {
    action_template_id: 'AT-PCN-002',
    case_type_id: 'CT-PCN',
    name: 'Charge Certificate',
    instruction: 'Issue PCN charge certificate after expiry of Notice to Owner',
    predecessor: 'AT-PCN-001',
    workFromDate: 0,
    days_offset: 14,
    holder: 'ROLE-RP-ADMIN',
    owner: 'ROLE-CUSTOMER',
    pcnNoticeToOwner: '0.00',
    pcnChargeCertificate: '60.00',
    adminCost: '0.00',
    action_type: 'AT-MANUAL',
    EmailTemplate: '',
    LetterTemplate: '',
    attachments: [],
    active: 1
  }
]
