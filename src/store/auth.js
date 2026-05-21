import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sanitizeString, generateCSRFToken } from '@/utils/security.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref({
    id: 1,
    name: 'Asif Ansari',
    email: 'asif@divyaltech.com',
    role: 'Admin',
    initials: 'AA',
    toc_id: '',   // populated after login; empty = fallback to DEFAULT_TOC_ID in API layer
    permissions: ['dashboard', 'cases', 'admin', 'reports']
  })
  const csrfToken = ref(generateCSRFToken())
  const sessionTimeout = ref(null)
  const SESSION_DURATION = 30 * 60 * 1000

  const isAuthenticated = computed(() => !!user.value)

  function login(credentials) {
    const username = sanitizeString(credentials.username)
    if (!username) return { success: false, error: 'Invalid credentials' }

    if (username === 'admin' && credentials.password === 'Admin@1234') {
      user.value = {
        id: 1,
        name: 'Asif Ansari',
        email: 'asif@divyaltech.com',
        role: 'Admin',
        initials: 'AA',
        toc_id: '',   // set from JWT once auth is wired up; empty = use backend default
        permissions: ['dashboard', 'cases', 'admin', 'reports']
      }
      resetSessionTimer()
      csrfToken.value = generateCSRFToken()
      return { success: true }
    }
    return { success: false, error: 'Invalid username or password' }
  }

  function logout() {
    user.value = null
    csrfToken.value = generateCSRFToken()
    clearTimeout(sessionTimeout.value)
  }

  function resetSessionTimer() {
    clearTimeout(sessionTimeout.value)
    sessionTimeout.value = setTimeout(logout, SESSION_DURATION)
  }

  function hasPermission(permission) {
    return user.value?.permissions?.includes(permission) ?? false
  }

  return { user, csrfToken, isAuthenticated, login, logout, hasPermission, resetSessionTimer }
})
