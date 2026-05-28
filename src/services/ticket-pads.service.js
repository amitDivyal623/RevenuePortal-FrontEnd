import { apiGet, apiPost, apiPut } from '@/services/api.js'

export const ticketPadsService = {
  getReferenceData: async () => {
    const { useAuthStore } = await import('@/store/auth.js')
    const authStore = useAuthStore()

    const [caseTypesRes, tocUsersRes, padIssuersRes] = await Promise.allSettled([
      apiGet('/revp/cases/case-types/'),
      apiGet('/auth/user-list/'),
      apiGet('/revp/lookup/charges/?lookup_type_name=PAD_ISSUER&active=1'),
    ])

    if (caseTypesRes.status === 'rejected')
      console.warn('[ticket-pads] case-types API failed:', caseTypesRes.reason)
    if (tocUsersRes.status === 'rejected')
      console.warn('[ticket-pads] user-list API failed:', tocUsersRes.reason)
    if (padIssuersRes.status === 'rejected')
      console.warn('[ticket-pads] pad-issuers API failed:', padIssuersRes.reason)

    const caseTypes = caseTypesRes.status === 'fulfilled'
      ? (caseTypesRes.value ?? []).map(ct => ({
          case_type_id: ct.type_id,
          code: ct.code,
          case_option: ct.description,
        }))
      : []

    const tocUsers = tocUsersRes.status === 'fulfilled'
      ? (tocUsersRes.value ?? []).map(u => ({
          UserID: u.user_id,
          Username: u.username,
        }))
      : []

    const padIssuersPayload = padIssuersRes.status === 'fulfilled' ? padIssuersRes.value : null
    const padIssuers = padIssuersPayload
      ? (padIssuersPayload.results ?? padIssuersPayload).map(i => ({
          lookup_data_id: i.lookup_data_id,
          lookup_data_value: i.lookup_data_value,
        }))
      : []

    const sessionUserId = authStore.user?.user_id ?? null

    return { caseTypes, tocUsers, padIssuers, sessionUserId }
  },

  getAll: async () => {
    const allItems = []
    let page = 1
    while (true) {
      const data = await apiGet(`/revp/ticketpads/?page=${page}&page_size=100`)
      const results = data?.results ?? []
      allItems.push(...results.map(_fromApi))
      if (allItems.length >= (data?.total ?? 0) || results.length === 0) break
      page++
    }
    return allItems
  },

  create: async (payload) => {
    const created = await apiPost('/revp/ticketpads/create/', _toApiCreate(payload))
    const detail = await apiGet(`/revp/ticketpads/${created.ticket_pad_id}/`)
    return _fromApi(detail)
  },

  update: async (id, payload) => {
    await apiPut(`/revp/ticketpads/${id}/update/`, _toApiUpdate(payload))
    const detail = await apiGet(`/revp/ticketpads/${id}/`)
    return _fromApi(detail)
  },

  remove: async (id) => {
    await apiPut(`/revp/ticketpads/${id}/update/`, { active: 0 })
  },
}

function _fromApi(item) {
  return {
    ticket_pad_id: item.ticket_pad_id,
    case_type_id:  item.case_type_id,
    code:          item.case_type_code ?? item.code ?? '',
    issuedBy:      item.issued_by,
    issuedTo:      item.issued_to,
    issuedDate:    item.issued_date,
    startNum:      item.start_num,
    endNum:        item.end_num,
    Totaltickets:  item.total_tickets,
    Issuedtickets: item.issued_tickets,
    Firstused:     item.first_used,
    Lastused:      item.last_used,
    active:        item.active,
    CreatedBy:     item.created_by,
    CreatedDT:     item.created_dt,
    // populated by store after reference data is set
    issuedbyuser:  null,
    issuedtouser:  null,
    FirstName:     null,
    Surname:       null,
    enteredbyname: null,
  }
}

function _toApiCreate(payload) {
  return {
    case_type_id: payload.case_type_id,
    issued_by:    payload.issuedBy,
    issued_to:    payload.issuedTo,
    issued_date:  payload.issuedDate,
    start_num:    payload.startNum,
    end_num:      payload.endNum,
    active:       payload.active ?? 1,
  }
}

function _toApiUpdate(payload) {
  const out = {}
  if (payload.case_type_id != null) out.case_type_id = payload.case_type_id
  if (payload.issuedBy != null)     out.issued_by    = payload.issuedBy
  if (payload.issuedTo != null)     out.issued_to    = payload.issuedTo
  if (payload.issuedDate != null)   out.issued_date  = payload.issuedDate
  if (payload.startNum != null)     out.start_num    = payload.startNum
  if (payload.endNum != null)       out.end_num      = payload.endNum
  if (payload.active != null)       out.active       = payload.active
  return out
}
