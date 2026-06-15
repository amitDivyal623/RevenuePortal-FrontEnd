import { api, apiDownload } from '@/services/api.js'

export const usersService = {
  getAll:       (params = {}) => api.get(`/auth/users/?${new URLSearchParams(params)}`),
  exportAll:    ()            => apiDownload('/auth/users/export/', 'UsersExport.xlsx'),
  getById:      (userId) => api.get(`/auth/users/${encodeURIComponent(userId)}/`),
  create:       (payload) => api.post('/auth/users/create/', payload),
  update:       (userId, payload) => api.put(`/auth/users/${encodeURIComponent(userId)}/`, payload),
  deactivate:   (userId) => api.delete(`/auth/users/${encodeURIComponent(userId)}/`),

  getUserList:  () => api.get('/auth/user-list/'),
  getRoles:     () => api.get('/auth/roles/'),
  assignRole:   (userId, roleId) => api.post(`/auth/users/${encodeURIComponent(userId)}/roles/`, { role_id: roleId }),
  removeRole:   (userId, roleId) => api.delete(`/auth/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}/`),
}
