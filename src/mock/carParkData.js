/**
 * Mock data for Car Park Locations.
 * Mirrors RevpConfig.stationmgt. Fields:
 *   car_park_id, station_id, carpark_name, carpark_code, active
 */
import { stations } from './stationsData.js'
export { stations }

export const carParks = [
  { car_park_id: 'CP-001', station_id: 'STN-KGX', carpark_name: "King's Cross main",      carpark_code: 'KGX-MAIN', active: 1 },
  { car_park_id: 'CP-002', station_id: 'STN-KGX', carpark_name: "King's Cross short stay", carpark_code: 'KGX-SS',   active: 1 },
  { car_park_id: 'CP-003', station_id: 'STN-MAN', carpark_name: 'Manchester Piccadilly multi-storey', carpark_code: 'MAN-MS', active: 1 },
  { car_park_id: 'CP-004', station_id: 'STN-LEE', carpark_name: 'Leeds NCP',                carpark_code: 'LEE-NCP',  active: 1 },
  { car_park_id: 'CP-005', station_id: 'STN-BHM', carpark_name: 'Birmingham NS lot A',      carpark_code: 'BHM-A',    active: 1 },
  { car_park_id: 'CP-006', station_id: 'STN-EDI', carpark_name: 'Edinburgh Waverley',       carpark_code: 'EDI-WAV',  active: 0 }
]
