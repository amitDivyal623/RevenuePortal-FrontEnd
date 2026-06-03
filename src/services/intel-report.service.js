import { api } from '@/services/api.js'

// HTTP calls for the Intelligence Reports listing + detail.
// Settings (config) live on a different endpoint /revp/cases/ir-details/
// and are owned by IntelReportView.vue directly — kept out of this service
// so the listing page doesn't fetch settings it never renders.
//
// Backend response shape (paginated list):
//   { data: [ {id, name, date_time_of_report, location, headcode,
//              opt_police_ref, report, cumulative_ref_num, ...}, ... ],
//     recordsTotal, iTotalDisplayRecords }
// Backend single-report shape:
//   { id, name, date_time_of_report, location, headcode, opt_police_ref,
//     report, cumulative_ref_num, heading, staff_id, staff_email,
//     all_affected_tocs, created_dt, created_by, location_type }
export const intelReportService = {
  list: ({
    page = 1,
    pageSize = 25,
    ordering = '-date_time_of_report',
    dateFrom = '',
    dateTo = '',
    location = '',
    reporter = '',
  } = {}) => {
    const params = new URLSearchParams()
    params.set('page',      String(page))
    params.set('page_size', String(pageSize))
    params.set('ordering',  ordering)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo)   params.set('date_to',   dateTo)
    if (location) params.set('location',  location)
    if (reporter) params.set('reporter',  reporter)
    return api.get(`/revp/cases/intelligence-reports/?${params.toString()}`)
  },

  // Single report by id — used by the "VIEW" modal so the modal can show
  // fields that the list response doesn't include (heading, all_affected_tocs).
  get: (reportId) =>
    api.get(`/revp/cases/intelligence-reports/${encodeURIComponent(reportId)}/`),
}
