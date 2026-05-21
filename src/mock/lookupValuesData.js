/**
 * Mock data for Lookup Values.
 * Mirrors RevpConfig.lookupaction. Two-table design:
 *   revp_lookup_type:    lookup_type_id, lookup_type_name
 *   revp_lookup_data:    lookup_data_id, lookup_type_id, lookup_data_value, active
 *   revp_toc_lookupdata: toc_lookupdata_id, lookup_data_id, TOC_ID, active (join row)
 *
 * For the mock we collapse these into a single denormalised list row, but keep
 * the field names so the API swap is direct.
 */
export const lookupTypes = [
  { lookup_type_id: 'LT-ACTION-ROLE', lookup_type_name: 'ACTION_ROLE' },
  { lookup_type_id: 'LT-PAD-ISSUER',  lookup_type_name: 'PAD_ISSUER' },
  { lookup_type_id: 'LT-PAY-METHOD',  lookup_type_name: 'PAYMENT_METHOD' },
  { lookup_type_id: 'LT-OFF-LOC',     lookup_type_name: 'OFFENCE_LOCATION' },
  { lookup_type_id: 'LT-STMT-REASON', lookup_type_name: 'STATEMENT_REASON' },
  { lookup_type_id: 'LT-TICKET-TYPE', lookup_type_name: 'TICKET_TYPE' }
]

export const lookupValues = [
  { lookup_data_id: 'LV-001', lookup_type_id: 'LT-ACTION-ROLE', lookup_type_name: 'ACTION_ROLE',     lookup_data_value: 'RP Agent',     active: 1 },
  { lookup_data_id: 'LV-002', lookup_type_id: 'LT-ACTION-ROLE', lookup_type_name: 'ACTION_ROLE',     lookup_data_value: 'RP Admin',     active: 1 },
  { lookup_data_id: 'LV-003', lookup_type_id: 'LT-ACTION-ROLE', lookup_type_name: 'ACTION_ROLE',     lookup_data_value: 'Prosecutor',   active: 1 },
  { lookup_data_id: 'LV-004', lookup_type_id: 'LT-PAD-ISSUER',  lookup_type_name: 'PAD_ISSUER',      lookup_data_value: 'RP Office',    active: 1 },
  { lookup_data_id: 'LV-005', lookup_type_id: 'LT-PAD-ISSUER',  lookup_type_name: 'PAD_ISSUER',      lookup_data_value: 'RP Manager',   active: 0 },
  { lookup_data_id: 'LV-006', lookup_type_id: 'LT-PAY-METHOD',  lookup_type_name: 'PAYMENT_METHOD',  lookup_data_value: 'Card',         active: 1 },
  { lookup_data_id: 'LV-007', lookup_type_id: 'LT-PAY-METHOD',  lookup_type_name: 'PAYMENT_METHOD',  lookup_data_value: 'Cash',         active: 1 },
  { lookup_data_id: 'LV-008', lookup_type_id: 'LT-PAY-METHOD',  lookup_type_name: 'PAYMENT_METHOD',  lookup_data_value: 'Bank Transfer', active: 1 },
  { lookup_data_id: 'LV-009', lookup_type_id: 'LT-OFF-LOC',     lookup_type_name: 'OFFENCE_LOCATION', lookup_data_value: 'On train',     active: 1 },
  { lookup_data_id: 'LV-010', lookup_type_id: 'LT-OFF-LOC',     lookup_type_name: 'OFFENCE_LOCATION', lookup_data_value: 'At gateline',  active: 1 },
  { lookup_data_id: 'LV-011', lookup_type_id: 'LT-OFF-LOC',     lookup_type_name: 'OFFENCE_LOCATION', lookup_data_value: 'On platform',  active: 1 },
  { lookup_data_id: 'LV-012', lookup_type_id: 'LT-STMT-REASON', lookup_type_name: 'STATEMENT_REASON', lookup_data_value: 'Forgot ticket', active: 1 },
  { lookup_data_id: 'LV-013', lookup_type_id: 'LT-STMT-REASON', lookup_type_name: 'STATEMENT_REASON', lookup_data_value: 'Refused payment', active: 1 },
  { lookup_data_id: 'LV-014', lookup_type_id: 'LT-TICKET-TYPE', lookup_type_name: 'TICKET_TYPE',     lookup_data_value: 'Anytime',       active: 1 },
  { lookup_data_id: 'LV-015', lookup_type_id: 'LT-TICKET-TYPE', lookup_type_name: 'TICKET_TYPE',     lookup_data_value: 'Off-Peak',      active: 1 },
  { lookup_data_id: 'LV-016', lookup_type_id: 'LT-TICKET-TYPE', lookup_type_name: 'TICKET_TYPE',     lookup_data_value: 'Super Off-Peak', active: 0 }
]
