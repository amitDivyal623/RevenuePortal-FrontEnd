/**
 * Mock data for Offences.
 * Mirrors RevpConfig.offences endpoints. Field names match revp_offence:
 *   offence_id, CJS_Code, description, charge, offenceStatment, active,
 *   CreatedDT, CreatedBy, UpdatedDT, UpdatedBy, TOC_ID
 */
export const chargeOptions = ['0.00','25.00','40.00','45.00','50.00','60.00','80.00','90.00','100.00','120.00','130.00','150.00','200.00']

export const offences = [
  { offence_id: 'OFF-001', CJS_Code: 'RR(BR)6701', description: 'Travel without a valid ticket', charge: '50.00', offenceStatment: 'Did travel on a train without having previously paid the fare and with intent to avoid payment, contrary to section 5(3)(a) of the Regulation of Railways Act 1889.', active: 1 },
  { offence_id: 'OFF-002', CJS_Code: 'RR(BR)6702', description: 'Failure to produce valid ticket on demand', charge: '50.00', offenceStatment: 'Did fail to deliver up a ticket when reasonably required, contrary to byelaw 18(2) of the Railway Byelaws 2005.', active: 1 },
  { offence_id: 'OFF-003', CJS_Code: 'RR(BR)6710', description: 'Boarding without permission to travel', charge: '80.00', offenceStatment: 'Did enter a train when not permitted, contrary to byelaw 23 of the Railway Byelaws 2005.', active: 1 },
  { offence_id: 'OFF-004', CJS_Code: 'RR(BR)6750', description: 'Trespass on the railway', charge: '120.00', offenceStatment: 'Did trespass upon a railway, contrary to section 55 of the British Transport Commission Act 1949.', active: 1 },
  { offence_id: 'OFF-005', CJS_Code: 'RR(BR)6755', description: 'Smoking in non-smoking carriage', charge: '40.00', offenceStatment: 'Did smoke in a place where smoking is prohibited, contrary to byelaw 3 of the Railway Byelaws 2005.', active: 0 }
]
