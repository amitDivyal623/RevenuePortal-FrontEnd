import { defineStore } from 'pinia'
import { ref } from 'vue'
import { filterPresetsService } from '@/services/filterPresets.service.js'

// State for the saved filter preset popover + quick-access chip bar on the
// Case List page. Scoped to section='case_list'; extend section param if
// other pages ever add filter-preset support.
export const useFilterPresetsStore = defineStore('filterPresets', () => {
  const SECTION = 'case_list'

  // ── Preset lists ──────────────────────────────────────────────────────────
  const personal = ref([])   // presets owned by the current user
  const team     = ref([])   // presets shared across the TOC
  const chips    = ref([])   // up to 3 recently used (personal + team)

  const loading = ref(false)
  const error   = ref(null)

  // ── Load all presets ──────────────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const resp    = await filterPresetsService.list(SECTION)
      personal.value = resp.personal ?? []
      team.value     = resp.team     ?? []
    } catch (err) {
      error.value = err?.data?.detail || err?.message || 'Failed to load filter presets'
    } finally {
      loading.value = false
    }
  }

  // ── Load recent chips ─────────────────────────────────────────────────────
  async function fetchChips() {
    try {
      const resp  = await filterPresetsService.listChips(SECTION)
      chips.value = resp.results ?? []
    } catch {
      // Chips are non-critical — fail silently
      chips.value = []
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────
  // Returns { created: <preset> } on success, { exists: true } on duplicate name.
  async function create(payload) {
    const resp = await filterPresetsService.create({ ...payload, section: SECTION })
    if (resp?.exists) return { exists: true }

    if (payload.is_personal === 0) {
      team.value = [...team.value, resp]
    } else {
      personal.value = [...personal.value, resp]
    }
    return { created: resp }
  }

  // ── Update ────────────────────────────────────────────────────────────────
  // Returns { updated: <preset> } on success, { exists: true } on duplicate name.
  async function update(id, payload) {
    const resp = await filterPresetsService.update(id, payload)
    if (resp?.exists) return { exists: true }

    _replaceInList(personal, id, resp)
    _replaceInList(team,     id, resp)
    _replaceInList(chips,    id, resp)
    return { updated: resp }
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  async function remove(id) {
    await filterPresetsService.remove(id)
    personal.value = personal.value.filter(p => p.id !== id)
    team.value     = team.value.filter(p => p.id !== id)
    chips.value    = chips.value.filter(p => p.id !== id)
  }

  // ── Record use (stamp last_used_at, refresh chips) ────────────────────────
  async function recordUse(id) {
    try {
      await filterPresetsService.recordUse(id)
      // Refresh chips so the bar re-orders immediately
      await fetchChips()
    } catch {
      // Non-critical — the filter was applied even if the stamp failed
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _replaceInList(listRef, id, updated) {
    const idx = listRef.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      const next = [...listRef.value]
      next[idx] = updated
      listRef.value = next
    }
  }

  return {
    personal, team, chips,
    loading, error,
    fetchAll, fetchChips,
    create, update, remove, recordUse,
  }
})
