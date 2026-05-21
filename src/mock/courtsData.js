/**
 * Mock data for the Courts admin screen.
 *
 * Shapes mirror what the legacy ColdFusion endpoints return so the API swap
 * is a drop-in later:
 *   RevpConfig.searchcourt            → loads page (filters + datatable bootstrap)
 *   RevpConfig.getcourtdata           → list of courts (DataTables payload)
 *   RevpConfig.getcourtdataonid       → court row by id (for edit/view)
 *   RevpConfig.GetCourtdetailsByid    → court + address join (legacy uses 2 calls)
 *   RevpConfig.addcourt               → insert court + 2 address rows
 *   RevpConfig.updatecourt            → update court + both address rows
 *   RevpConfig.deletecourt            → hard delete via courtService.deleteCourtById
 *
 * Field names match the CF model exactly:
 *   court:   court_id, name, code, area, active, addressForAdmin, adminAddress,
 *            courtAddress, isHideFilterLists, TOC_ID
 *   address: address_id, postcode, houseName, houseNo, street, locality, town,
 *            countryName, address_type ('court' | 'admin')
 *
 * Important legacy quirks preserved here:
 * - `active` in the DB is inverted: 0 = active (newly added), 1 = disabled.
 *   The legacy "Disabled" checkbox saves its value directly into `active`.
 * - `addressForAdmin` = 1 means "Use Court Address for Admin" — the admin
 *   address row still exists but is a copy of the court address.
 */

// revp_address rows keyed by address_id
export const addresses = [
  {
    address_id: 'ADDR-COURT-WBM-01',
    postcode: 'E1 7LS',
    houseName: 'Thames Magistrates Court',
    houseNo: '58',
    street: 'Bow Road',
    locality: 'Bow',
    town: 'London',
    countryName: 'Greater London',
    address_type: 'court'
  },
  {
    address_id: 'ADDR-ADMIN-WBM-01',
    postcode: 'EC4Y 0BS',
    houseName: 'RP Admin',
    houseNo: '8',
    street: 'Salisbury Square',
    locality: '',
    town: 'London',
    countryName: 'Greater London',
    address_type: 'admin'
  },
  {
    address_id: 'ADDR-COURT-MAN-01',
    postcode: 'M60 1PR',
    houseName: 'Manchester Magistrates Court',
    houseNo: 'Crown Square',
    street: 'Crown Square',
    locality: '',
    town: 'Manchester',
    countryName: 'Greater Manchester',
    address_type: 'court'
  },
  {
    address_id: 'ADDR-ADMIN-MAN-01',
    postcode: 'M60 1PR',
    houseName: 'Manchester Magistrates Court',
    houseNo: 'Crown Square',
    street: 'Crown Square',
    locality: '',
    town: 'Manchester',
    countryName: 'Greater Manchester',
    address_type: 'admin'
  },
  {
    address_id: 'ADDR-COURT-LEE-01',
    postcode: 'LS1 3JP',
    houseName: 'Leeds Magistrates Court',
    houseNo: 'Westgate',
    street: 'Westgate',
    locality: '',
    town: 'Leeds',
    countryName: 'West Yorkshire',
    address_type: 'court'
  },
  {
    address_id: 'ADDR-ADMIN-LEE-01',
    postcode: 'LS1 3JP',
    houseName: 'Leeds Magistrates Court',
    houseNo: 'Westgate',
    street: 'Westgate',
    locality: '',
    town: 'Leeds',
    countryName: 'West Yorkshire',
    address_type: 'admin'
  },
  {
    address_id: 'ADDR-COURT-BIR-01',
    postcode: 'B4 6QA',
    houseName: 'Birmingham Magistrates Court',
    houseNo: 'Corporation Street',
    street: 'Corporation Street',
    locality: '',
    town: 'Birmingham',
    countryName: 'West Midlands',
    address_type: 'court'
  },
  {
    address_id: 'ADDR-ADMIN-BIR-01',
    postcode: 'EC4Y 0BS',
    houseName: 'RP Admin',
    houseNo: '8',
    street: 'Salisbury Square',
    locality: '',
    town: 'London',
    countryName: 'Greater London',
    address_type: 'admin'
  },
  {
    address_id: 'ADDR-COURT-NEW-01',
    postcode: 'NE1 8QF',
    houseName: 'Newcastle Magistrates Court',
    houseNo: 'The Law Courts, Quayside',
    street: 'Quayside',
    locality: '',
    town: 'Newcastle upon Tyne',
    countryName: 'Tyne and Wear',
    address_type: 'court'
  },
  {
    address_id: 'ADDR-ADMIN-NEW-01',
    postcode: 'EC4Y 0BS',
    houseName: 'RP Admin',
    houseNo: '8',
    street: 'Salisbury Square',
    locality: '',
    town: 'London',
    countryName: 'Greater London',
    address_type: 'admin'
  }
]

// revp_court rows — mirrors courtService.getCourtDatalist payload
export const courts = [
  {
    court_id: 'COURT-WBM-01',
    name: 'Thames Magistrates Court',
    code: 'TMC',
    area: 'London',
    active: 0,             // 0 = active (per legacy convention)
    addressForAdmin: 0,    // 0 = uses a separate admin address
    courtAddress: 'ADDR-COURT-WBM-01',
    adminAddress: 'ADDR-ADMIN-WBM-01',
    isHideFilterLists: 0
  },
  {
    court_id: 'COURT-MAN-01',
    name: 'Manchester Magistrates Court',
    code: 'MMC',
    area: 'North West',
    active: 0,
    addressForAdmin: 1,    // 1 = use court address for admin
    courtAddress: 'ADDR-COURT-MAN-01',
    adminAddress: 'ADDR-ADMIN-MAN-01',
    isHideFilterLists: 0
  },
  {
    court_id: 'COURT-LEE-01',
    name: 'Leeds Magistrates Court',
    code: 'LMC',
    area: 'Yorkshire',
    active: 0,
    addressForAdmin: 1,
    courtAddress: 'ADDR-COURT-LEE-01',
    adminAddress: 'ADDR-ADMIN-LEE-01',
    isHideFilterLists: 0
  },
  {
    court_id: 'COURT-BIR-01',
    name: 'Birmingham Magistrates Court',
    code: 'BMC',
    area: 'West Midlands',
    active: 0,
    addressForAdmin: 0,
    courtAddress: 'ADDR-COURT-BIR-01',
    adminAddress: 'ADDR-ADMIN-BIR-01',
    isHideFilterLists: 0
  },
  {
    court_id: 'COURT-NEW-01',
    name: 'Newcastle Magistrates Court',
    code: 'NMC',
    area: 'North East',
    active: 1,             // 1 = disabled
    addressForAdmin: 0,
    courtAddress: 'ADDR-COURT-NEW-01',
    adminAddress: 'ADDR-ADMIN-NEW-01',
    isHideFilterLists: 1
  }
]

export function blankAddress() {
  return {
    address_id: '',
    postcode: '',
    houseName: '',
    houseNo: '',
    street: '',
    locality: '',
    town: '',
    countryName: '',
    address_type: 'court'
  }
}
