/**
 * Mock data for Authorising Prosecutor.
 * Mirrors RevpConfig.prosecutorDetailsAction. Fields:
 *   prosecutor_id, Name, job_title, supplementary_info, attachment_id, attachment_filename
 */
export const prosecutors = [
  { prosecutor_id: 'PROS-001', Name: 'Helena Whitmore',  job_title: 'Senior Prosecutor', supplementary_info: 'Solicitor of the Senior Courts. 12+ years of railway prosecution experience.', attachment_id: 'ATT-001', attachment_filename: 'helena-whitmore-sig.png' },
  { prosecutor_id: 'PROS-002', Name: 'Daniel O’Connor', job_title: 'Prosecuting Solicitor', supplementary_info: 'Authorised to sign Magistrates Court summonses on behalf of the TOC.', attachment_id: '', attachment_filename: '' },
  { prosecutor_id: 'PROS-003', Name: 'Priya Sharma',     job_title: 'Head of Revenue Protection', supplementary_info: 'Holds Authorisation by the Department for Transport for prosecutorial action.', attachment_id: 'ATT-003', attachment_filename: 'priya-sharma-sig.jpg' }
]
