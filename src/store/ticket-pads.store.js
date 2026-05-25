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

  async function init() {
    const [allPads, refData] = await Promise.all([
      ticketPadsService.getAll(),
      ticketPadsService.getReferenceData(),
    ])
    pads.value = allPads
    caseTypes.value = refData.caseTypes
    tocUsers.value = refData.tocUsers
    padIssuers.value = refData.padIssuers
    sessionUserId.value = refData.sessionUserId
  }

  async function createPad(payload) {
    const item = await ticketPadsService.create(payload)
    pads.value.push(item)
  }

  async function updatePad(id, payload) {
    await ticketPadsService.update(id, payload)
    const i = pads.value.findIndex(p => p.ticket_pad_id === id)
    if (i !== -1) Object.assign(pads.value[i], payload)
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
