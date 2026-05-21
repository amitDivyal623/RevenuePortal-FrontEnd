import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const LoginView            = () => import('@/views/LoginView.vue')
const DashboardView        = () => import('@/views/DashboardView.vue')
const ActionTemplateView   = () => import('@/views/ActionTemplateView.vue')
const CourtsView           = () => import('@/views/CourtsView.vue')
const TicketPadsView       = () => import('@/views/TicketPadsView.vue')
const LetterTemplatesView  = () => import('@/views/LetterTemplatesView.vue')
const EmailTemplatesView   = () => import('@/views/EmailTemplatesView.vue')
const PrintTemplatesView   = () => import('@/views/PrintTemplatesView.vue')
const ManualCaseInitials   = () => import('@/views/ManualCaseInitialsView.vue')
const OffencesView         = () => import('@/views/OffencesView.vue')
const AdminChargesView     = () => import('@/views/AdminChargesView.vue')
const AdminCasetypeView    = () => import('@/views/AdminCasetypeView.vue')
const ZeroFareView         = () => import('@/views/ZeroFareView.vue')
const PrinterAppView       = () => import('@/views/PrinterAppView.vue')
const IntelReportView      = () => import('@/views/IntelReportView.vue')
const AuthProsecutorView   = () => import('@/views/AuthProsecutorView.vue')
const LookupValuesView     = () => import('@/views/LookupValuesView.vue')
const AddressLogView       = () => import('@/views/AddressLogView.vue')
const LetterVariableView   = () => import('@/views/LetterVariableView.vue')
const StationMgmtView      = () => import('@/views/StationMgmtView.vue')
const ServiceTypeView      = () => import('@/views/ServiceTypeView.vue')
const CarParkView          = () => import('@/views/CarParkView.vue')
const RemoveCaseView       = () => import('@/views/RemoveCaseView.vue')
const PlaceholderView      = () => import('@/views/PlaceholderView.vue')
const NotFoundView         = () => import('@/views/NotFoundView.vue')
const ForbiddenView        = () => import('@/views/ForbiddenView.vue')

const adminParent = 'Revenue Protection Admin'
const stationParent = 'Station Management'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: 'Sign in' } },
  { path: '/', redirect: '/dashboard' },

  // Main
  { path: '/dashboard',       name: 'dashboard',       component: DashboardView,  meta: { title: 'Dashboard', permission: 'dashboard' } },
  { path: '/cases',           name: 'cases',           component: PlaceholderView, meta: { title: 'Case List', permission: 'cases' } },
  { path: '/payment-records', name: 'payment-records', component: PlaceholderView, meta: { title: 'Payment Records', permission: 'cases' } },
  { path: '/action-tracker',  name: 'action-tracker',  component: PlaceholderView, meta: { title: 'Action Tracker', permission: 'cases' } },
  { path: '/print-queue',     name: 'print-queue',     component: PlaceholderView, meta: { title: 'Print Queue', permission: 'cases' } },

  // Revenue Protection Admin
  { path: '/admin/action-template',      name: 'action-template',      component: ActionTemplateView,  meta: { title: 'Action Template', parent: adminParent, permission: 'admin' } },
  { path: '/admin/courts',               name: 'courts',               component: CourtsView,          meta: { title: 'Courts', parent: adminParent, permission: 'admin' } },
  { path: '/admin/ticket-pads',          name: 'ticket-pads',          component: TicketPadsView,      meta: { title: 'Ticket Pads', parent: adminParent, permission: 'admin' } },
  { path: '/admin/letter-templates',     name: 'letter-templates',     component: LetterTemplatesView, meta: { title: 'Letter Templates', parent: adminParent, permission: 'admin' } },
  { path: '/admin/email-templates',      name: 'email-templates',      component: EmailTemplatesView,  meta: { title: 'Email Templates', parent: adminParent, permission: 'admin' } },
  { path: '/admin/print-templates',      name: 'print-templates',      component: PrintTemplatesView,  meta: { title: 'Print Templates', parent: adminParent, permission: 'admin' } },
  { path: '/admin/manual-case-initials', name: 'manual-case-initials', component: ManualCaseInitials,  meta: { title: 'Manual Case Initials', parent: adminParent, permission: 'admin' } },
  { path: '/admin/offences',             name: 'offences',             component: OffencesView,        meta: { title: 'Offences', parent: adminParent, permission: 'admin' } },
  { path: '/admin/charges',              name: 'admin-charges',        component: AdminChargesView,    meta: { title: 'Charges and Appeals', parent: adminParent, permission: 'admin' } },
  { path: '/admin/casetype',             name: 'admin-casetype',       component: AdminCasetypeView,   meta: { title: 'Casetype Appeal Enabled', parent: adminParent, permission: 'admin' } },
  { path: '/admin/zero-fare',            name: 'zero-fare',            component: ZeroFareView,        meta: { title: 'Zero Fare For App Control', parent: adminParent, permission: 'admin' } },
  { path: '/admin/printer-app',          name: 'printer-app',          component: PrinterAppView,      meta: { title: 'Printer App Control', parent: adminParent, permission: 'admin' } },
  { path: '/admin/intel-config',         name: 'intel-config',         component: IntelReportView,     meta: { title: 'Intelligence Report Config', parent: adminParent, permission: 'admin' } },
  { path: '/admin/auth-prosecutor',      name: 'auth-prosecutor',      component: AuthProsecutorView,  meta: { title: 'Authorising Prosecutor', parent: adminParent, permission: 'admin' } },
  { path: '/admin/lookup-values',        name: 'lookup-values',        component: LookupValuesView,    meta: { title: 'Lookup Values', parent: adminParent, permission: 'admin' } },
  { path: '/admin/address-log',          name: 'address-log',          component: AddressLogView,      meta: { title: 'Address Search Log', parent: adminParent, permission: 'admin' } },
  { path: '/admin/letter-vars',          name: 'letter-vars',          component: LetterVariableView,  meta: { title: 'Letter Variable Lookup', parent: adminParent, permission: 'admin' } },
  { path: '/admin/station-mgmt',         name: 'station-mgmt',         component: StationMgmtView,     meta: { title: 'Station Management', parent: adminParent, permission: 'admin' } },
  { path: '/admin/station-mgmt/service-type', name: 'service-type',    component: ServiceTypeView,     meta: { title: 'Service Type Management', parent: stationParent, permission: 'admin' } },
  { path: '/admin/car-park',             name: 'car-park',             component: CarParkView,         meta: { title: 'Car Park Locations', parent: adminParent, permission: 'admin' } },
  { path: '/admin/remove-case',          name: 'remove-case',          component: RemoveCaseView,      meta: { title: 'Remove Case Completely', parent: adminParent, permission: 'admin' } },

  { path: '/403', name: 'forbidden', component: ForbiddenView, meta: { public: true, title: 'Access denied' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { public: true, title: 'Not found' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  document.title = `${to.meta.title ?? 'Agent'} | Agent Portal`
  const auth = useAuthStore()

  if (to.meta.public) {
    if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
    return true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !auth.hasPermission(to.meta.permission)) {
    return { name: 'forbidden' }
  }
  auth.resetSessionTimer()
  return true
})

export default router
