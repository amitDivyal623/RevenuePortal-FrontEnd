import {
  letterVariables as seedData,
  dataTypes,
  styleOptions,
} from '@/mock/letterVariableData.js'

let _variables = [...seedData]

export const letterVariablesService = {
  getMetadata: () => Promise.resolve({ dataTypes, styleOptions }),
  getAll: () => Promise.resolve([..._variables]),
  create: (payload) => {
    const item = { variableID: _uuid(), bActive: 1, ...payload }
    _variables.push(item)
    return Promise.resolve(item)
  },
  update: (id, payload) => {
    const item = _variables.find(v => v.variableID === id)
    if (item) Object.assign(item, payload)
    return Promise.resolve(item)
  },
  remove: (id) => {
    const item = _variables.find(v => v.variableID === id)
    if (item) item.bActive = 0
    return Promise.resolve()
  },
}

function _uuid() {
  return crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(16).slice(2)
}
