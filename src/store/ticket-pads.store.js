import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ticketPadsService } from '@/services/ticket-pads.service.js'

export const useTicketPadsStore = defineStore('ticketPads', () => {
  const pads = ref([])
  const caseTypes = ref([])
  const tocUsers = ref([])
  const padIssuers = ref([])
  const sessionUserId = ref(null)
  const loading = ref(false)

  function _denormalize(pad) {
    const ct = caseTypes.value.find(c => c.case_type_id === pad.case_type_id)
    const issuer = padIssuers.value.find(i => i.lookup_data_id === pad.issuedBy)
    const to = tocUsers.value.find(u => u.UserID === pad.issuedTo)
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

  async function init() {
    loading.value = true
    try {
      const [allPads, refData] = await Promise.all([
        ticketPadsService.getAll(),
        ticketPadsService.getReferenceData(),
      ])
      caseTypes.value = refData.caseTypes
      tocUsers.value = refData.tocUsers
      padIssuers.value = refData.padIssuers
      sessionUserId.value = refData.sessionUserId
      pads.value = allPads.map(_denormalize)
    } finally {
      loading.value = false
    }
  }

  async function createPad(payload) {
    const item = await ticketPadsService.create(payload)
    pads.value.push(_denormalize(item))
  }

  async function updatePad(id, payload) {
    const item = await ticketPadsService.update(id, payload)
    const i = pads.value.findIndex(p => p.ticket_pad_id === id)
    if (i !== -1) pads.value[i] = _denormalize(item)
  }

  async function removePad(id) {
    await ticketPadsService.remove(id)
    const item = pads.value.find(p => p.ticket_pad_id === id)
    if (item) item.active = 0
  }

  return {
    pads, caseTypes, tocUsers, padIssuers, sessionUserId, loading,
    init, createPad, updatePad, removePad,
  }
})
