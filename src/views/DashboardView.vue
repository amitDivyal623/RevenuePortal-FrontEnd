<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Dashboard</h1></div>
      <div class="breadcrumb">
        <a href="#" @click.prevent>Home</a> / <span class="breadcrumb-active">Dashboard</span>
      </div>
    </div>

    <!-- Error banner — set by the store when any widget fetch fails. -->
    <div v-if="error" class="alert alert-danger mb-md" role="alert"
         style="padding:0.75rem 1rem;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;">
      {{ error }}
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Row 1: Prosecution Summary (pie/donut) + Recently Accessed Cases
         ───────────────────────────────────────────────────────────── -->
    <div class="dash-grid">
      <div class="card card-padded">
        <div class="card-section-head">
          <strong class="ch-heading">PROSECUTION SUMMARY</strong>
        </div>
        <p v-if="prosecution" class="dash-ignored-msg">
          Cases (ignoring {{ prosecution.closed_count }} Closed)
        </p>
        <div v-if="initialLoading" class="dash-empty">Loading…</div>
        <div v-else-if="!prosecution" class="dash-empty">No data.</div>
        <div v-else class="donut-wrap">
          <!-- Donut: a single SVG with one path per status slice. The legend
               sits to the right and shows label + count.
               Special case: when only one status has non-zero count, the
               SVG arc path collapses (start point == end point → nothing
               renders). Draw a filled circle in that case instead. -->
          <svg :viewBox="`0 0 ${donutSize} ${donutSize}`" class="donut-svg">
            <g :transform="`translate(${donutSize/2} ${donutSize/2})`">
              <template v-if="donutSlices.length === 1">
                <circle :r="donutOuterR" :fill="donutSlices[0].colour" />
              </template>
              <template v-else>
                <path
                  v-for="(slice, i) in donutSlices"
                  :key="i"
                  :d="slice.d"
                  :fill="slice.colour"
                />
              </template>
              <!-- inner hole — makes it a donut not a pie -->
              <circle :r="donutInnerR" fill="#fff" />
              <text text-anchor="middle" dy="-4" class="donut-total-num">{{ prosecution.total }}</text>
              <text text-anchor="middle" dy="14" class="donut-total-lbl">total cases</text>
            </g>
          </svg>
          <div class="donut-legend">
            <div v-for="(slice, i) in donutSlices" :key="i" class="donut-legend-row">
              <span class="donut-swatch" :style="{ background: slice.colour }"></span>
              <span class="donut-label">{{ slice.label }}</span>
              <span class="donut-count">{{ slice.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-padded">
        <div class="card-section-head">
          <strong class="ch-heading">RECENTLY ACCESSED CASES</strong>
        </div>
        <div v-if="initialLoading" class="dash-empty">Loading…</div>
        <div v-else-if="!recentCases || recentCases.results.length === 0" class="dash-empty">
          No recent activity.
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Offender</th>
                <th>Status</th>
                <th>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in recentCases.results" :key="row.case_id">
                <td>
                  <a href="#" class="link-cell" @click.prevent="openCase(row.case_id)">
                    {{ row.case_num || '—' }}
                  </a>
                </td>
                <td>{{ row.offender || '—' }}</td>
                <td>{{ row.status_desc || '—' }}</td>
                <td>{{ formatRelative(row.last_accessed_seconds) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────────
         Row 2: Action Summary + Case Type Wise Detail
         ───────────────────────────────────────────────────────────── -->
    <div class="dash-grid">
      <div class="card card-padded">
        <div class="card-section-head">
          <strong class="ch-heading">ACTION SUMMARY</strong>
        </div>
        <div v-if="initialLoading" class="dash-empty">Loading…</div>
        <div v-else-if="!actionSummary || actionSummary.rows.length === 0" class="dash-empty">No data.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th class="num">Today</th>
                <th class="num">Last Week</th>
                <th class="num">Month</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in actionSummary.rows" :key="row.status">
                <td>{{ row.status }}</td>
                <td class="num">{{ row.today }}</td>
                <td class="num">{{ row.last_week }}</td>
                <td class="num">{{ row.last_month }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card card-padded">
        <div class="card-section-head">
          <strong class="ch-heading">CASE TYPE WISE DETAIL</strong>
        </div>
        <div class="tabs tabs-sm">
          <button
            v-for="t in dateTypeTabs"
            :key="t.value"
            class="tab"
            :class="{ active: activeDateType === t.value }"
            @click="onDateTypeChange(t.value)"
          >{{ t.label }}</button>
        </div>
        <div v-if="caseTypeWiseLoading" class="dash-empty">Loading…</div>
        <div v-else-if="!caseTypeWise || caseTypeWise.rows.length === 0" class="dash-empty">No data.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case Type</th>
                <th class="num">Today</th>
                <th class="num">Last Week</th>
                <th class="num">Month</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in caseTypeWise.rows" :key="row.case_type_id">
                <td>{{ row.case_option || row.code }}</td>
                <td class="num">{{ row.today }}</td>
                <td class="num">{{ row.last_week }}</td>
                <td class="num">{{ row.last_month }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDashboardStore } from '@/store/dashboard.store.js'
import { useAuthStore } from '@/store/auth.js'

const router = useRouter()
const dashStore = useDashboardStore()
const auth = useAuthStore()
const hasCasesAccess = auth.hasPermission('cases')
const { prosecution, recentCases, actionSummary, caseTypeWise,
        initialLoading, caseTypeWiseLoading, error } = storeToRefs(dashStore)

// ── Tabs for widget 4 ───────────────────────────────────────────────────────
const dateTypeTabs = [
  { value: 'OffenceDate', label: 'Offence Date' },
  { value: 'AddedDate',   label: 'Added Date' },
  { value: 'ClosedDate',  label: 'Closed Date' },
]
const activeDateType = ref('OffenceDate')
function onDateTypeChange(value) {
  if (value === activeDateType.value) return
  activeDateType.value = value
  dashStore.fetchCaseTypeWise(value)
}

// ── Donut chart geometry ────────────────────────────────────────────────────
// Hand-rolled SVG donut so we don't pull in a charting library. The backend
// returns counts per status; the legend hides 0-count and "Closed" slices
// (legacy parity: "Cases (ignoring N Closed)").
const donutSize = 220
const donutOuterR = 100
const donutInnerR = 60
const _palette = ['#5b8def', '#15a982', '#f5a623', '#d0021b', '#8854d0', '#20bf6b', '#fa8231', '#778ca3']

const donutSlices = computed(() => {
  if (!prosecution.value) return []
  const visible = prosecution.value.statuses.filter(s =>
    s.count > 0 && (s.status_desc || '').toLowerCase() !== 'closed'
  )
  const total = visible.reduce((sum, s) => sum + s.count, 0) || 1
  let cursor = -Math.PI / 2   // start at 12 o'clock
  return visible.map((s, i) => {
    const angle = (s.count / total) * Math.PI * 2
    const x1 = Math.cos(cursor) * donutOuterR
    const y1 = Math.sin(cursor) * donutOuterR
    const x2 = Math.cos(cursor + angle) * donutOuterR
    const y2 = Math.sin(cursor + angle) * donutOuterR
    const largeArc = angle > Math.PI ? 1 : 0
    // Pie wedge then a circle hole on top — easier than constructing a
    // donut-segment path manually.
    const d = `M 0 0 L ${x1} ${y1} A ${donutOuterR} ${donutOuterR} 0 ${largeArc} 1 ${x2} ${y2} Z`
    cursor += angle
    return {
      d,
      colour: _palette[i % _palette.length],
      label:  s.status_desc,
      count:  s.count,
    }
  })
})

// ── Display helpers ─────────────────────────────────────────────────────────
function formatRelative(seconds) {
  if (seconds == null) return '—'
  if (seconds < 60)    return `${seconds} seconds ago`
  if (seconds < 3600)  return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  const days = Math.floor(seconds / 86400)
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)} weeks ago`
}

function openCase(caseId) {
  router.push({ name: 'case-details', params: { caseid: caseId } })
}

onMounted(() => {
  if (!hasCasesAccess) {
    router.replace(auth.defaultLandingRoute())
    return
  }
  dashStore.fetchAll()
})
</script>

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .dash-grid { grid-template-columns: 1fr; }
}

.dash-empty {
  padding: 24px 0;
  color: #6b7280;
  font-size: 13px;
  text-align: center;
}

/* Donut chart layout */
.donut-wrap {
  display: grid;
  grid-template-columns: minmax(220px, 240px) 1fr;
  gap: 24px;
  align-items: center;
  padding-top: 8px;
}
.donut-svg { width: 100%; height: auto; max-width: 240px; }
.donut-total-num { font-size: 22px; font-weight: 700; fill: #1f2937; }
.donut-total-lbl { font-size: 10px; fill: #6b7280; letter-spacing: 0.04em; text-transform: uppercase; }

.donut-legend { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.donut-legend-row {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.donut-swatch { width: 12px; height: 12px; border-radius: 2px; }
.donut-label  { color: #374151; }
.donut-count  { color: #6b7280; font-variant-numeric: tabular-nums; font-weight: 600; }

.dash-ignored-msg {
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 4px 0 0;
}

/* Tab strip for widget 4 */
.tabs-sm .tab {
  font-size: 11px;
  padding: 6px 10px;
}

/* Numeric columns right-aligned + tabular */
th.num, td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
