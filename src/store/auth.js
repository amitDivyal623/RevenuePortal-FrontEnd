import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateCSRFToken } from '@/utils/security.js'
import { authApi, configureApi } from '@/services/api.js'

const ACCESS_KEY  = 'rp_access_token'
const REFRESH_KEY = 'rp_refresh_token'
const USER_KEY    = 'rp_user'

const SESSION_DURATION = 30 * 60 * 1000  // 30 min inactivity timeout

// ── JWT helpers ───────────────────────────────────────────────────────────────

function decodePayload(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
  } catch { return null }
}

function tokenIsValid(token) {
  if (!token) return false
  const p = decodePayload(token)
  return !!p && p.exp * 1000 > Date.now()
}

function buildUserProfile(accessToken) {
  const p = decodePayload(accessToken)
  if (!p) return null
  return {
    user_id:  p.user_id,
    toc_id:   p.toc_id,
    // Backend does not embed name/email in JWT — populated after first /me call
    // For now derive initials from user_id so the topbar has something to show
    name:     p.name     || p.user_id || 'Agent',
    email:    p.email    || '',
    role:     p.role     || '',
    initials: p.initials || (p.user_id || 'A').slice(0, 2).toUpperCase(),
    permissions: p.permissions || ['dashboard', 'cases', 'admin', 'reports'],
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {

  // Restore persisted state
  const _storedAccess  = localStorage.getItem(ACCESS_KEY)  || ''
  const _storedRefresh = localStorage.getItem(REFRESH_KEY) || ''
  const _storedUser    = (() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
  })()

  const _sessionValid = !!_storedUser && !!_storedRefresh

  // ── Reactive state ────────────────────────────────────────────────────────
  const accessToken    = ref(_sessionValid && tokenIsValid(_storedAccess) ? _storedAccess : '')
  const refreshToken   = ref(_sessionValid ? _storedRefresh : '')
  const user           = ref(_sessionValid ? _storedUser : null)
  const csrfToken      = ref(generateCSRFToken())
  const sessionTimeout = ref(null)

  if (!_sessionValid) {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!user.value)
  const tocId           = computed(() => user.value?.toc_id ?? '')

  // ── Session timer ─────────────────────────────────────────────────────────
  function resetSessionTimer() {
    clearTimeout(sessionTimeout.value)
    sessionTimeout.value = setTimeout(logout, SESSION_DURATION)
  }

  // ── Token accessors used by configureApi ──────────────────────────────────
  function getAccessToken()  { return accessToken.value }
  function getRefreshToken() { return refreshToken.value }

  function _setTokens(access, refresh) {
    accessToken.value  = access
    refreshToken.value = refresh || refreshToken.value
    localStorage.setItem(ACCESS_KEY,  access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  }

  function _setUser(profile) {
    user.value = profile
    localStorage.setItem(USER_KEY, JSON.stringify(profile))
  }

  // Wire up the API module so it can call refresh transparently
  configureApi({
    getAccessToken,
    getRefreshToken,
    onTokenRefreshed(newAccess, newRefresh) {
      _setTokens(newAccess, newRefresh)
    },
    onAuthFailure() {
      _clearSession()
      // Redirect to login — import router lazily to avoid circular dep
      import('@/router/index.js').then(({ default: router }) => {
        router.push({ name: 'login' })
      })
    },
  })

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login({ username, password, toc_id }) {
    const data = await authApi.login(username, password, toc_id)
    // data = { access, refresh }
    _setTokens(data.access, data.refresh)
    const profile = buildUserProfile(data.access)
    profile.name     = username
    profile.initials = username.slice(0, 2).toUpperCase()
    _setUser(profile)
    csrfToken.value = generateCSRFToken()
    resetSessionTimer()
    return { success: true }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    const access  = accessToken.value
    const refresh = refreshToken.value
    _clearSession()

    if (refresh && access) {
      // Best-effort — do not await; session is already cleared locally
      authApi.logout(refresh, access).catch(() => {})
    }
  }

  function _clearSession() {
    user.value         = null
    accessToken.value  = ''
    refreshToken.value = ''
    csrfToken.value    = generateCSRFToken()
    clearTimeout(sessionTimeout.value)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getAuthHeaders() {
    return accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}
  }

  function hasPermission(permission) {
    return user.value?.permissions?.includes(permission) ?? false
  }

  return {
    user,
    accessToken,
    csrfToken,
    isAuthenticated,
    tocId,
    getAuthHeaders,
    login,
    logout,
    hasPermission,
    resetSessionTimer,
  }
})
