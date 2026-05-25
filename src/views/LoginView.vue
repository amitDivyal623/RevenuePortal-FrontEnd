<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-mark">A</div>
        <span class="brand-name">AgentPortal</span>
      </div>

      <h1 class="login-title">Sign in to your account</h1>
      <p class="login-sub">Enter your credentials to continue</p>

      <form class="login-form" @submit.prevent="handleSubmit" novalidate autocomplete="off">
        <input type="hidden" name="_csrf" :value="auth.csrfToken" />

        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="Enter your username"
            autocomplete="username"
            spellcheck="false"
            maxlength="100"
            :aria-invalid="!!errors.username"
            @input="clearError('username')"
          />
          <span v-if="errors.username" class="form-error" role="alert">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Enter your password"
            autocomplete="current-password"
            maxlength="128"
            @input="clearError('password')"
          />
          <span v-if="errors.password" class="form-error" role="alert">{{ errors.password }}</span>
        </div>

        <div v-if="loginError" class="alert alert-danger" role="alert">{{ loginError }}</div>

        <button type="submit" class="btn btn-primary login-submit" :disabled="isLoading">
          <span>{{ isLoading ? 'Signing in…' : 'Sign in' }}</span>
        </button>
      </form>

      <div class="demo-hint">
        Dev credentials: <code>admin</code> / <code>Admin@1234</code>
      </div>
    </div>

    <footer class="login-footer">© 2026 Agent Portal</footer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { sanitizeString, checkRateLimit } from '@/utils/security.js'
import { ApiError } from '@/services/api.js'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

// toc_id is injected from the Vite environment variable set per deployment.
// For local dev this is set to DEV-TOC-001 in .env.
const TOC_ID = import.meta.env.VITE_DEFAULT_TOC_ID || ''

const form       = reactive({ username: '', password: '' })
const errors     = reactive({ username: '', password: '' })
const loginError = ref('')
const isLoading  = ref(false)

function clearError(field) {
  errors[field] = ''
  loginError.value = ''
}

function validate() {
  let valid = true
  if (!form.username.trim()) { errors.username = 'Username is required'; valid = false }
  if (!form.password)        { errors.password = 'Password is required'; valid = false }
  return valid
}

async function handleSubmit() {
  if (!validate()) return

  if (!checkRateLimit('login', 5, 15 * 60 * 1000)) {
    loginError.value = 'Too many attempts. Please wait 15 minutes.'
    return
  }

  isLoading.value  = true
  loginError.value = ''

  try {
    await auth.login({
      username: sanitizeString(form.username),
      password: form.password,
      toc_id:   TOC_ID,
    })

    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/dashboard'
    router.push(redirect)
  } catch (err) {
    form.password = ''
    if (err instanceof ApiError) {
      if (err.status === 429) {
        loginError.value = 'Too many login attempts. Please try again later.'
      } else if (err.status === 400) {
        // Field-level errors from validators.py
        const fields = err.fieldErrors
        if (fields.username) errors.username = fields.username
        if (fields.password) errors.password = fields.password
        if (fields.toc_id)   loginError.value = `Configuration error: ${fields.toc_id}`
        if (!fields.username && !fields.password && !fields.toc_id) {
          loginError.value = err.message
        }
      } else {
        loginError.value = err.message || 'Invalid username or password'
      }
    } else {
      loginError.value = 'Unable to connect to the server. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px 20px;
  background: var(--bg-page);
  font-family: var(--font-body);
}
.login-card {
  width: 100%; max-width: 400px;
  background: #fff;
  border-radius: var(--radius);
  padding: 36px 32px;
  box-shadow: var(--shadow);
}
.login-brand {
  display: flex; align-items: center; gap: 10px;
  justify-content: center;
  margin-bottom: 28px;
}
.brand-mark {
  width: 32px; height: 32px;
  border-radius: var(--radius);
  background: var(--primary);
  color: #fff;
  font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.brand-name {
  font-weight: 600; font-size: 18px;
  color: var(--text-strong);
}
.login-title {
  font-size: 20px; font-weight: 600;
  color: var(--text-strong);
  text-align: center;
  margin-bottom: 6px;
}
.login-sub {
  font-size: 13px;
  color: var(--text-light);
  text-align: center;
  margin-bottom: 24px;
}
.login-form { display: flex; flex-direction: column; gap: 16px; }
.login-submit { padding: 10px; font-size: 13px; margin-top: 4px; }
.demo-hint {
  margin-top: 22px; padding: 10px 14px;
  background: var(--bg-page);
  border-radius: var(--radius);
  font-size: 12px; color: var(--text-light);
  text-align: center;
}
.demo-hint code {
  background: var(--primary-light);
  color: var(--primary);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 2px;
}
.login-footer { margin-top: 20px; font-size: 12px; color: var(--text-light); }
</style>
