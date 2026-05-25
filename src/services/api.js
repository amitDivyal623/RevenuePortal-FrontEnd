const BASE = import.meta.env.VITE_API_BASE || '/api'

export class ApiError extends Error {
  constructor({ status, data }) {
    const message = (data && typeof data === 'object' && data.detail) || `Request failed (${status})`
    super(message)
    this.status = status
    this.data = data
  }
}

let refreshInFlight = null

async function loadAuth() {
  const { useAuthStore } = await import('@/store/auth.js')
  return useAuthStore()
}

async function rawRequest(path, opts, token) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, { ...opts, headers })
  const text = await resp.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  return { status: resp.status, ok: resp.ok, data }
}

export async function request(path, opts = {}, { skipAuth = false, retried = false } = {}) {
  const auth = skipAuth ? null : await loadAuth()
  const token = auth?.accessToken ?? null
  const resp = await rawRequest(path, opts, token)

  if (resp.ok) return resp.data

  if (resp.status === 401 && !skipAuth && !retried && auth?.refreshToken) {
    try {
      if (!refreshInFlight) refreshInFlight = auth.refresh().finally(() => { refreshInFlight = null })
      await refreshInFlight
      return request(path, opts, { skipAuth, retried: true })
    } catch {
      await auth.logout({ skipServer: true })
      throw new ApiError(resp)
    }
  }

  throw new ApiError(resp)
}

export const apiGet  = (path, opts = {})       => request(path, { ...opts, method: 'GET' })
export const apiPost = (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body: JSON.stringify(body) })
export const apiPut  = (path, body, opts = {}) => request(path, { ...opts, method: 'PUT',  body: JSON.stringify(body) })
export const apiDel  = (path, opts = {})       => request(path, { ...opts, method: 'DELETE' })

export const apiPostPublic = (path, body, opts = {}) =>
  request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }, { skipAuth: true })
