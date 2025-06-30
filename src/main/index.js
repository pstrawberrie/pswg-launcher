import { app, Tray, Menu, nativeImage, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync } from 'node:fs'

/* User Settings */
const settingsPath = `${app.getPath('userData')}/settings.json`
const defaultSettings = {
  installDir: '',
  minimizeToTray: true
}

function getSettings() {
  try {
    const settings = readFileSync(settingsPath, 'utf8')
    return JSON.parse(settings)
  } catch (err) {
    if (err.code === 'ENOENT') {
      writeFileSync(settingsPath, JSON.stringify(defaultSettings), 'utf8')

      return defaultSettings
    } else {
      console.error('Error reading file in getSettings', err)
      return null
    }
  }
}

function writeSettings(json) {
  if (!json) {
    console.error('No json passed into writeSettings')
    return
  }

  try {
    writeFileSync(settingsPath, JSON.stringify(json), 'utf8')
  } catch (err) {
    console.error('Error writing to file in getSettings', err)
  }
}

/* Electron BrowserWindow */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 576,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
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

  // Electron-vite HMR
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Minimize to system tray
  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/* Electron whenReady */
app.whenReady().then(() => {
  // Electron Boilerplate
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Listeners
  testIPC()
  selectInstallDirIPC()
  playGameIPC()

  // Main Window
  createWindow()

  // Tray
  setupTray()

  // Testing
  const settings = getSettings()
  console.log(settings)
})

/* Set Up Tray */
let tray
function setupTray() {
  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
  tray = new Tray(trayIcon)

  const trayMenu = Menu.buildFromTemplate([
    { label: 'Quit', type: 'normal', click: () => app.quit() }
  ])
  tray.setContextMenu(trayMenu)
  tray.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0]
    win.isVisible() ? win.focus() : win.show()
  })
}

/* IPC Functions */
// Test IPC
function testIPC() {
  ipcMain.on('ping', () => console.log('pong'))
}

// Select Install Directory IPC
function selectInstallDirIPC() {
  const currentDir = getSettings().installDir
  ipcMain.on('selectInstallDir', () => console.log(`install dir: ${currentDir}`))
}

// Play Game IPC
function playGameIPC() {
  ipcMain.on('playGame', () => {
    const win = BrowserWindow.getAllWindows()[0]
    // const shouldMinimize = store.get('minimizeToTray') === true
    const shouldMinimize = true

    if (win) {
      shell.openPath('E:/psWG/SWGEmu.exe')
      if (shouldMinimize) win.minimize()
    }
  })
}
