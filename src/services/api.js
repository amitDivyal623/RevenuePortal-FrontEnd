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

export const apiGet  = (path, opts = {})       => request(path, { ...opts, method: 'GET' })
export const apiPost = (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) })
export const apiPut  = (path, body, opts = {}) => request(path, { ...opts, method: 'PUT',  body: body instanceof FormData ? body : JSON.stringify(body) })
export const apiDel  = (path, opts = {})       => request(path, { ...opts, method: 'DELETE' })

export async function apiDownload(path, filename) {
  const auth = await loadAuth()
  const token = auth?.accessToken ?? null
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, { method: 'GET', headers })
  if (!resp.ok) throw new ApiError({ status: resp.status, data: null })
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// POST a JSON body and download the response as a file. Used for endpoints
// where the input list is large enough to exceed URL length (PRINT LABEL,
// CREATE LETTER selection, etc.) — apiDownload's GET-only signature can't
// carry the body.
export async function apiDownloadPost(path, body, filename) {
  const auth = await loadAuth()
  const token = auth?.accessToken ?? null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    // Try to surface the validation error JSON if the server returned one.
    let detail = null
    try { detail = await resp.json() } catch {}
    throw new ApiError({ status: resp.status, data: detail })
  }
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// POST a JSON body and return the response as a Blob. Lets the caller
// decide between opening in a new tab (VIEW SELECTED) or triggering a
// download (PRINT SELECTED). The response is treated as binary regardless
// of Content-Type — useful for inline-PDF responses where we don't want
// the request() helper to JSON.parse() the bytes.
export async function apiPostBlob(path, body) {
  const auth = await loadAuth()
  const token = auth?.accessToken ?? null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    let detail = null
    try { detail = await resp.json() } catch {}
    throw new ApiError({ status: resp.status, data: detail })
  }
  // Pull any soft-failures the backend flagged via X-Render-Failed so the
  // caller can surface them without breaking the PDF.
  const failedHeader = resp.headers.get('X-Render-Failed')
  let failed = null
  if (failedHeader) {
    try { failed = JSON.parse(failedHeader) } catch { failed = failedHeader }
  }
  const blob = await resp.blob()
  return { blob, failed }
}

export const apiPostPublic = (path, body, opts = {}) =>
  request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }, { skipAuth: true })

export const api = {
  get:    (path, opts = {})       => apiGet(path, opts),
  post:   (path, body, opts = {}) => apiPost(path, body, opts),
  put:    (path, body, opts = {}) => apiPut(path, body, opts),
  delete: (path, opts = {})       => apiDel(path, opts),
  postPublic: (path, body, opts = {})     => request(path, { ...opts, method: 'POST', body: JSON.stringify(body) }, { skipAuth: true }),
  upload:     (path, formData, opts = {}) => request(path, { ...opts, method: 'POST', body: formData }),
}
