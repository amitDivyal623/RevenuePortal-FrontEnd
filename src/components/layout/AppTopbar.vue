<template>
  <header class="topbar" role="banner">
    <div class="topbar-left">
      <button class="menu-btn" @click="$emit('toggle-sidebar')" aria-label="Toggle menu">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Menu
      </button>

      <div class="search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" class="search-icon">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="search-input"
          maxlength="100"
          aria-label="Search"
        />
      </div>
    </div>

    <div class="topbar-right">
      <button class="icon-btn" aria-label="Notifications">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notif-dot"></span>
      </button>

      <button class="icon-btn" aria-label="Messages">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>
        </svg>
        <span class="notif-dot"></span>
      </button>

      <div class="user-menu" ref="userMenuRef">
        <button class="user-btn" @click="userOpen = !userOpen" :aria-expanded="userOpen" aria-haspopup="true">
          <div class="avatar avatar-md avatar-indigo">{{ user?.initials }}</div>
          <div class="user-info">
            <span class="user-name">{{ user?.name }}</span>
            <span class="user-role">{{ user?.role }}</span>
          </div>
        </button>

        <div v-if="userOpen" class="user-dropdown" role="menu">
          <div class="dd-head">
            <p class="dd-name">{{ user?.name }}</p>
            <p class="dd-email">{{ user?.email }}</p>
          </div>
          <div class="dd-divider"></div>
          <button class="dd-item" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </button>
          <button class="dd-item" role="menuitem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <div class="dd-divider"></div>
          <button class="dd-item danger" role="menuitem" @click="logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const userOpen = ref(false)
const searchQuery = ref('')
const userMenuRef = ref(null)

async function logout() {
  userOpen.value = false
  await auth.logout()
  router.replace({ name: 'login' })
}

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<style scoped>
.topbar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px;
  position: sticky; top: 0; z-index: 100;
}

.topbar-left {
  display: flex; align-items: center;
  gap: 16px;
  flex: 1;
}

.menu-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  font-size: 12px; font-weight: 500;
  transition: background var(--transition);
}
.menu-btn:hover { background: var(--primary-hover); }

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 320px;
}
.search-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  pointer-events: none;
}
.search-input {
  padding: 7px 12px 7px 34px;
  background: transparent;
  border-color: transparent;
  font-size: 13px;
}
.search-input:hover {
  background: var(--bg-page);
}
.search-input:focus {
  background: #fff;
  border-color: var(--primary);
}

.topbar-right {
  display: flex; align-items: center;
  gap: 14px;
}

.icon-btn {
  width: 32px; height: 32px;
  border-radius: var(--radius);
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: all var(--transition);
}
.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-strong);
}
.notif-dot {
  position: absolute; top: 6px; right: 6px;
  width: 7px; height: 7px;
  background: var(--danger);
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-menu { position: relative; }
.user-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 4px;
  border-radius: var(--radius);
  transition: background var(--transition);
}
.user-btn:hover { background: var(--bg-hover); }

.user-info {
  display: flex; flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  margin-right: 6px;
}
.user-name {
  font-size: 13px; font-weight: 600;
  color: var(--text-strong);
}
.user-role {
  font-size: 11px;
  color: var(--text-light);
}

.user-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px);
  width: 220px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  z-index: 1100;
  overflow: hidden;
  padding: 6px;
}
.dd-head {
  padding: 12px;
}
.dd-name {
  font-size: 13px; font-weight: 600;
  color: var(--text-strong);
}
.dd-email {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 2px;
}
.dd-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
.dd-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 12px;
  font-size: 13px; color: var(--text-default);
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}
.dd-item:hover { background: var(--bg-hover); }
.dd-item.danger { color: var(--danger); }
.dd-item.danger:hover { background: var(--danger-bg); }

@media (max-width: 768px) {
  .user-info { display: none; }
  .search-wrap { display: none; }
}
</style>
