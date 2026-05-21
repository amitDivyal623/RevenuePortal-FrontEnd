/**
 * Mock data for Station Management.
 * Mirrors RevpConfig.stationmgt. Fields:
 *   Id, station_name, crs_code, nlc_code, shortCode, isActive,
 *   service_type_id, caseType (csv of case_type_ids enabled at this station),
 *   stationoder, CreatedDT, CreatedBy, UpdatedDT, UpdatedBy, TOC_ID
 */
import { caseTypes } from './ticketPadsData.js'
// serviceTypes is no longer re-exported from here.
// StationMgmtView now fetches service types directly from the live API.
export { caseTypes }

export const stations = [
  { Id: 'STN-KGX', station_name: "London King's Cross", crs_code: 'KGX', nlc_code: '1072', shortCode: 'KGX', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PFN','CT-PCN'], stationoder: 1 },
  { Id: 'STN-EUS', station_name: 'London Euston',       crs_code: 'EUS', nlc_code: '1444', shortCode: 'EUS', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PFN'],          stationoder: 2 },
  { Id: 'STN-PAD', station_name: 'London Paddington',   crs_code: 'PAD', nlc_code: '1410', shortCode: 'PAD', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PFN','CT-PCN'], stationoder: 3 },
  { Id: 'STN-LVS', station_name: 'London Liverpool Street', crs_code: 'LST', nlc_code: '6948', shortCode: 'LVS', isActive: 1, service_type_id: 'SVC-002', caseType: ['CT-UFN','CT-PFN'], stationoder: 4 },
  { Id: 'STN-MAN', station_name: 'Manchester Piccadilly', crs_code: 'MAN', nlc_code: '2937', shortCode: 'MAN', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PCN'], stationoder: 5 },
  { Id: 'STN-LEE', station_name: 'Leeds',               crs_code: 'LDS', nlc_code: '8390', shortCode: 'LEE', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PFN'], stationoder: 6 },
  { Id: 'STN-BHM', station_name: 'Birmingham New Street', crs_code: 'BHM', nlc_code: '1393', shortCode: 'BHM', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PCN'], stationoder: 7 },
  { Id: 'STN-EDI', station_name: 'Edinburgh Waverley',  crs_code: 'EDB', nlc_code: '9300', shortCode: 'EDI', isActive: 1, service_type_id: 'SVC-001', caseType: ['CT-UFN','CT-PFN'], stationoder: 8 },
  { Id: 'STN-RUG', station_name: 'Rugeley Trent Valley', crs_code: 'RGL', nlc_code: '1592', shortCode: 'RGL', isActive: 0, service_type_id: 'SVC-002', caseType: [], stationoder: 9 }
]
