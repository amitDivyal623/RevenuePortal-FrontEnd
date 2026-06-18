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
    // Bootstrap roles from the JWT immediately so routing and nav decisions
    // don't have to wait for the async fetchProfile() call to complete.
    // fetchProfile() still runs to enrich display fields (name, email, initials).
    if (claims?.user_id) {
      const jwtRoles = Array.isArray(claims.roles)
        ? claims.roles.map(name => ({ name }))
        : []
      if (!user.value) {
        user.value = { user_id: claims.user_id, roles: jwtRoles }
      } else {
        user.value.user_id = claims.user_id
        user.value.roles   = jwtRoles
      }
    }
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

  // Maps abstract route permission names (meta.permission) to required roles.
  // Any match in the array is sufficient (OR logic).
  const PERMISSION_ROLES = {
    dashboard: [],                                                       // any authenticated user
    cases:     ['RevpAdminUser', 'RevpAgentUser'],
    admin:     ['RevpAdminUser'],
    station:   ['RevpAdminUser', 'RP Station Config'],                   // station mgmt + car park
    ir:        ['IR Report History'],                                      // intelligence reports — requires primary role via 'cases' too
  }

  function hasRole(roleName) {
    return (user.value?.roles || []).some(r => r.name === roleName)
  }

  function hasPermission(permission) {
    if (!isAuthenticated.value) return false
    const required = PERMISSION_ROLES[permission]
    if (!required || required.length === 0) return true
    return required.some(r => hasRole(r))
  }

  // Returns the first route path this user can actually access.
  // Priority mirrors the old ColdFusion post-login routing:
  //   Agent/Admin → Case List → (admin sub-pages) → Dashboard
  function defaultLandingRoute() {
    if (hasPermission('cases'))   return '/cases'
    if (hasPermission('admin'))   return '/admin/courts'
    if (hasPermission('station')) return '/admin/station-mgmt'
    return '/dashboard'
  }

  return {
    accessToken, refreshToken, user, tocId, ready, isAuthenticated,
    login, refresh, logout, fetchProfile, hydrate, resetSessionTimer,
    hasPermission, hasRole, defaultLandingRoute,
  }
})
