<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Actions</h1></div>
      <div class="breadcrumb"><a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Actions</span></div>
    </div>

    <div class="stat-grid">
      <div v-for="k in kpis" :key="k.label" class="stat-card">
        <div :class="`stat-icon stat-icon-${k.color}`" v-html="k.icon"></div>
        <div class="stat-content">
          <p class="stat-label">{{ k.label }}</p>
          <p class="stat-value">{{ k.value }}</p>
        </div>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Open actions ({{ filteredActions.length }})</div>
        <div class="flex items-center gap-sm">
          <select v-model="filterPriority" style="width:auto;padding:5px 10px;font-size:12px">
            <option value="">All priorities</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select v-model="filterStatus" style="width:auto;padding:5px 10px;font-size:12px">
            <option value="">All statuses</option>
            <option>Open</option><option>In progress</option><option>Overdue</option><option>Completed</option>
          </select>
          <button class="btn btn-primary btn-sm">+ Add action</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action ID</th><th>Case no</th><th>Description</th>
              <th>Assigned to</th><th>Priority</th><th>Due date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredActions" :key="row.id">
              <td class="link-cell">{{ row.actionId }}</td>
              <td><span class="link-cell">{{ row.caseNo }}</span></td>
              <td>{{ row.desc }}</td>
              <td>
                <div class="cell-user">
                  <div :class="`avatar avatar-sm avatar-${row.avatarColor}`">{{ row.initials }}</div>
                  <span>{{ row.assignee }}</span>
                </div>
              </td>
              <td><span :class="`badge badge-${priorityColor(row.priority)}`">{{ row.priority }}</span></td>
              <td :class="row.overdue ? 'overdue' : 'text-light'">{{ row.due }}</td>
              <td><span :class="`badge badge-${actionStatusColor(row.status)}`">{{ row.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const filterPriority = ref('')
const filterStatus = ref('')

const kpis = [
  { label:'Total open', value:'24', color:'indigo',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>` },
  { label:'Overdue', value:'5', color:'red',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { label:'In progress', value:'11', color:'orange',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { label:'Completed', value:'47', color:'green',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` }
]

const colors = ['indigo','green','orange','pink','blue','purple']
const initials = ['JS','AA','RP','MK']

const actions = ref(Array.from({length:18}, (_,i) => ({
  id: i+1,
  actionId: `ACT-${1000+i}`,
  caseNo: `EMR/UFN/${String(37000+i).padStart(6,'0')}`,
  desc: ['Send warning letter','Court booking required','Appeal review','Payment follow-up','Address verification'][i%5],
  assignee: ['J. Smith','A. Ansari','R. Patel','M. Khan'][i%4],
  initials: initials[i%4],
  avatarColor: colors[i%colors.length],
  priority: ['High','Medium','Low'][i%3],
  due: `2026-05-${String((i%28)+1).padStart(2,'0')}`,
  status: ['Open','In progress','Overdue','Completed'][i%4],
  overdue: i%4 === 2
})))

const filteredActions = computed(() =>
  actions.value.filter(a =>
    (!filterPriority.value || a.priority === filterPriority.value) &&
    (!filterStatus.value   || a.status   === filterStatus.value)
  )
)

function priorityColor(p) { return { High:'danger', Medium:'warning', Low:'info' }[p] ?? 'neutral' }
function actionStatusColor(s) {
  return { 'Open':'info', 'In progress':'warning', 'Overdue':'danger', 'Completed':'success' }[s] ?? 'neutral'
}
</script>

<style scoped>
.overdue { color: var(--danger); font-weight: 600; }
</style>
