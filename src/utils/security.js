/**
 * Security utilities for Agent Portal v4
 * No v-html anywhere - Vue auto-escapes {{ }} bindings.
 */

export function sanitizeString(input) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>'"`;]/g, '')
    .trim()
    .slice(0, 255)
}

export function generateCSRFToken() {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export function isAlphanumeric(str) {
  return /^[a-zA-Z0-9\s\-_.@]+$/.test(str)
}

const attempts = new Map()
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const entry = attempts.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count++
  attempts.set(key, entry)
  return entry.count <= maxAttempts
}
