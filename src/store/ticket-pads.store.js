import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ticketPadsService } from '@/services/ticket-pads.service.js'

export const useTicketPadsStore = defineStore('ticketPads', () => {
  const pads          = ref([])
  const caseTypes     = ref([])
  const tocUsers      = ref([])
  const padIssuers    = ref([])
  const sessionUserId = ref(null)
  const loading       = ref(false)
  const total         = ref(0)

  // Tracks the params used in the last fetch so create/update can re-fetch the same page
  const _lastParams = ref({ page: 1, pageSize: 25 })

  function _denormalize(pad) {
    const ct       = caseTypes.value.find(c => c.case_type_id === pad.case_type_id)
    const issuer   = padIssuers.value.find(i => i.lookup_data_id === pad.issuedBy)
    const to       = tocUsers.value.find(u => u.UserID === pad.issuedTo)
    const enteredBy = tocUsers.value.find(u => u.UserID === pad.CreatedBy)
    return {
      ...pad,
      code:          ct?.code ?? pad.code ?? '',
      issuedbyuser:  issuer?.lookup_data_value ?? '',
      issuedtouser:  to?.Username ?? '',
      FirstName:     to?.FirstName ?? '',
      Surname:       to?.Surname ?? '',
      enteredbyname: enteredBy?.Username ?? '',
    }
  }

  async function _loadPage(params) {
    _lastParams.value = { pageSize: 25, ...params }
    loading.value = true
    try {
      const pageData  = await ticketPadsService.getPage(_lastParams.value)
      total.value     = pageData.total
      pads.value      = pageData.results.map(_denormalize)
    } finally {
      loading.value = false
    }
  }

  async function init() {
    loading.value = true
    try {
      const [pageData, refData] = await Promise.all([
        ticketPadsService.getPage({ page: 1, pageSize: 25 }),
        ticketPadsService.getReferenceData(),
      ])
      caseTypes.value     = refData.caseTypes
      tocUsers.value      = refData.tocUsers
      padIssuers.value    = refData.padIssuers
      sessionUserId.value = refData.sessionUserId
      total.value         = pageData.total
      pads.value          = pageData.results.map(_denormalize)
      _lastParams.value   = { page: 1, pageSize: 25 }
    } finally {
      loading.value = false
    }
  }

  async function fetchPads(params = {}) {
    await _loadPage(params)
  }

  async function createPad(payload) {
    await ticketPadsService.create(payload)
    await _loadPage({ ..._lastParams.value, page: 1 })
  }

  async function updatePad(id, payload) {
    await ticketPadsService.update(id, payload)
    await _loadPage(_lastParams.value)
  }

  async function removePad(id) {
    await ticketPadsService.remove(id)
    await _loadPage(_lastParams.value)
  }

  return {
    pads, caseTypes, tocUsers, padIssuers, sessionUserId, loading, total,
    init, fetchPads, createPad, updatePad, removePad,
  }
})
