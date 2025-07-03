import { app, Tray, Menu, nativeImage, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getSettings, writeSettings } from '../settings.js'
import { dialogMessages } from '../strings.js'
import { isInstallDirEmpty, makeDirectories, verifyFiles } from '../verifyFiles.js'

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
  handleVerifyClientIPC()

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

/* Handle Select Install Dir */
// - this is coming from renderer initially
// - after the user selects install dir, the main process handles the rest!
async function handleSelectInstallDir() {
  const settings = await getSettings(settingsPath)
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  let installDir = settings.installDir // default to the installDir in settings

  if (!canceled) {
    const selectedDir = filePaths[0]
    console.log(`install dir selected: ${selectedDir}`)

    // if selected dir is same as install dir, skip to verification
    if (selectedDir === installDir) {
      //@TODO: skip to verification here
      console.log(
        'selected install dir is the same as the current install dir - skipping to verification step'
      )
      return installDir
    }

    // check if the selected dir is empty, and then ask user to confirm install
    const isEmpty = await isInstallDirEmpty(selectedDir)
    if (isEmpty) {
      // if the dir is empty, display confirmation to install in empty dir
      const canInstall = await confirmEmptyDirInstall(selectedDir)
      if (canInstall === 0) {
        console.log('CAN INSTALL IN EMPTY DIR - GOOD JOB!')
        installDir = selectedDir
        await writeSettings(settingsPath, { ...settings, installDir })
      } else {
        console.log('USER SAID NO TO EMPTY DIR INSTALL')
        await writeSettings(settingsPath, { ...settings, installDir })
      }
    } else {
      // if the dir already exists, display dialog confirmation to install in existing dir
      const canInstall = await confirmExistingDirInstall(selectedDir)
      if (canInstall === 0) {
        console.log('CAN INSTALL IN EXISTING DIR - GOOD JOB!')
        installDir = selectedDir
        await writeSettings(settingsPath, { ...settings, installDir })
      } else {
        console.log('USER SAID NO TO EXISTING DIR INSTALL')
        await writeSettings(settingsPath, { ...settings, installDir })
      }
    }
  } else {
    console.log(`installDir select cancelled: reverting to ${installDir}`)
    await writeSettings(settingsPath, { ...settings, installDir })
  }

  return installDir // return current value if cancelled
}

/* Confirm Empty Dir Install (main process only) */
async function confirmEmptyDirInstall(dir) {
  const { response } = await dialog.showMessageBox({
    title: dialogMessages.confirmEmptyInstallDir_title,
    message: dialogMessages.confirmEmptyInstallDir(dir),
    type: 'none',
    buttons: ['Proceed', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })
  return response
}

/* Confirm Existing Dir Install (main process only) */
async function confirmExistingDirInstall(dir) {
  const { response } = await dialog.showMessageBox({
    title: dialogMessages.confirmExistingInstallDir_title,
    message: dialogMessages.confirmExistingInstallDir(dir),
    type: 'none',
    buttons: ['Proceed', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    noLink: true
  })
  return response
}

/* Send Task Event */
function sendTaskEvent(taskData) {
  const win = BrowserWindow.getAllWindows()[0]

  if (win) {
    win.webContents.send('task', taskData)
  } else {
    console.error('no window found for sendTask!')
  }
}

/* Verify Client */
function handleVerifyClientIPC() {
  ipcMain.on('verifyClient', async () => {
    const settings = await getSettings(settingsPath)
    const win = BrowserWindow.getAllWindows()[0]

    try {
      const isEmpty = await isInstallDirEmpty(settings.installDir)
      if (isEmpty) {
        const makeDirs = await makeDirectories(settings.installDir, sendTaskEvent)
        if (makeDirs.success) {
          // handle makedirs success
          console.log('makedirs success!')

          if (win) {
            // do downloads here
            console.log('do downloads here')
          }
        } else {
          // handle makedirs error
          console.log('makedirs error =[')
        }
      } else {
        // verify here
        console.log('directory not empty - starting verification')
        const verificationResults = await verifyFiles(settings.installDir, sendTaskEvent)

        console.log('--- Verification results ---')
        console.log(verificationResults)
        const { totalFiles, verifiedFiles, missingFiles, badHashFiles } = verificationResults

        if (missingFiles || badHashFiles) {
          // ask user if they want to repair files
          const totalToRepair = missingFiles.length + badHashFiles.length
          sendTaskEvent({ message: `${totalToRepair}/${totalFiles} files need to be repaired` })
        }
      }
    } catch (err) {
      console.error('Error in handleVerifyClientIPC', err)
    }
  })
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
    await writeSettings(settingsPath, { ...settings, minimizeToTray: isChecked })
  })
}

// Set Minimized On Play IPC
function setMinimizeOnPlayIPC() {
  ipcMain.on('setMinimizeOnPlay', async (event, isChecked) => {
    const settings = await getSettings(settingsPath)
    await writeSettings(settingsPath, { ...settings, minimizeOnPlay: isChecked })
  })
}

// Set Disable Video IPC
function setDisableVideoIPC() {
  ipcMain.on('setDisableVideo', async (event, isChecked) => {
    const settings = await getSettings(settingsPath)
    await writeSettings(settingsPath, { ...settings, disableVideo: isChecked })
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
