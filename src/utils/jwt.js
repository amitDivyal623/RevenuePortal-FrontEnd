export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function isJwtExpired(token, skewSeconds = 10) {
  const claims = decodeJwt(token)
  if (!claims?.exp) return true
  return Date.now() / 1000 >= claims.exp - skewSeconds
}
