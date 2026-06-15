<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Users</h1></div>
      <div class="page-actions">
        <div class="breadcrumb">
          <a href="#" @click.prevent>Home</a> /
          <a href="#" @click.prevent>Revenue Protection Admin</a> /
          <span class="breadcrumb-active">Users</span>
        </div>
        <button class="btn-add" @click="openAddModal">ADD USER</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-padded mb-lg">
      <div class="card-title">User Filters</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Search</label>
          <input v-model="filters.search" type="text" placeholder="Username, name or email…" maxlength="100" @keyup.enter="applyFilters" />
        </div>
        <div class="form-group" style="max-width:180px">
          <label class="form-label">Status</label>
          <select v-model="filters.active_only">
            <option value="">All</option>
            <option value="true">Active only</option>
          </select>
        </div>
      </div>
      <div class="flex gap-sm" style="justify-content:flex-end;margin-top:14px">
        <button class="btn-search" @click="applyFilters">SEARCH</button>
        <button class="btn-reset" @click="resetFilters">RESET</button>
        <button class="btn-export" :disabled="exporting" @click="exportUsers">
          {{ exporting ? 'EXPORTING…' : 'EXPORT USERS' }}
        </button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="listError" class="error-banner">{{ listError }}</div>

    <!-- Table -->
    <div class="card card-padded">
      <div class="toolbar">
        <div class="flex items-center gap-sm">
          <select v-model="perPage" class="rows-select" @change="currentPage = 1; loadUsers()">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="toolbar-text">records per page</span>
        </div>
        <span class="toolbar-text" v-if="loading">Loading…</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Login Enabled</th>
              <th>Status</th>
              <th>Roles</th>
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && users.length === 0">
              <td colspan="7" style="text-align:center;padding:2rem;color:#888">Loading users…</td>
            </tr>
            <tr v-else-if="!loading && users.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-state-icon">👤</div>
                  <p class="empty-state-title">No users found</p>
                  <p class="empty-state-desc">Try adjusting your filters or add a new user.</p>
                </div>
              </td>
            </tr>
            <tr v-for="row in users" :key="row.user_id">
              <td><strong>{{ row.username }}</strong></td>
              <td>{{ row.first_name }} {{ row.surname }}</td>
              <td>{{ row.email_address }}</td>
              <td>
                <span :class="`badge badge-${row.login_enabled ? 'success' : 'neutral'}`">
                  {{ row.login_enabled ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <span :class="`badge badge-${row.active_inactive ? 'success' : 'neutral'}`">
                  {{ row.active_inactive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <span
                  v-for="r in (row.roles || [])"
                  :key="r.role_id"
                  class="badge badge-primary"
                  style="margin-right:4px"
                >{{ r.name }}</span>
                <span v-if="!row.roles || row.roles.length === 0" class="text-muted">—</span>
              </td>
              <td style="text-align:right">
                <div class="flex gap-xs" style="justify-content:flex-end">
                  <button class="edit-link" @click="openEditModal(row)">Edit</button>
                  <button
                    class="delete-link"
                    @click="openDeactivateModal(row)"
                    :disabled="!row.active_inactive"
                    :title="!row.active_inactive ? 'Already inactive' : 'Deactivate user'"
                  >Deactivate</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span class="page-meta">
          Showing {{ rangeStart }} to {{ rangeEnd }} of {{ totalRecords.toLocaleString() }} entries
        </span>
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--; loadUsers()">‹ Previous</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="currentPage = p; loadUsers()"
        >{{ p }}</button>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++; loadUsers()">Next ›</button>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-card modal-card-wide" role="dialog" aria-labelledby="userModalTitle">
        <div class="modal-header">
          <h2 id="userModalTitle" class="modal-title">
            {{ modalMode === 'add' ? 'Add User' : 'Edit User' }}
          </h2>
          <button class="modal-close" @click="closeModal" aria-label="Close">×</button>
        </div>

        <div class="modal-body">
          <div v-if="modalError" class="error-banner">{{ modalError }}</div>

          <fieldset class="legend-group">
            <legend>Account Details</legend>
            <div class="modal-grid">
              <div class="field">
                <label class="form-label">Username <span class="req">*</span></label>
                <input v-model.trim="form.username" type="text" placeholder="Username" maxlength="45" />
                <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
              </div>
              <div class="field" v-if="modalMode === 'add'">
                <label class="form-label">Password <span class="req">*</span></label>
                <input v-model="form.password" type="password" placeholder="Password" maxlength="255" autocomplete="new-password" />
                <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
              </div>
              <div class="field">
                <label class="form-label">Login Enabled</label>
                <select v-model.number="form.login_enabled">
                  <option :value="1">Yes</option>
                  <option :value="0">No</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset class="legend-group">
            <legend>Personal Details</legend>
            <div class="modal-grid">
              <div class="field">
                <label class="form-label">First Name <span class="req">*</span></label>
                <input v-model.trim="form.first_name" type="text" placeholder="First name" maxlength="45" />
                <span v-if="errors.first_name" class="form-error">{{ errors.first_name }}</span>
              </div>
              <div class="field">
                <label class="form-label">Surname <span class="req">*</span></label>
                <input v-model.trim="form.surname" type="text" placeholder="Surname" maxlength="45" />
                <span v-if="errors.surname" class="form-error">{{ errors.surname }}</span>
              </div>
              <div class="field">
                <label class="form-label">Email Address <span class="req">*</span></label>
                <input v-model.trim="form.email_address" type="email" placeholder="Email address" maxlength="100" />
                <span v-if="errors.email_address" class="form-error">{{ errors.email_address }}</span>
              </div>
              <div class="field">
                <label class="form-label">Direct Dial</label>
                <input v-model.trim="form.direct_dial" type="text" placeholder="Phone / extension" maxlength="45" />
              </div>
            </div>
          </fieldset>

          <fieldset class="legend-group">
            <legend>Settings</legend>
            <div class="modal-grid">
              <!-- Line Manager -->
              <div class="field">
                <label class="form-label">Line Manager</label>
                <select v-model="form.line_manager_id" :disabled="lmLoading">
                  <option value="">— None —</option>
                  <option
                    v-for="u in lineManagerOptions"
                    :key="u.user_id"
                    :value="u.user_id"
                  >{{ u.username }}</option>
                </select>
                <span v-if="lmLoading" class="hint">Loading users…</span>
              </div>

              <!-- Password Change Frequency -->
              <div class="field">
                <label class="form-label">Password Change Frequency</label>
                <select v-model.number="form.password_change_frequency">
                  <option :value="30">30 days</option>
                  <option :value="60">60 days</option>
                  <option :value="90">90 days</option>
                </select>
              </div>

              <!-- QA Level — spans both columns -->
              <div class="field qa-field">
                <label class="form-label">QA Level</label>
                <div class="qa-row">
                  <div class="qa-toggle">
                    <label :class="['qa-toggle-btn', { active: form.qa_use_default }]">
                      <input type="radio" v-model="form.qa_use_default" :value="true" />
                      Default QA
                    </label>
                    <label :class="['qa-toggle-btn', { active: !form.qa_use_default }]">
                      <input type="radio" v-model="form.qa_use_default" :value="false" />
                      Custom QA
                    </label>
                  </div>
                  <template v-if="!form.qa_use_default">
                    <span class="qa-custom-label">Sampling rate</span>
                    <select v-model="form.custom_qa_value" class="qa-custom-select">
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                      <option value="30">30%</option>
                      <option value="40">40%</option>
                      <option value="50">50%</option>
                      <option value="60">60%</option>
                      <option value="70">70%</option>
                      <option value="80">80%</option>
                      <option value="90">90%</option>
                      <option value="100">100%</option>
                    </select>
                  </template>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset class="legend-group">
            <legend>Role Assignment</legend>
            <div v-if="rolesLoading" class="hint">Loading roles…</div>
            <div v-else-if="allRoles.length === 0" class="hint">No roles available for this tenant.</div>
            <div v-else class="roles-grid">
              <label v-for="role in allRoles" :key="role.role_id" class="role-checkbox">
                <input type="checkbox" :value="role.role_id" v-model="form.role_ids" />
                {{ role.name }}
              </label>
            </div>
            <span v-if="errors.role_ids" class="form-error">{{ errors.role_ids }}</span>
          </fieldset>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal" :disabled="saving">Cancel</button>
          <button class="btn-save" @click="saveUser" :disabled="saving">
            {{ saving ? 'Saving…' : (modalMode === 'add' ? 'Create User' : 'Save Changes') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Deactivate confirmation modal -->
    <div v-if="showDeactivateModal" class="modal-backdrop">
      <div class="modal-card" role="dialog" aria-labelledby="deactivateTitle">
        <div class="modal-header">
          <h2 id="deactivateTitle" class="modal-title">Deactivate User</h2>
          <button class="modal-close" @click="showDeactivateModal = false" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size:0.9rem">
            Are you sure you want to deactivate
            <strong>{{ selectedUser?.username }}</strong>?
          </p>
          <p class="hint" style="margin-top:6px">
            This will disable their login and mark the account as inactive.
          </p>
          <div v-if="deactivateError" class="error-banner" style="margin-top:12px">{{ deactivateError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showDeactivateModal = false" :disabled="saving">Cancel</button>
          <button class="btn-save" style="background:var(--danger)" @click="confirmDeactivate" :disabled="saving">
            {{ saving ? 'Deactivating…' : 'Deactivate' }}
          </button>
        </div>
      </div>
    </div>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { usersService } from '@/services/users.service.js'
import { swal } from '@/utils/swal.js'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()

// ── List state ────────────────────────────────────────────────────────────
const users        = ref([])
const totalRecords = ref(0)
const loading      = ref(false)
const listError    = ref('')
const currentPage  = ref(1)
const exporting    = ref(false)
const perPage      = ref(25)

const filters = reactive({ search: '', active_only: '' })

const totalPages  = computed(() => Math.max(1, Math.ceil(totalRecords.value / perPage.value)))
const rangeStart  = computed(() => totalRecords.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
const rangeEnd    = computed(() => Math.min(currentPage.value * perPage.value, totalRecords.value))
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', cur - 1, cur, cur + 1, '…', total]
})

async function loadUsers() {
  loading.value   = true
  listError.value = ''
  try {
    const params = { page: currentPage.value, page_size: perPage.value }
    if (filters.search)      params.search      = filters.search
    if (filters.active_only) params.active_only = filters.active_only
    const res          = await usersService.getAll(params)
    users.value        = res.results ?? res
    totalRecords.value = res.count   ?? users.value.length
  } catch (e) {
    listError.value = e?.message || 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

function applyFilters() { currentPage.value = 1; loadUsers() }
function resetFilters()  { filters.search = ''; filters.active_only = ''; applyFilters() }

async function exportUsers() {
  exporting.value = true
  try {
    await usersService.exportAll()
  } catch (e) {
    listError.value = e?.message || 'Export failed.'
  } finally {
    exporting.value = false
  }
}

// ── Line manager dropdown ─────────────────────────────────────────────────
const allUserList  = ref([])
const lmLoading    = ref(false)

async function loadUserList() {
  if (allUserList.value.length) return
  lmLoading.value = true
  try {
    const res = await usersService.getUserList()
    allUserList.value = Array.isArray(res) ? res : (res.results ?? [])
  } catch { /* non-fatal */ } finally {
    lmLoading.value = false
  }
}

// Filter out the user being edited so they can't pick themselves.
const lineManagerOptions = computed(() =>
  allUserList.value.filter(u => u.user_id !== selectedUser.value?.user_id)
)

// ── Roles ─────────────────────────────────────────────────────────────────
const allRoles     = ref([])
const rolesLoading = ref(false)

async function loadRoles() {
  if (allRoles.value.length) return
  rolesLoading.value = true
  try {
    const res      = await usersService.getRoles()
    allRoles.value = res.results ?? res
  } catch { /* non-fatal */ } finally {
    rolesLoading.value = false
  }
}

// ── Add / Edit modal ──────────────────────────────────────────────────────
const showModal    = ref(false)
const modalMode    = ref('add')
const saving       = ref(false)
const modalError   = ref('')
const errors       = reactive({})
const selectedUser = ref(null)

const form = reactive({
  username: '', password: '', first_name: '', surname: '',
  email_address: '', direct_dial: '', login_enabled: 1, role_ids: [],
  line_manager_id: '', password_change_frequency: 30,
  qa_use_default: true, custom_qa_value: '10',
})

function resetForm() {
  Object.assign(form, {
    username: '', password: '', first_name: '', surname: '',
    email_address: '', direct_dial: '', login_enabled: 1, role_ids: [],
    line_manager_id: '', password_change_frequency: 30,
    qa_use_default: true, custom_qa_value: '10',
  })
  Object.keys(errors).forEach(k => delete errors[k])
  modalError.value = ''
}

function openAddModal() {
  modalMode.value    = 'add'
  selectedUser.value = null
  resetForm()
  loadRoles()
  loadUserList()
  showModal.value = true
}

function openEditModal(row) {
  modalMode.value    = 'edit'
  selectedUser.value = row
  resetForm()
  const hasCustomQa = Boolean(row.custom_qa_value)
  Object.assign(form, {
    username:                  row.username                  || '',
    first_name:                row.first_name                || '',
    surname:                   row.surname                   || '',
    email_address:             row.email_address             || '',
    direct_dial:               row.direct_dial               || '',
    login_enabled:             row.login_enabled             ?? 1,
    role_ids:                  (row.roles || []).map(r => r.role_id),
    line_manager_id:           row.line_manager_id           || '',
    password_change_frequency: row.password_change_frequency ?? 30,
    qa_use_default:            !hasCustomQa,
    custom_qa_value:           row.custom_qa_value           || '10',
  })
  loadRoles()
  loadUserList()
  showModal.value = true
}

function closeModal() { if (!saving.value) showModal.value = false }

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.username)                              errors.username      = 'Username is required.'
  if (modalMode.value === 'add' && !form.password) errors.password      = 'Password is required.'
  if (!form.first_name)                            errors.first_name    = 'First name is required.'
  if (!form.surname)                               errors.surname       = 'Surname is required.'
  if (!form.email_address)                         errors.email_address = 'Email address is required.'
  return Object.keys(errors).length === 0
}

async function saveUser() {
  if (!validate()) return
  saving.value     = true
  modalError.value = ''
  try {
    const qaValue = form.qa_use_default ? null : (form.custom_qa_value || null)
    if (modalMode.value === 'add') {
      const payload = {
        username: form.username, password: form.password,
        first_name: form.first_name, surname: form.surname,
        email_address: form.email_address, login_enabled: form.login_enabled,
        role_ids: form.role_ids,
        password_change_frequency: form.password_change_frequency,
        custom_qa_value: qaValue,
      }
      if (form.direct_dial)       payload.direct_dial       = form.direct_dial
      if (form.line_manager_id)   payload.line_manager_id   = form.line_manager_id
      await usersService.create(payload)
    } else {
      await usersService.update(selectedUser.value.user_id, {
        first_name: form.first_name, surname: form.surname,
        email_address: form.email_address, direct_dial: form.direct_dial || '',
        login_enabled: form.login_enabled,
        line_manager_id: form.line_manager_id || null,
        password_change_frequency: form.password_change_frequency,
        custom_qa_value: qaValue,
      })
      const oldRoles = (selectedUser.value.roles || []).map(r => r.role_id)
      await Promise.all([
        ...oldRoles.filter(id => !form.role_ids.includes(id))
          .map(id => usersService.removeRole(selectedUser.value.user_id, id)),
        ...form.role_ids.filter(id => !oldRoles.includes(id))
          .map(id => usersService.assignRole(selectedUser.value.user_id, id)),
      ])
    }
    showModal.value = false
    // If the edited user is the currently logged-in user, refresh their
    // profile so sidebar role guards (hasStationRole, isRevpAdmin, etc.)
    // update immediately without requiring a logout.
    if (modalMode.value === 'edit' && selectedUser.value?.user_id === auth.user?.user_id) {
      await auth.fetchProfile()
    }
    await swal.success(modalMode.value === 'add' ? 'User created successfully.' : 'User updated successfully.')
    await loadUsers()
  } catch (e) {
    const data = e?.data
    if (e?.status === 400 && data && typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([key, msg]) => {
        const text = Array.isArray(msg) ? msg[0] : msg
        if (key === 'detail' || key === 'non_field_errors') {
          modalError.value = text
        } else {
          errors[key] = text
        }
      })
      if (!modalError.value && Object.keys(errors).length === 0) {
        modalError.value = 'Validation failed. Please check your inputs.'
      }
    } else {
      modalError.value = e?.message || 'An error occurred. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

// ── Deactivate modal ──────────────────────────────────────────────────────
const showDeactivateModal = ref(false)
const deactivateError     = ref('')

function openDeactivateModal(row) {
  selectedUser.value    = row
  deactivateError.value = ''
  showDeactivateModal.value = true
}

async function confirmDeactivate() {
  saving.value          = true
  deactivateError.value = ''
  try {
    await usersService.deactivate(selectedUser.value.user_id)
    showDeactivateModal.value = false
    await swal.success(`${selectedUser.value.username} has been deactivated.`)
    await loadUsers()
  } catch (e) {
    deactivateError.value = e?.message || 'Failed to deactivate user.'
  } finally {
    saving.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.error-banner {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}

/* ── Buttons ── */
.btn-export {
  padding: 8px 18px;
  background: #fff;
  color: #15a982;
  border: 1.5px solid #15a982;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition), color var(--transition);
}
.btn-export:hover:not(:disabled) { background: #15a982; color: #fff; }
.btn-export:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-add {
  padding: 8px 18px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: background var(--transition);
}
.btn-add:hover { background: #128968; }

.btn-search {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-search:hover { background: #128968; }

.btn-reset {
  padding: 8px 22px;
  background: var(--danger);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-reset:hover { background: #dc2626; }

.btn-save {
  padding: 8px 22px;
  background: #15a982;
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.btn-save:hover:not(:disabled) { background: #128968; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  padding: 8px 22px;
  background: var(--bg-hover);
  color: var(--text-default);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.btn-cancel:hover:not(:disabled) { background: var(--border); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Toolbar ── */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rows-select  { width: auto; padding: 4px 10px; font-size: 12px; }
.toolbar-text { font-size: 12px; color: var(--text-muted); }

/* ── Table action links ── */
.edit-link {
  color: var(--primary);
  font-weight: 500;
  font-size: 12px;
  background: none;
  padding: 0;
}
.edit-link:hover { text-decoration: underline; }

.delete-link {
  color: var(--danger);
  font-weight: 500;
  font-size: 12px;
  background: none;
  padding: 0;
}
.delete-link:hover:not(:disabled) { text-decoration: underline; }
.delete-link:disabled { opacity: 0.4; cursor: not-allowed; }

.gap-xs { gap: 10px; }

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30, 34, 54, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-card {
  background: #fff;
  border-radius: var(--radius);
  width: 100%;
  max-width: 520px;
  box-shadow: 0 12px 40px rgba(30, 34, 54, 0.2);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}
.modal-card-wide { max-width: 760px; }
@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: none; opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 600; color: var(--text-strong); }
.modal-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  color: var(--text-light);
  border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-strong); }

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ── Fieldsets ── */
.legend-group {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px 14px;
}
.legend-group legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 20px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; color: var(--text-default); font-weight: 500; }

.req   { color: var(--danger); margin-left: 2px; }
.hint  { font-size: 12px; color: var(--text-light); margin-top: 4px; }

.form-error {
  color: var(--danger);
  font-size: 12px;
}

/* ── Roles ── */
.roles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-top: 8px;
}
.role-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.role-checkbox input[type="checkbox"] {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

@media (max-width: 720px) {
  .modal-grid { grid-template-columns: 1fr; }
}

/* ── QA Level segmented toggle ── */
.qa-field { grid-column: 1 / -1; }   /* span full modal-grid width */

.qa-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.qa-toggle {
  display: inline-flex;
  border: 1.5px solid #d1d5db;
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.qa-toggle-btn {
  padding: 7px 22px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: #f9fafb;
  color: #6b7280;
  transition: background 0.15s, color 0.15s;
  user-select: none;
  white-space: nowrap;
}
.qa-toggle-btn + .qa-toggle-btn { border-left: 1.5px solid #d1d5db; }
.qa-toggle-btn.active { background: #15a982; color: #fff; }
.qa-toggle-btn input[type="radio"] { display: none; }

.qa-custom-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}
.qa-custom-select {
  padding: 7px 10px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: var(--radius-sm);
  width: 110px;
  flex-shrink: 0;
}
</style>
