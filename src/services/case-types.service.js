import { casesService } from '@/services/cases.service.js'

// Thin re-export so callers that ask "give me the case-type dropdown rows"
// hit the same backend path as cases.store / AddNewCaseView and get the
// exact same field shape: {case_type_id, code, description, active, case_option}.
//
// The previous implementation re-mapped `type_id` (a field that doesn't exist
// on the response) into `case_type_id`, producing undefined ids. That made
// every <option :value="ct.case_type_id"> render with an empty value and
// caused "Please select Case Type" to fire even when an option looked picked.
export const caseTypesService = {
  getAll: () => casesService.listTypes(),
}
