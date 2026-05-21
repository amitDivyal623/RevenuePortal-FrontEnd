<template>
  <aside class="sidebar" role="navigation" aria-label="Main navigation">
    <div class="sidebar-brand">
      <div class="brand-mark">A</div>
      <span class="brand-name">AgentPortal</span>
    </div>

    <div class="sidebar-nav">
      <template v-for="(section, sIdx) in navSections" :key="sIdx">
        <div v-if="section.label" class="nav-section-label">{{ section.label }}</div>
        <ul class="nav-section">
          <li v-for="item in section.items" :key="item.name">
            <button
              v-if="item.children"
              class="nav-item"
              :class="{ open: openGroups.includes(item.name), 'has-active': hasActiveChild(item) }"
              @click="toggleGroup(item.name)"
              :aria-expanded="openGroups.includes(item.name)"
            >
              <span v-if="item.icon" class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
              <span class="nav-text">{{ item.label }}</span>
              <svg class="nav-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <ul v-if="item.children && openGroups.includes(item.name)" class="nav-sub">
              <li v-for="child in item.children" :key="child.name">
                <RouterLink :to="child.to" class="nav-sub-item" :class="{ active: $route.name === child.name }">
                  {{ child.label }}
                </RouterLink>
              </li>
            </ul>

            <RouterLink
              v-if="!item.children"
              :to="item.to"
              class="nav-item"
              :class="{ active: $route.name === item.name }"
            >
              <span v-if="item.icon" class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
              <span class="nav-text">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
        <div v-if="section.divider" class="nav-divider"></div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const $route = useRoute()
const openGroups = ref(['rpAdmin'])

function toggleGroup(name) {
  const i = openGroups.value.indexOf(name)
  i === -1 ? openGroups.value.push(name) : openGroups.value.splice(i, 1)
}
function hasActiveChild(item) {
  return item.children?.some(c => c.name === $route.name)
}

const icons = {
  home:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  pound:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 7c0-5.333-8-5.333-8 0"/><path d="M10 7v6h6"/><path d="M6 13h11"/><path d="M6 19h13"/></svg>`,
  compass: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  ticket:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4z"/><line x1="13" y1="5" x2="13" y2="7"/><line x1="13" y1="11" x2="13" y2="13"/><line x1="13" y1="17" x2="13" y2="19"/></svg>`,
  users:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  mobile:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  chart:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
}

const navSections = [
  {
    items: [
      { name: 'dashboard', label: 'Homepage', to: '/dashboard', icon: icons.home },
      {
        name: 'claims', label: 'Claims', icon: icons.pound,
        children: [
          { name: 'claims-list',    label: 'Claims list',    to: '/dashboard' },
          { name: 'claims-pending', label: 'Pending claims', to: '/dashboard' }
        ]
      }
    ],
    divider: true
  },
  {
    label: 'REVENUE PROTECTION',
    items: [
      { name: 'rp-dashboard',    label: 'Dashboard',              to: '/dashboard' },
      { name: 'quick-search',    label: 'Quick Case Search',      to: '/dashboard' },
      { name: 'add-case',        label: 'Add New Case',           to: '/dashboard' },
      { name: 'cases',           label: 'Case List',              to: '/cases' },
      { name: 'intel-report',    label: 'Intelligence Report',    to: '/dashboard' },
      { name: 'payment-records', label: 'Payment Records',        to: '/payment-records' },
      { name: 'action-tracker',  label: 'Action Tracker',         to: '/action-tracker' },
      { name: 'print-queue',     label: 'Print Queue',            to: '/print-queue' },
      { name: 'address-search',  label: 'Perform Address Search', to: '/dashboard' },
      { name: 'court-booking',   label: 'Court Booking',          to: '/dashboard' },
      {
        name: 'rpAdmin', label: 'Revenue Protection Admin',
        children: [
          { name: 'action-template',     label: 'Action Template',         to: '/admin/action-template' },
          { name: 'courts',              label: 'Courts',                  to: '/admin/courts' },
          { name: 'ticket-pads',         label: 'Ticket Pads',             to: '/admin/ticket-pads' },
          { name: 'letter-templates',    label: 'Letter Templates',        to: '/admin/letter-templates' },
          { name: 'email-templates',     label: 'Email Templates',         to: '/admin/email-templates' },
          { name: 'print-templates',     label: 'Print Templates',         to: '/admin/print-templates' },
          { name: 'manual-case-initials',label: 'Manual Case Initials',    to: '/admin/manual-case-initials' },
          { name: 'offences',            label: 'Offences',                to: '/admin/offences' },
          { name: 'admin-charges',       label: 'Charges and Appeals',     to: '/admin/charges' },
          { name: 'admin-casetype',      label: 'Casetype Appeal Enabled', to: '/admin/casetype' },
          { name: 'zero-fare',           label: 'Zero Fare For App Control', to: '/admin/zero-fare' },
          { name: 'printer-app',         label: 'Printer App Control',     to: '/admin/printer-app' },
          { name: 'intel-config',        label: 'Intelligence Report Config', to: '/admin/intel-config' },
          { name: 'auth-prosecutor',     label: 'Authorising Prosecutor',  to: '/admin/auth-prosecutor' },
          { name: 'lookup-values',       label: 'Lookup Values',           to: '/admin/lookup-values' },
          { name: 'address-log',         label: 'Address Search Log',      to: '/admin/address-log' },
          { name: 'letter-vars',         label: 'Letter Variable Lookup',  to: '/admin/letter-vars' },
          { name: 'station-mgmt',        label: 'Station Management',      to: '/admin/station-mgmt' },
          { name: 'service-type',        label: 'Service Type Management', to: '/admin/station-mgmt/service-type' },
          { name: 'car-park',            label: 'Car Park Locations',      to: '/admin/car-park' },
          { name: 'remove-case',         label: 'Remove Case Completely',  to: '/admin/remove-case' }
        ]
      }
    ],
    divider: true
  },
  {
    items: [
      { name: 'journey-finder',  label: 'Journey Finder',       to: '/dashboard', icon: icons.compass },
      { name: 'ticket-enquiry',  label: 'Ticket Enquiry',       to: '/dashboard', icon: icons.ticket },
      { name: 'users',           label: 'Users',                to: '/dashboard', icon: icons.users },
      {
        name: 'charmMobile', label: 'CHARM Mobile', icon: icons.mobile,
        children: [
          { name: 'charm-cases',    label: 'CHARM Cases',    to: '/dashboard' },
          { name: 'charm-devices',  label: 'CHARM Devices',  to: '/dashboard' }
        ]
      },
      { name: 'individual-reporting', label: 'Individual Reporting', to: '/dashboard', icon: icons.chart }
    ]
  }
]
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
