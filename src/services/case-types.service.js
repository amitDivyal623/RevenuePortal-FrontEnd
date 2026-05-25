import { api } from '@/services/api.js'

export const caseTypesService = {
  getAll: () => api.get('/revp/cases/types/'),
}
