import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addressLogService } from '@/services/address-log.service.js'

export const useAddressLogStore = defineStore('addressLog', () => {
  const logs = ref([])
  const users = ref([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const [all, userList] = await Promise.all([
        addressLogService.getAll(),
        addressLogService.getUsers(),
      ])
      logs.value = all
      users.value = userList
    } finally {
      loading.value = false
    }
  }

  return { logs, users, loading, init }
})
