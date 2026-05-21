/**
 * Mock data for Service Type Management.
 * Mirrors RevpConfig.servicetypemgt. Fields:
 *   service_type_id, service_type_name, short_code, active
 */
export const serviceTypes = [
  { service_type_id: 'SVC-001', service_type_name: 'Intercity', short_code: 'IC',  active: 1 },
  { service_type_id: 'SVC-002', service_type_name: 'Regional',  short_code: 'REG', active: 1 },
  { service_type_id: 'SVC-003', service_type_name: 'Suburban',  short_code: 'SUB', active: 1 },
  { service_type_id: 'SVC-004', service_type_name: 'Sleeper',   short_code: 'SLP', active: 0 },
  { service_type_id: 'SVC-005', service_type_name: 'Charter',   short_code: 'CHT', active: 1 }
]
