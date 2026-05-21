/**
 * Mock data for Print Templates.
 * Mirrors RevpConfig.printTemplate. Fields:
 *   print_template_id, title, contents, case_type_id, active
 */
import { caseTypes } from './ticketPadsData.js'
export { caseTypes }

export const printTemplates = [
  {
    print_template_id: 'PT-001',
    title: 'UFN — Header receipt',
    contents: `Train Operating Company\nUnpaid Fare Notice\nIssued at: {station.name}\nDate: {case.offence_dt}\nReference: {case.case_number}\nAmount due: £{case.charge_amount}\nPay online at: pay.example.com`,
    case_type_id: 'CT-UFN',
    active: 1
  },
  {
    print_template_id: 'PT-002',
    title: 'PFN — Receipt',
    contents: `Penalty Fare Notice\nIssued at: {station.name}\nIssued by: {agent.name}\nDate/Time: {case.offence_dt_time}\nPenalty: £{case.charge_amount}\nAppeal info: appeal.example.com`,
    case_type_id: 'CT-PFN',
    active: 1
  },
  {
    print_template_id: 'PT-003',
    title: 'PCN — Window slip',
    contents: `Penalty Charge Notice\nVehicle: {case.vrm}\nLocation: {case.location}\nDate/Time: {case.offence_dt_time}\nCharge: £{case.charge_amount}`,
    case_type_id: 'CT-PCN',
    active: 0
  }
]
