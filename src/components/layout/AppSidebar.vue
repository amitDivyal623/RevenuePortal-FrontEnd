<template>
  <aside class="sidebar" role="navigation" aria-label="Main navigation">
    <div class="sidebar-brand">
      <div class="brand-mark">A</div>
      <span class="brand-name">AgentPortal</span>
    </div>

    <div class="sidebar-nav">

      <!-- Always visible -->
      <ul class="nav-section">
        <li>
          <RouterLink to="/dashboard" class="nav-item" :class="{ active: $route.name === 'dashboard' }">
            <span class="nav-icon" v-html="icons.home" aria-hidden="true"></span>
            <span class="nav-text">Homepage</span>
          </RouterLink>
        </li>
      </ul>
      <div class="nav-divider"></div>

      <!-- Revenue Protection — visible to RevpAdminUser, RevpAgentUser, OR RP Station Config -->
      <template v-if="isRevpUser || hasStationRole">
        <div class="nav-section-label">REVENUE PROTECTION</div>
        <ul class="nav-section">
          <!-- Case items: RevpAdminUser and RevpAgentUser only -->
          <template v-if="isRevpUser">
            <li>
              <RouterLink to="/dashboard" class="nav-item" :class="{ active: $route.name === 'rp-dashboard' }">
                <span class="nav-text">Dashboard</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/quick-case-search" class="nav-item" :class="{ active: $route.name === 'quick-case-search' }">
                <span class="nav-text">Quick Case Search</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/add-new-case" class="nav-item" :class="{ active: $route.name === 'add-new-case' }">
                <span class="nav-text">Add New Case</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/cases" class="nav-item" :class="{ active: $route.name === 'cases' }">
                <span class="nav-text">Case List</span>
              </RouterLink>
            </li>
            <!-- Intelligence Report — also requires IR Report History sub-role -->
            <li v-if="hasIRRole">
              <RouterLink to="/intelligence-report" class="nav-item" :class="{ active: $route.name === 'intelligence-report' }">
                <span class="nav-text">Intelligence Report</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/payment-records" class="nav-item" :class="{ active: $route.name === 'payment-records' }">
                <span class="nav-text">Payment Records</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/action-tracker" class="nav-item" :class="{ active: $route.name === 'action-tracker' }">
                <span class="nav-text">Action Tracker</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/print-queue" class="nav-item" :class="{ active: $route.name === 'print-queue' }">
                <span class="nav-text">Print Queue</span>
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/address-search" class="nav-item" :class="{ active: $route.name === 'address-search' }">
                <span class="nav-text">Perform Address Search</span>
              </RouterLink>
            </li>
            <!-- Court Booking — RevpAdminUser only -->
            <li v-if="isRevpAdmin">
              <RouterLink to="/court-booking" class="nav-item" :class="{ active: $route.name === 'court-booking' }">
                <span class="nav-text">Court Booking</span>
              </RouterLink>
            </li>
          </template>

          <!-- Revenue Protection Admin — RevpAdminUser OR RP Station Config -->
          <li v-if="isRevpAdmin || hasStationRole">
            <button
              class="nav-item"
              :class="{ open: openGroups.includes('rpAdmin'), 'has-active': rpAdminChildActive }"
              @click="toggleGroup('rpAdmin')"
              :aria-expanded="openGroups.includes('rpAdmin')"
            >
              <span class="nav-text">Revenue Protection Admin</span>
              <svg class="nav-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <ul v-if="openGroups.includes('rpAdmin')" class="nav-sub">
              <!-- Admin-only items: RevpAdminUser only -->
              <template v-if="isRevpAdmin">
                <li><RouterLink to="/admin/action-template"      class="nav-sub-item" :class="{ active: $route.name === 'action-template' }">Action Template</RouterLink></li>
                <li><RouterLink to="/admin/courts"               class="nav-sub-item" :class="{ active: $route.name === 'courts' }">Courts</RouterLink></li>
                <li><RouterLink to="/admin/ticket-pads"          class="nav-sub-item" :class="{ active: $route.name === 'ticket-pads' }">Ticket Pads</RouterLink></li>
                <li><RouterLink to="/admin/letter-templates"     class="nav-sub-item" :class="{ active: $route.name === 'letter-templates' }">Letter Templates</RouterLink></li>
                <li><RouterLink to="/admin/email-templates"      class="nav-sub-item" :class="{ active: $route.name === 'email-templates' }">Email Templates</RouterLink></li>
                <li><RouterLink to="/admin/print-templates"      class="nav-sub-item" :class="{ active: $route.name === 'print-templates' }">Print Templates</RouterLink></li>
                <li><RouterLink to="/admin/manual-case-initials" class="nav-sub-item" :class="{ active: $route.name === 'manual-case-initials' }">Manual Case Initials</RouterLink></li>
                <li><RouterLink to="/admin/offences"             class="nav-sub-item" :class="{ active: $route.name === 'offences' }">Offences</RouterLink></li>
                <li><RouterLink to="/admin/charges"              class="nav-sub-item" :class="{ active: $route.name === 'admin-charges' }">Charges and Appeals</RouterLink></li>
                <li><RouterLink to="/admin/casetype"             class="nav-sub-item" :class="{ active: $route.name === 'admin-casetype' }">Casetype Appeal Enabled</RouterLink></li>
                <li><RouterLink to="/admin/zero-fare"            class="nav-sub-item" :class="{ active: $route.name === 'zero-fare' }">Zero Fare For App Control</RouterLink></li>
                <li><RouterLink to="/admin/printer-app"          class="nav-sub-item" :class="{ active: $route.name === 'printer-app' }">Printer App Control</RouterLink></li>
                <li><RouterLink to="/admin/intel-config"         class="nav-sub-item" :class="{ active: $route.name === 'intel-config' }">Intelligence Report Config</RouterLink></li>
                <li><RouterLink to="/admin/auth-prosecutor"      class="nav-sub-item" :class="{ active: $route.name === 'auth-prosecutor' }">Authorising Prosecutor</RouterLink></li>
                <li><RouterLink to="/admin/lookup-values"        class="nav-sub-item" :class="{ active: $route.name === 'lookup-values' }">Lookup Values</RouterLink></li>
                <li><RouterLink to="/admin/address-log"          class="nav-sub-item" :class="{ active: $route.name === 'address-log' }">Address Search Log</RouterLink></li>
                <li><RouterLink to="/admin/letter-vars"          class="nav-sub-item" :class="{ active: $route.name === 'letter-vars' }">Letter Variable Lookup</RouterLink></li>
              </template>
              <!-- Station items: visible to RevpAdminUser AND RP Station Config -->
              <li><RouterLink to="/admin/station-mgmt"               class="nav-sub-item" :class="{ active: $route.name === 'station-mgmt' }">Station Management</RouterLink></li>
              <li><RouterLink to="/admin/station-mgmt/service-type"  class="nav-sub-item" :class="{ active: $route.name === 'service-type' }">Service Type Management</RouterLink></li>
              <li><RouterLink to="/admin/car-park"                   class="nav-sub-item" :class="{ active: $route.name === 'car-park' }">Car Park Locations</RouterLink></li>
              <!-- Admin-only items continued -->
              <template v-if="isRevpAdmin">
                <li><RouterLink to="/admin/remove-case"          class="nav-sub-item" :class="{ active: $route.name === 'remove-case' }">Remove Case Completely</RouterLink></li>
                <li><RouterLink to="/admin/users"                class="nav-sub-item" :class="{ active: $route.name === 'users' }">Users</RouterLink></li>
              </template>
            </ul>
          </li>
        </ul>
        <div class="nav-divider"></div>
      </template>

      <!-- Journey Finder — always visible -->
      <ul class="nav-section">
        <li>
          <RouterLink to="/dashboard" class="nav-item" :class="{ active: $route.name === 'journey-finder' }">
            <span class="nav-icon" v-html="icons.compass" aria-hidden="true"></span>
            <span class="nav-text">Journey Finder</span>
          </RouterLink>
        </li>
      </ul>

    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const $route = useRoute()
const auth = useAuthStore()
const openGroups = ref(['rpAdmin'])

const isRevpUser     = computed(() => auth.hasRole('RevpAdminUser') || auth.hasRole('RevpAgentUser'))
const isRevpAdmin    = computed(() => auth.hasRole('RevpAdminUser'))
const hasIRRole      = computed(() => auth.hasRole('IR Report History'))
const hasStationRole = computed(() => auth.hasRole('RP Station Config'))

const RP_ADMIN_ROUTES = [
  'action-template', 'courts', 'ticket-pads', 'letter-templates', 'email-templates',
  'print-templates', 'manual-case-initials', 'offences', 'admin-charges', 'admin-casetype',
  'zero-fare', 'printer-app', 'intel-config', 'auth-prosecutor', 'lookup-values',
  'address-log', 'letter-vars', 'station-mgmt', 'service-type', 'car-park', 'remove-case', 'users',
]
const rpAdminChildActive = computed(() => RP_ADMIN_ROUTES.includes($route.name))

function toggleGroup(name) {
  const i = openGroups.value.indexOf(name)
  i === -1 ? openGroups.value.push(name) : openGroups.value.splice(i, 1)
}

const icons = {
  home:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  compass: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  users:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
}


</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  min-width: var(--sidebar-w);
  background: #fff;
  border-right: 1px solid var(--border);
  height: 100vh;
  position: sticky; top: 0;
  display: flex; flex-direction: column;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}
.brand-mark {
  width: 30px; height: 30px;
  border-radius: var(--radius);
  background: var(--primary);
  color: #fff;
  font-weight: 700; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.brand-name {
  font-weight: 600; font-size: 16px;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}

.sidebar-nav {
  flex: 1;
  padding: 10px 14px 20px;
}
.nav-section { padding: 4px 0; }
.nav-section-label {
  font-size: 10px; font-weight: 600;
  color: var(--text-light);
  letter-spacing: 0.08em;
  padding: 12px 12px 6px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  width: 100%; text-align: left;
  font-size: 13px; font-weight: 500;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;
  margin-bottom: 1px;
  border: none;
  background: none;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-strong);
  text-decoration: none;
}
.nav-item.has-active { color: var(--text-strong); }
.nav-item.active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
}

.nav-icon {
  display: flex; align-items: center;
  flex-shrink: 0;
  color: inherit;
  opacity: 0.85;
}
.nav-item.active .nav-icon { opacity: 1; }

.nav-text { flex: 1; }
.nav-chevron {
  color: var(--text-light);
  transition: transform var(--transition);
  flex-shrink: 0;
}
.nav-item.open .nav-chevron { transform: rotate(180deg); }
.nav-item.active .nav-chevron { color: var(--primary); }

.nav-sub { padding: 2px 0 4px; }
.nav-sub-item {
  display: block;
  padding: 7px 12px 7px 28px;
  font-size: 12.5px;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  margin-bottom: 1px;
  transition: all var(--transition);
  text-decoration: none;
}
.nav-sub-item:hover {
  background: var(--bg-hover);
  color: var(--text-strong);
  text-decoration: none;
}
.nav-sub-item.active {
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-light);
}

.nav-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}
</style>
