import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getDbMeta: () => ipcRenderer.invoke('db:getMeta'),

  createSession: (payload) =>
    ipcRenderer.invoke('session:create', payload),

  deleteSession: (sessionId) =>
    ipcRenderer.invoke('session:delete', { sessionId }),

  listRecentSessions: (limit) =>
    ipcRenderer.invoke('session:listRecent', { limit }),

  listMenuAdministrations: (limit) =>
    ipcRenderer.invoke('menu:listAdministrations', { limit }),

  updateClientLabel: (clientId, clientLabel) =>
    ipcRenderer.invoke('client:updateLabel', { clientId, clientLabel }),

  updateSessionStatus: (sessionId, status) =>
    ipcRenderer.invoke('session:updateStatus', { sessionId, status }),

  createResponse: (payload) =>
    ipcRenderer.invoke('response:create', payload),

  listResponsesForSession: (sessionId) =>
    ipcRenderer.invoke('response:listForSession', { sessionId }),

  updateResponse: (responseId, updates) =>
    ipcRenderer.invoke('response:update', { responseId, updates }),

  upsertResponse: (payload) =>
    ipcRenderer.invoke('response:upsert', payload),

  deleteResponse: (responseId) =>
    ipcRenderer.invoke('response:delete', { responseId })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}