import { defineStore } from 'pinia'
import { ref } from 'vue'
import { casesService } from '@/services/cases.service.js'

// State shape: anything that the Case List screen needs to render lives in
// the store. Single-case detail state (audit / offences / notes / linked /
// attachments / vehicle / journey ...) is NOT cached here — the detail view
// fetches its sub-resources on mount and owns them locally. That keeps the
// store small and avoids "switched to case B but tab still shows A's audit"
// bugs when the user moves between cases quickly.
//
// Refetch policy: views call fetchCases / fetchCase on every mount. The
// store doesn't try to be clever about caching — staleness is impossible
// because we always reload from the server when a screen is shown.
export const useCasesStore = defineStore('cases', () => {
  // ── List page state ──────────────────────────────────────────────────────
  const cases       = ref([])
  const total       = ref(0)
  const listLoading = ref(false)
  const listError   = ref(null)

  async function fetchCases(filters = {}) {
    listLoading.value = true
    listError.value = null
    try {
      const resp = await casesService.getAll(filters)
      cases.value = resp.results ?? []
      total.value = resp.total   ?? 0
    } catch (err) {
      listError.value = err?.data?.detail || err?.message || 'Failed to load cases'
      cases.value = []
      total.value = 0
    } finally {
      listLoading.value = false
    }
  }

  // ── Reference data (dropdowns shared by list + add-case form) ────────────
  const caseTypes = ref([])
  const statuses  = ref([])
  const issuers   = ref([])
  const referenceLoading = ref(false)

  async function fetchReferenceData() {
    referenceLoading.value = true
    const [t, s, i] = await Promise.allSettled([
      casesService.listTypes(),
      casesService.listStatuses(),
      casesService.listIssuers(),
    ])
    if (t.status === 'fulfilled') caseTypes.value = t.value ?? []
    if (s.status === 'fulfilled') statuses.value  = s.value ?? []
    if (i.status === 'fulfilled') issuers.value   = i.value ?? []
    referenceLoading.value = false
  }

  // ── Single-case state (header info only) ─────────────────────────────────
  const currentCase   = ref(null)
  const detailLoading = ref(false)
  const detailError   = ref(null)

  async function fetchCase(id) {
    detailLoading.value = true
    detailError.value = null
    try {
      currentCase.value = await casesService.get(id)
      return currentCase.value
    } catch (err) {
      detailError.value = err?.data?.detail || err?.message || 'Failed to load case'
      currentCase.value = null
      throw err
    } finally {
      detailLoading.value = false
    }
  }

  async function createCase(payload) {
    // Returns the created case dict; caller routes to the detail page.
    return await casesService.create(payload)
  }

  async function updateCase(id, payload) {
    const updated = await casesService.update(id, payload)
    if (currentCase.value?.case_id === id) currentCase.value = updated
    return updated
  }

  // ── Quick search ─────────────────────────────────────────────────────────
  const quickResults = ref([])
  const quickTotal   = ref(0)
  const quickLoading = ref(false)
  const quickError   = ref(null)

  async function fetchQuickSearch({ term = '', page = 1, pageSize = 25 } = {}) {
    quickLoading.value = true
    quickError.value = null
    try {
      const resp = await casesService.quickSearch({ term, page, pageSize })
      quickResults.value = resp.results ?? []
      quickTotal.value   = resp.total   ?? 0
    } catch (err) {
      quickError.value = err?.data?.detail || err?.message || 'Quick search failed'
      quickResults.value = []
      quickTotal.value = 0
    } finally {
      quickLoading.value = false
    }
  }

  // ── Sub-resource actions (no store state — caller owns the result) ───────
  // Returning the raw service promise so the detail view can decide where to
  // put the data and how to handle errors. Two cases open in two tabs won't
  // step on each other because nothing here writes to store state.
  const fetchAudit            = (id)         => casesService.listAudit(id)
  const fetchOffences         = (id)         => casesService.listOffences(id)
  const fetchNotes            = (id)         => casesService.listNotes(id)
  const createNote            = (id, text)   => casesService.createNote(id, text)
  const fetchLinked           = (id)         => casesService.listLinked(id)
  const fetchLinkable         = (id)         => casesService.listLinkable(id)
  const linkCase              = (id, lcid)   => casesService.link(id, lcid)
  const unlinkCase            = (id, linkId) => casesService.unlink(id, linkId)
  const fetchLinkedDetail     = (id)         => casesService.getLinkedDetail(id)
  const fetchAttachments      = (id)         => casesService.listAttachments(id)
  const uploadAttachment      = (id, file)   => casesService.uploadAttachment(id, file)
  const fetchVerification     = (id)         => casesService.getVerification(id)
  const createVerification    = (id, payload)=> casesService.createVerification(id, payload)

  return {
    // List
    cases, total, listLoading, listError, fetchCases,
    // Reference data
    caseTypes, statuses, issuers, referenceLoading, fetchReferenceData,
    // Detail
    currentCase, detailLoading, detailError,
    fetchCase, createCase, updateCase,
    // Quick search
    quickResults, quickTotal, quickLoading, quickError, fetchQuickSearch,
    // Sub-resources (pass-through to service)
    fetchAudit, fetchOffences, fetchNotes, createNote,
    fetchLinked, fetchLinkable, linkCase, unlinkCase, fetchLinkedDetail,
    fetchAttachments, uploadAttachment,
    fetchVerification, createVerification,
  }
})
