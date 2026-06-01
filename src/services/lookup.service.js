import { api } from '@/services/api.js'

// All HTTP calls for the /revp/lookup/... endpoints. The legacy DB ships
// dozens of lookup_type_name codes — list a few common ones inline so the
// callers know what to pass without scanning the DB:
//   PERSON_TITLE, OCCUPATION, PERSON_BUILD, PERSON_HAIR_COLOUR,
//   PERSON_EYE_COLOUR, PERSON_ETHNICITY, PERSON_HANDEDNESS, PERSON_GLASSES,
//   PERSON_FACIAL_HAIR_TYPE, PERSON_HAIR_TYPE, CASE_REASON_FOR_ISSUE,
//   REASON_FOR_ISSUE_FOR_PCN, CASE_VERIFICATION_TYPE
export const lookupService = {
  listByType: (typeName) =>
    api.get(`/revp/lookup/by-type/?name=${encodeURIComponent(typeName)}`),
}
