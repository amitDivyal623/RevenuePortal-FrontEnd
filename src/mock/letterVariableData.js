/**
 * Mock data for Letter Variable Lookup.
 * Mirrors RevpConfig.lettervariableaction. Fields:
 *   variableID, variableName, variable_data_types ('Float'|'String'|'Date'),
 *   value, variableType (fixed 'DATABASE'), applicable_styles, style_values,
 *   bActive, toc_id
 */

export const dataTypes = ['Float', 'String', 'Date']

// Styles depend on the data type
export const styleOptions = {
  Float:  ['Number with 2dp', 'Currency (£)', 'Whole number'],
  String: ['Lowercase', 'Uppercase', 'CamelCase'],
  Date:   ['dd/mm/yyyy', 'd MMMM yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy HH:mm']
}

export const letterVariables = [
  { variableID: 'LV-OFFENDER-NAME', variableName: 'OffenderName',    variable_data_types: 'String', value: '{customer.full_name}', variableType: 'DATABASE', applicable_styles: 'CamelCase',     style_values: 'CamelCase',     bActive: 1 },
  { variableID: 'LV-CASE-NUMBER',   variableName: 'CaseNumber',      variable_data_types: 'String', value: '{case.case_number}',   variableType: 'DATABASE', applicable_styles: 'Uppercase',     style_values: 'Uppercase',     bActive: 1 },
  { variableID: 'LV-OFFENCE-DATE',  variableName: 'OffenceDate',     variable_data_types: 'Date',   value: '{case.offence_dt}',    variableType: 'DATABASE', applicable_styles: 'd MMMM yyyy',   style_values: 'd MMMM yyyy',   bActive: 1 },
  { variableID: 'LV-CHARGE-AMT',    variableName: 'ChargeAmount',    variable_data_types: 'Float',  value: '{case.charge_amount}', variableType: 'DATABASE', applicable_styles: 'Currency (£)',  style_values: 'Currency (£)',  bActive: 1 },
  { variableID: 'LV-DEADLINE',      variableName: 'PaymentDeadline', variable_data_types: 'Date',   value: '{case.deadline_dt}',   variableType: 'DATABASE', applicable_styles: 'dd/mm/yyyy',    style_values: 'dd/mm/yyyy',    bActive: 1 },
  { variableID: 'LV-COURT-NAME',    variableName: 'CourtName',       variable_data_types: 'String', value: '{court.name}',         variableType: 'DATABASE', applicable_styles: 'CamelCase',     style_values: 'CamelCase',     bActive: 0 }
]
