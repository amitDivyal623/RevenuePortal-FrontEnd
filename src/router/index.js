import { createRouter, createWebHistory } from 'vue-router'

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
const CaseListView         = () => import('@/views/CaseListView.vue')
const PaymentRecordsView   = () => import('@/views/PaymentRecordsView.vue')
const ActionTrackerView2   = () => import('@/views/ActionTrackerView.vue')
const PrintQueueView       = () => import('@/views/PrintQueueView.vue')
const QuickCaseSearchView  = () => import('@/views/QuickCaseSearchView.vue')
const AddNewCaseView       = () => import('@/views/AddNewCaseView.vue')
const IntelligenceReportView = () => import('@/views/IntelligenceReportView.vue')
const AddressSearchView    = () => import('@/views/AddressSearchView.vue')
const CourtBookingView     = () => import('@/views/CourtBookingView.vue')
const CaseDetailsView      = () => import('@/views/CaseDetailsView.vue')
const PlaceholderView      = () => import('@/views/PlaceholderView.vue')
const NotFoundView         = () => import('@/views/NotFoundView.vue')
const ForbiddenView        = () => import('@/views/ForbiddenView.vue')

const adminParent   = 'Revenue Protection Admin'
const stationParent = 'Station Management'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true, title: 'Sign in' } },
  { path: '/', redirect: '/dashboard' },

  // Main
  { path: '/dashboard',          name: 'dashboard',          component: DashboardView,        meta: { title: 'Dashboard', permission: 'dashboard' } },
  { path: '/cases',              name: 'cases',              component: CaseListView,          meta: { title: 'Case List', permission: 'cases' } },
  { path: '/cases/:caseid',      name: 'case-details',       component: CaseDetailsView,       meta: { title: 'Case Details', permission: 'cases' } },
  { path: '/payment-records',    name: 'payment-records',    component: PaymentRecordsView,    meta: { title: 'Payment Records', permission: 'cases' } },
  { path: '/action-tracker',     name: 'action-tracker',     component: ActionTrackerView2,    meta: { title: 'Action Tracker', permission: 'cases' } },
  { path: '/print-queue',        name: 'print-queue',        component: PrintQueueView,        meta: { title: 'Print Queue', permission: 'cases' } },
  { path: '/quick-case-search',  name: 'quick-case-search',  component: QuickCaseSearchView,   meta: { title: 'Quick Case Search', permission: 'cases' } },
  { path: '/add-new-case',       name: 'add-new-case',       component: AddNewCaseView,        meta: { title: 'Add New Case', permission: 'cases' } },
  { path: '/intelligence-report',name: 'intelligence-report',component: IntelligenceReportView,meta: { title: 'Intelligence Report', permission: 'cases' } },
  { path: '/address-search',     name: 'address-search',     component: AddressSearchView,     meta: { title: 'Perform Address Search', permission: 'cases' } },
  { path: '/court-booking',      name: 'court-booking',      component: CourtBookingView,      meta: { title: 'Court Booking', permission: 'cases' } },

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

router.beforeEach(async (to) => {
  document.title = `${to.meta.title ?? 'Agent'} | Agent Portal`

  // Public routes — no auth check needed
  if (to.meta.public) return true

  // Lazy-import the store here to avoid circular dependency at module load time
  const { useAuthStore } = await import('@/store/auth.js')
  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Permission check — redirect to /403 if the user lacks the required permission
  if (to.meta.permission && !auth.hasPermission(to.meta.permission)) {
    return { name: 'forbidden' }
  }

  // Reset session inactivity timer on every navigation
  auth.resetSessionTimer()

  return true
})

export default router
