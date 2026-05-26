import { defineStore } from 'pinia'
import { ref } from 'vue'
import { paymentRecordsService } from '@/services/payment-records.service.js'

export const usePaymentRecordsStore = defineStore('paymentRecords', () => {
  const rows      = ref([])
  const total     = ref(0)
  const loading   = ref(false)
  const exporting = ref(false)
  const error     = ref(null)

  /**
   * Fetch paginated payment records from revp_temppaymentdetailsrevp.
   * params: { page, page_size, case_reference?, date_from?, date_to?,
   *           min_value?, max_value?, result_from_realex? }
   */
  async function fetchList(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const data    = await paymentRecordsService.getList(params)
      rows.value    = data.results ?? []
      total.value   = data.total   ?? 0
    } catch (err) {
      error.value = 'Failed to load payment records. Please try again.'
      rows.value  = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * Trigger an Excel export using the same filters as the current listing.
   * Triggers a browser file download — no state update needed on success.
   */
  async function exportExcel(params = {}) {
    exporting.value = true
    error.value     = null
    try {
      await paymentRecordsService.exportToExcel(params)
    } catch (err) {
      error.value = 'Export failed. Please try again.'
    } finally {
      exporting.value = false
    }
  }

  return { rows, total, loading, exporting, error, fetchList, exportExcel }
})
