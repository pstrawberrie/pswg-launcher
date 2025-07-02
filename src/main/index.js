import { app, Tray, Menu, nativeImage, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getSettings, writeSettings } from '../settings.js'

const settingsPath = `${app.getPath('userData')}/settings.json`

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
  mainWindow.on('minimize', async (event) => {
    event.preventDefault()
    const settings = await getSettings(settingsPath)

    if (settings.minimizeToTray) {
      mainWindow.hide()
    }
  })
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit()
})

/* Electron whenReady */
app.whenReady().then(() => {
  // Electron Boilerplate
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC
  getSettingsIPC()
  selectInstallDirIPC()
  setMinimizeToTrayIPC()
  setMinimizeOnPlayIPC()
  setDisableVideoIPC()
  playGameIPC()

  // Main Window
  createWindow()

  // Tray
  setupTray()

  // Testing
  // sendTaskEvent({ message: 'Testing task event', progress: 19 })
  // sendTaskEvent({ fileVerificationError: true })
  // sendTaskEvent({ fileDownloadError: true })
  // sendTaskEvent({ ready: true })
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

/**
 * IPC Handlers
 */
/* Handle Get Settings */
async function handleGetSettings() {
  const settings = await getSettings(settingsPath)
  return settings
}

/* Handle Send Settings */
async function sendSettings() {
  const win = BrowserWindow.getAllWindows()[0]
  const settings = await getSettings(settingsPath)

  if (win && settings) {
    win.webContents.send('settings', settings)
  } else {
    console.error(`Error sending settings: win: ${win} / settings: ${settings}`)
  }
}

/* Handle Send Task */
function sendTaskEvent(taskData) {
  const win = BrowserWindow.getAllWindows()[0]

  if (win) {
    win.webContents.send('task', taskData)
  } else {
    console.error('no window found for sendTask!')
  }
}

/* Handle Select Install Dir */
async function handleSelectInstallDir() {
  const settings = await getSettings(settingsPath)
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!canceled) {
    console.log(`install dir selected: ${filePaths[0]}`)
    writeSettings(settingsPath, { ...settings, installDir: filePaths[0] })
    return filePaths[0]
  }

  // console.log('dir selection canceled')
  return settings.installDir // return current value if cancelled
}

/**
 * IPC Functions
 */
// Get Settings IPC
function getSettingsIPC() {
  ipcMain.handle('getSettings', handleGetSettings)
}

// Select Install Directory IPC
function selectInstallDirIPC() {
  ipcMain.handle('dialog:selectInstallDir', handleSelectInstallDir)
}

// Set Minimized To Tray IPC
function setMinimizeToTrayIPC() {
  ipcMain.on('setMinimizeToTray', async (event, isChecked) => {
    const settings = await getSettings(settingsPath)
    writeSettings(settingsPath, { ...settings, minimizeToTray: isChecked })
  })
}

// Set Minimized On Play IPC
function setMinimizeOnPlayIPC() {
  ipcMain.on('setMinimizeOnPlay', async (event, isChecked) => {
    const settings = await getSettings(settingsPath)
    writeSettings(settingsPath, { ...settings, minimizeOnPlay: isChecked })
  })
}

// Set Disable Video IPC
function setDisableVideoIPC() {
  ipcMain.on('setDisableVideo', async (event, isChecked) => {
    const settings = await getSettings(settingsPath)
    writeSettings(settingsPath, { ...settings, disableVideo: isChecked })
  })
}

// Play Game IPC
function playGameIPC() {
  ipcMain.on('playGame', async () => {
    const settings = await getSettings(settingsPath)
    const win = BrowserWindow.getAllWindows()[0]

    if (win) {
      shell.openPath('E:/psWG/SWGEmu.exe')
      if (settings.minimizeOnPlay) win.minimize()
    }
  })
}
