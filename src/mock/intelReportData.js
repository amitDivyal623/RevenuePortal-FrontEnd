/**
 * Mock data for Intelligence Report Config.
 * Mirrors RevpConfig.intelligentRepDetAction. Two concerns:
 *   1. Config row (single per TOC): ID, EmailAddress, PreConfermationMessage, ConfermationMessage
 *   2. Report data rows: dateTimeOfReport, name, location, headcode, optPoliceRef, report
 */
export const intelConfig = {
  ID: 'IRC-001',
  EmailAddress: 'intel.reports@example-toc.co.uk',
  PreConfermationMessage: '<p>Thank you for your intelligence report.</p><p>We treat all reports confidentially. A member of our Revenue Protection team will review the details and may contact you for further information.</p>',
  ConfermationMessage:    '<p>Your report has been received and assigned reference {report.id}.</p><p>If immediate action is required please call 0800 999 1234.</p>'
}

// Sample stations for Location filter
export const intelStations = [
  { station_id: 'STN-KGX', station_name: "London King's Cross" },
  { station_id: 'STN-EUS', station_name: 'London Euston' },
  { station_id: 'STN-PAD', station_name: 'London Paddington' },
  { station_id: 'STN-LVS', station_name: 'London Liverpool Street' },
  { station_id: 'STN-MAN', station_name: 'Manchester Piccadilly' },
  { station_id: 'STN-LEE', station_name: 'Leeds' }
]

export const intelReports = [
  { id: 'IR-001', name: 'Anonymous',     dateTimeOfReport: '2026-05-14T08:22:00', station_id: 'STN-KGX', headcode: '1L24', optPoliceRef: '', report: 'Group of 4 boarded the 0822 to Edinburgh without tickets. Reported by guard.' },
  { id: 'IR-002', name: 'Customer (form)', dateTimeOfReport: '2026-05-13T17:45:00', station_id: 'STN-LVS', headcode: '2H88', optPoliceRef: 'BTP-44523', report: 'Disruptive passenger refusing to show ticket — BTP attended.' },
  { id: 'IR-003', name: 'Internal',      dateTimeOfReport: '2026-05-12T14:10:00', station_id: 'STN-MAN', headcode: '1B19', optPoliceRef: '', report: 'Same individual reported boarding without ticket on three separate journeys this week.' },
  { id: 'IR-004', name: 'Anonymous',     dateTimeOfReport: '2026-05-10T09:33:00', station_id: 'STN-LEE', headcode: '1A02', optPoliceRef: 'NYP-22091', report: 'Suspected ticket fraud — duplicate ticket scanned twice at gate.' }
]
