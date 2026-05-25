import { addressLogs as seedData, tocUsers } from '@/mock/addressLogData.js'

export const addressLogService = {
  getUsers: () => Promise.resolve([...tocUsers]),
  getAll: () => Promise.resolve([...seedData]),
}
