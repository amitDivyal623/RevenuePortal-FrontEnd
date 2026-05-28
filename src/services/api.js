// Single transport layer for every service in the app. Services import
// `api` and call api.get / api.post / api.put / api.delete / api.upload /
// api.postPublic. Everything cross-cutting — Bearer token attach, 401 →
// refresh → retry, FormData detection, JSON parsing — lives here so the
// resource services and stores stay tiny.

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
  // FormData uploads need the browser to set Content-Type with a unique
  // multipart boundary — which it does automatically only when we don't
  // set the header ourselves. Detect and leave Content-Type alone for those.
  const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData
  const headers = { ...(opts.headers || {}) }
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, { ...opts, headers })
  const text = await resp.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  return { status: resp.status, ok: resp.ok, data }
}

async function request(path, opts = {}, { skipAuth = false, retried = false } = {}) {
  const auth = skipAuth ? null : await loadAuth()
  const token = auth?.accessToken ?? null
  const resp = await rawRequest(path, opts, token)

  if (resp.ok) return resp.data

  if (resp.status === 401 && !skipAuth && !retried && auth?.refreshToken) {
    try {
      // Dedupe parallel 401s so 10 in-flight requests trigger one refresh,
      // not 10. Every caller awaits the same promise, then retries once.
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

// The single object every service imports. Method names match the HTTP
// verbs so the call sites read naturally: api.get(path), api.post(path, body).
// `postPublic` skips the auth store entirely — use it for login, refresh,
// password-reset and anywhere a Bearer token must NOT be attached.
// `upload` posts FormData (rawRequest skips the JSON Content-Type for it).
export const api = {
  get:        (path, opts = {})           => request(path, { ...opts, method: 'GET' }),
  post:       (path, body, opts = {})     => request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }),
  put:        (path, body, opts = {})     => request(path, { ...opts, method: 'PUT',  body: JSON.stringify(body) }),
  delete:     (path, opts = {})           => request(path, { ...opts, method: 'DELETE' }),
  postPublic: (path, body, opts = {})     => request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }, { skipAuth: true }),
  upload:     (path, formData, opts = {}) => request(path, { ...opts, method: 'POST', body: formData }),
}
