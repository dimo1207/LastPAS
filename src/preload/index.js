import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getDbMeta: () => ipcRenderer.invoke('db:getMeta'),

  createSession: (clientLabel) =>
    ipcRenderer.invoke('session:create', { clientLabel }),

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

  deleteResponse: (responseId) =>
    ipcRenderer.invoke('response:delete', { responseId })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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