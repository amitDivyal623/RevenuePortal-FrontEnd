<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Payments</h1></div>
      <div class="breadcrumb"><a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Payments</span></div>
    </div>

    <!-- Summary cards -->
    <div class="stat-grid">
      <div v-for="s in summaryStats" :key="s.label" class="stat-card">
        <div :class="`stat-icon stat-icon-${s.color}`" v-html="s.icon"></div>
        <div class="stat-content">
          <p class="stat-label">{{ s.label }}</p>
          <p class="stat-value">{{ s.value }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">Search filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Reference</label>
          <input v-model="filters.ref" type="text" placeholder="Payment reference" maxlength="50" />
        </div>
        <div class="form-group">
          <label class="form-label">Date from</label>
          <input v-model="filters.from" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Date to</label>
          <input v-model="filters.to" type="date" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="filters.status">
            <option value="">All</option>
            <option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm mt-md">
        <button class="btn btn-primary btn-sm" @click="page=1">Search</button>
        <button class="btn btn-secondary btn-sm" @click="resetFilters">Clear filters</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card card-padded">
      <div class="flex justify-between items-center mb-md">
        <div class="card-title" style="margin-bottom:0">Payment records</div>
        <span class="text-sm text-light">{{ rows.length }} records</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th><th>Case number</th><th>Offender</th>
              <th style="text-align:right">Amount</th><th>Method</th><th>Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in pagedRows" :key="r.id">
              <td class="link-cell">{{ r.ref }}</td>
              <td><span class="link-cell">{{ r.caseNo }}</span></td>
              <td>{{ r.offender }}</td>
              <td style="text-align:right"><strong>£{{ r.amount }}</strong></td>
              <td>{{ r.method }}</td>
              <td class="text-light">{{ r.date }}</td>
              <td><span :class="`badge badge-${statusColor(r.status)}`">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="page-btn" :disabled="page===1" @click="page--">‹ Prev</button>
        <button v-for="p in totalPages" :key="p" class="page-btn" :class="{active:p===page}" @click="page=p">{{ p }}</button>
        <button class="page-btn" :disabled="page===totalPages" @click="page++">Next ›</button>
        <span class="page-meta">Page {{ page }} of {{ totalPages }}</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const filters = reactive({ ref:'', from:'', to:'', status:'' })
const page = ref(1)
const perPage = 10

function resetFilters() { Object.assign(filters, { ref:'', from:'', to:'', status:'' }); page.value=1 }

const summaryStats = [
  { label:'Total collected', value:'£12,480', color:'green',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
  { label:'Pending', value:'£2,310', color:'orange',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
  { label:'Failed', value:'£340', color:'red',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
  { label:'Refunded', value:'£560', color:'indigo',
    icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>` }
]

const rows = ref(Array.from({length:38}, (_,i) => ({
  id: i+1,
  ref: `PAY-${2026000+i}`,
  caseNo: `EMR/PCN/${String(30000+i).padStart(6,'0')}`,
  offender: ['Miss HDFC Gautam','Mr John Smith','Miss T. Master','Mr Teddy GR'][i%4],
  amount: (Math.floor(Math.random()*500+50)).toFixed(2),
  method: ['Card','Cash','Online','BACS'][i%4],
  date: `2026-0${(i%5)+1}-${String((i%28)+1).padStart(2,'0')}`,
  status: ['Paid','Pending','Failed','Refunded'][i%4]
})))

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length/perPage)))
const pagedRows  = computed(() => rows.value.slice((page.value-1)*perPage, page.value*perPage))

function statusColor(s) {
  return { Paid:'success', Pending:'warning', Failed:'danger', Refunded:'info' }[s] ?? 'neutral'
}
</script>
