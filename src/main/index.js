import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  getDb,
  getDbVersion,
  createSession,
  listRecentSessions,
  listMenuAdministrations,
  updateClientLabel,
  updateSessionStatus,
  createResponse,
  updateResponse,
  listResponsesForSession,
  deleteResponse
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


  ipcMain.handle('session:create', (_event, payload) => {
    return createSession(payload?.clientLabel ?? null)
  })


  ipcMain.handle('session:listRecent', (_event, payload) => {
    return listRecentSessions(payload?.limit)
  })

  ipcMain.handle('menu:listAdministrations', (_event, payload) => {
    return listMenuAdministrations(payload?.limit)
  })

  ipcMain.handle('client:updateLabel', (_event, payload) => {
    return updateClientLabel(payload?.clientId, payload?.clientLabel)
  })


  ipcMain.handle('session:updateStatus', (_event, payload) => {
    return updateSessionStatus(payload?.sessionId, payload?.status)
  })


  ipcMain.handle('response:create', (_event, payload) => {
    return createResponse(payload)
  })


  ipcMain.handle('response:listForSession', (_event, payload) => {
    return listResponsesForSession(payload?.sessionId)
  })


  ipcMain.handle('response:update', (_event, payload) => {
    return updateResponse(payload?.responseId, payload?.updates)
  })


  // New: delete response handler
  ipcMain.handle('response:delete', (_event, payload) => {
    return deleteResponse(payload?.responseId)
  })


  createWindow()


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})