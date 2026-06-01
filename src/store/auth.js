import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { decodeJwt } from '@/utils/jwt.js'
import { api, ApiError } from '@/services/api.js'

const REFRESH_KEY = 'revp.refresh'
const DEFAULT_TOC_ID = import.meta.env.VITE_DEFAULT_TOC_ID || ''
const IDLE_TIMEOUT_MS = 30 * 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const accessToken  = ref(null)
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY))
  const user         = ref(null)
  const tocId        = ref(null)
  const ready        = ref(false)
  let idleTimer = null

  const isAuthenticated = computed(() => !!accessToken.value || !!refreshToken.value)

  function persistRefresh(token) {
    refreshToken.value = token
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  }

  function applyTokens({ access, refresh }) {
    accessToken.value = access || null
    if (refresh !== undefined) persistRefresh(refresh || null)
    const claims = decodeJwt(access)
    if (claims?.toc_id) tocId.value = claims.toc_id
  }

  function resetSessionTimer() {
    if (idleTimer) clearTimeout(idleTimer)
    if (isAuthenticated.value) {
      idleTimer = setTimeout(() => { logout() }, IDLE_TIMEOUT_MS)
    }
  }

  async function login({ username, password, toc_id }) {
    const tocToSend = (toc_id || DEFAULT_TOC_ID || '').trim()
    if (!tocToSend) {
      throw new ApiError({ status: 400, data: { toc_id: 'missing — set VITE_DEFAULT_TOC_ID in .env' } })
    }
    const tokens = await api.postPublic('/auth/login/', {
      username,
      password,
      toc_id: tocToSend,
    })
    applyTokens(tokens)
    await fetchProfile()
    resetSessionTimer()
  }

  async function refresh() {
    if (!refreshToken.value) {
      throw new ApiError({ status: 401, data: { detail: 'No refresh token.' } })
    }
    const tokens = await api.postPublic('/auth/refresh/', { refresh: refreshToken.value })
    applyTokens(tokens)
  }

  async function logout({ skipServer = false } = {}) {
    const rt = refreshToken.value
    if (!skipServer && rt && accessToken.value) {
      try { await api.post('/auth/logout/', { refresh: rt }) } catch { /* clear locally regardless */ }
    }
    accessToken.value = null
    user.value = null
    tocId.value = null
    persistRefresh(null)
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
  }

  async function fetchProfile() {
    const claims = decodeJwt(accessToken.value)
    if (!claims?.user_id) return
    try {
      const data = await api.get(`/auth/users/${claims.user_id}/`)
      user.value = {
        user_id: data.user_id,
        username: data.username,
        first_name: data.first_name,
        surname: data.surname,
        email_address: data.email_address,
        roles: data.roles || [],
        initials: ((data.first_name?.[0] || '') + (data.surname?.[0] || '')).toUpperCase(),
      }
    } catch (err) {
      console.warn('fetchProfile failed', err)
    }
  }

  async function hydrate() {
    if (refreshToken.value) {
      try {
        await refresh()
        await fetchProfile()
        resetSessionTimer()
      } catch {
        await logout({ skipServer: true })
      }
    }
    ready.value = true
  }

  function hasPermission(_permission) {
    return isAuthenticated.value
  }

  return {
    accessToken, refreshToken, user, tocId, ready, isAuthenticated,
    login, refresh, logout, fetchProfile, hydrate, resetSessionTimer, hasPermission,
  }
})
