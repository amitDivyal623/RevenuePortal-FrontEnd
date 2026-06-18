<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">403</div>
      <h1 class="error-title">Access denied</h1>
      <p class="error-desc">You don't have permission to access this page. Contact your administrator.</p>
      <RouterLink :to="landingRoute" class="btn btn-primary">← Go to my home page</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()
const landingRoute = computed(() => auth.defaultLandingRoute())
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-page);
  padding: 40px 20px;
  font-family: var(--font-body);
}
.error-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 48px 40px;
  text-align: center;
  max-width: 420px;
  box-shadow: var(--shadow);
}
.error-code {
  font-size: 64px; font-weight: 700;
  color: var(--danger);
  line-height: 1;
  margin-bottom: 12px;
  letter-spacing: -0.03em;
}
.error-title {
  font-size: 20px; font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 8px;
}
.error-desc {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 24px;
}
</style>
