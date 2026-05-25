/**
 * API service — thin fetch wrapper around the Django REST backend.
 *
 * All requests go through the Vite dev-server proxy (/api → http://localhost:8000),
 * so no absolute base URL is needed here.
 *
 * Token refresh:
 *   On a 401, this module tries one silent refresh via /api/auth/refresh/.
 *   If the refresh succeeds the original request is retried once.
 *   If the refresh fails the auth store is cleared and the user is redirected
 *   to /login.
 *
 * Usage:
 *   import { api } from '@/services/api.js'
 *   const data = await api.post('/api/auth/login/', { username, password, toc_id })
 *   const users = await api.get('/api/auth/users/')
 */

const BASE = ''  // proxied by Vite — no host needed

// ── Token store (module-level so the store can import without circular deps) ──

let _getAccessToken = () => ''
let _getRefreshToken = () => ''
let _onTokenRefreshed = (_access, _refresh) => {}
let _onAuthFailure = () => {}

export function configureApi({ getAccessToken, getRefreshToken, onTokenRefreshed, onAuthFailure }) {
  _getAccessToken = getAccessToken
  _getRefreshToken = getRefreshToken
  _onTokenRefreshed = onTokenRefreshed
  _onAuthFailure = onAuthFailure
}

// ── Internals ─────────────────────────────────────────────────────────────────

let _refreshing = null  // Promise<boolean> | null — prevents concurrent refresh calls

async function _refresh() {
  if (_refreshing) return _refreshing

  _refreshing = (async () => {
    const refreshToken = _getRefreshToken()
    if (!refreshToken) return false

    try {
      const res = await fetch(`${BASE}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (!res.ok) return false

      const data = await res.json()
      _onTokenRefreshed(data.access, data.refresh || refreshToken)
      return true
    } catch {
      return false
    } finally {
      _refreshing = null
    }
  })()

  return _refreshing
}

async function _request(method, path, body, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }

  const access = _getAccessToken()
  if (access) headers['Authorization'] = `Bearer ${access}`

  const fetchOpts = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }

  let res = await fetch(`${BASE}${path}`, fetchOpts)

  // Silent token refresh on 401 — try once
  if (res.status === 401 && !opts._retried) {
    const refreshed = await _refresh()
    if (refreshed) {
      const newAccess = _getAccessToken()
      if (newAccess) headers['Authorization'] = `Bearer ${newAccess}`
      res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers })
    } else {
      _onAuthFailure()
      const err = new ApiError(401, { detail: 'Session expired. Please log in again.' })
      throw err
    }
  }

  if (!res.ok) {
    let detail
    try { detail = await res.json() } catch { detail = { detail: res.statusText } }
    throw new ApiError(res.status, detail)
  }

  // 204 No Content
  if (res.status === 204) return null

  return res.json()
}

// ── Public API object ─────────────────────────────────────────────────────────

export const api = {
  get:    (path, opts)        => _request('GET',    path, undefined, opts),
  post:   (path, body, opts)  => _request('POST',   path, body,      opts),
  put:    (path, body, opts)  => _request('PUT',    path, body,      opts),
  patch:  (path, body, opts)  => _request('PATCH',  path, body,      opts),
  delete: (path, opts)        => _request('DELETE', path, undefined, opts),
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {object} body    Parsed JSON error body from the backend
   */
  constructor(status, body) {
    super(ApiError._message(body))
    this.status = status
    this.body = body
  }

  static _message(body) {
    if (!body) return 'Unknown error'
    if (typeof body === 'string') return body
    if (body.detail) return String(body.detail)
    // DRF field-level errors: { field: ['msg'] }
    const first = Object.values(body).flat().find(v => typeof v === 'string')
    return first || 'Request failed'
  }

  /** Returns a human-readable field-level error map for form display. */
  get fieldErrors() {
    if (!this.body || typeof this.body !== 'object') return {}
    return Object.fromEntries(
      Object.entries(this.body)
        .filter(([, v]) => Array.isArray(v) || typeof v === 'string')
        .map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : v])
    )
  }
}

// ── Auth-specific helpers (no auth headers — public endpoints) ────────────────

export const authApi = {
  login(username, password, toc_id) {
    return fetch(`${BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, toc_id }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new ApiError(res.status, data)
      return data  // { access, refresh }
    })
  },

  logout(refreshToken, accessToken) {
    return fetch(`${BASE}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).then(async res => {
      // Treat any non-5xx as success — token may already be blacklisted
      if (res.status >= 500) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError(res.status, data)
      }
    })
  },
}
