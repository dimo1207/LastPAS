import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  getDb,
  closeDb,
  getDbVersion,
  createSession,
  listRecentSessions,
  listMenuAdministrations,
  updateSessionParticipantLabel,
  updateSessionStatus,
  createResponse,
  updateResponse,
  upsertResponse,
  listResponsesForSession,
  deleteResponse,
  deleteSession
} from './db/index.js'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 980,
    minWidth: 1180,
    minHeight: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function getActorId(event) {
  const processId = event?.senderFrame?.processId ?? event?.processId ?? 'unknown-process'
  const frameId = event?.senderFrame?.routingId ?? event?.frameId ?? 'unknown-frame'
  return `renderer:${processId}:${frameId}`
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('db:getMeta', () => {
    const db = getDb()

    const tables = db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
      `)
      .get()

    return {
      ok: true,
      sqliteVersion: getDbVersion(),
      tableCount: tables.count
    }
  })

  ipcMain.handle('session:create', (event, payload) => {
    const participantLabel = String(payload?.participantLabel ?? '').trim()
    const actorId = getActorId(event)

    if (!participantLabel) {
      return {
        ok: false,
        error: 'missing-participant-label'
      }
    }

    return createSession(participantLabel, actorId)
  })

  ipcMain.handle('session:listRecent', (_event, payload) => {
    return listRecentSessions(payload?.limit)
  })

  ipcMain.handle('menu:listAdministrations', (_event, payload) => {
    return listMenuAdministrations(payload?.limit)
  })

  ipcMain.handle('session:updateParticipantLabel', (event, payload) => {
    const actorId = getActorId(event)
    return updateSessionParticipantLabel(payload?.sessionId, payload?.participantLabel, actorId)
  })

  ipcMain.handle('session:updateStatus', (event, payload) => {
    const actorId = getActorId(event)
    return updateSessionStatus(payload?.sessionId, payload?.status, actorId)
  })

  ipcMain.handle('response:create', (event, payload) => {
    const actorId = getActorId(event)
    return createResponse(payload, actorId)
  })

  ipcMain.handle('response:listForSession', (_event, payload) => {
    return listResponsesForSession(payload?.sessionId)
  })

  ipcMain.handle('response:update', (event, payload) => {
    const actorId = getActorId(event)
    return updateResponse(payload?.responseId, payload?.updates, actorId)
  })

  ipcMain.handle('response:upsert', (event, payload) => {
    const actorId = getActorId(event)
    return upsertResponse(payload, actorId)
  })

  ipcMain.handle('response:delete', (event, payload) => {
    const actorId = getActorId(event)
    return deleteResponse(payload?.responseId, actorId)
  })

  ipcMain.handle('session:delete', (event, payload) => {
    const sessionId = String(payload?.sessionId ?? '').trim()
    const actorId = getActorId(event)

    if (!sessionId) {
      return {
        ok: false,
        error: 'missing-session-id'
      }
    }

    return deleteSession(sessionId, actorId)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  closeDb()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})