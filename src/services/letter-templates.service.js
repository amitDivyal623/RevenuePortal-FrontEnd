import { apiDel, apiDownload, apiGet, apiPost, apiPut } from '@/services/api.js'

export const letterTemplatesService = {
  getAll: () =>
    apiGet('/revp/templates/letters/?page_size=100').then(r => r.results ?? r),

  getReferenceData: () =>
    apiGet('/revp/templates/letters/reference-data/'),

  create: (formData) =>
    apiPost('/revp/templates/letters/create/', formData),

  update: (id, formData) =>
    apiPut(`/revp/templates/letters/${id}/`, formData),

  remove: (id) =>
    apiDel(`/revp/templates/letters/${id}/`),

  downloadFile: (id, filename) =>
    apiDownload(`/revp/templates/letters/${id}/file/`, filename),
}
