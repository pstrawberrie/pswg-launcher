import {
  app,
  Tray,
  Menu,
  nativeImage,
  shell,
  BrowserWindow,
  dialog,
  ipcMain,
  session
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getSettings, writeSettings, setServer } from '../settings.js'
import { taskMessages, dialogMessages, errorMessages } from '../strings.js'
import { isInstallDirEmpty, makeDirectories, verifyFiles, downloadFiles } from '../fileTasks.js'

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
    mainWindow.focus()
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
  getStatusIPC()
  getSettingsIPC()
  selectInstallDirIPC()
  handleVerifyClientIPC()

  setMinimizeToTrayIPC()
  setMinimizeOnPlayIPC()
  setDisableVideoIPC()
  setServerIPC()

  SWGSettingsIPC()
  clientFolderIPC()
  playGameIPC()

  // Main Window
  createWindow()

  // Tray
  setupTray()

  // Send Status
  setInterval(fetchStatusInterval, 60000)
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

    // workaround for getting window to come to the front of other applications
    win.setAlwaysOnTop(true)
    win.setAlwaysOnTop(false)

    win.isVisible() ? win.focus() : win.show()
  })
}

/* Get status from URL */
async function fetchStatus() {
  const statusURL = 'https://swg.pstraw.net/status'
  const offlineStatusObj = { online: false, players: 0, uptime: 0 }

  try {
    const response = await fetch(statusURL)
    if (!response.ok) {
      console.error('bad response from fetchStatus')
      return offlineStatusObj
    } else {
      const data = await response.json()
      return data
    }
  } catch (err) {
    console.error('error in fetchStatus: ', err)
    return offlineStatusObj
  }
}

/* Fetch Status Interval (send ever x seconds) */
async function fetchStatusInterval() {
  const status = await fetchStatus()
  sendStatusEvent(status)
}

/* Send Status Event */
function sendStatusEvent(statusData) {
  const win = BrowserWindow.getAllWindows()[0]

  if (win) {
    win.webContents.send('status', statusData)
  } else {
    console.error('no window found for sendStatusEvent!')
  }
}

/* Get Status */
async function handleGetStatus() {
  const status = await fetchStatus()
  return status
}

/* Send Task Event */
function sendTaskEvent(taskData) {
  const win = BrowserWindow.getAllWindows()[0]

  if (win) {
    win.webContents.send('task', taskData)
  } else {
    console.error('no window found for sendTaskEvent!')
  }
}

/* Get Settings */
async function handleGetSettings() {
  const settings = await getSettings(settingsPath)
  return settings
}

/* Send Settings */
async function sendSettings() {
  const win = BrowserWindow.getAllWindows()[0]
  const settings = await getSettings(settingsPath)

  if (win && settings) {
    console.log('Sending settings to renderer via sendSettings')
    win.webContents.send('settings', settings)
  } else {
    console.error(`Error sending settings: win: ${win} / settings: ${settings}`)
  }
}

/* Handle Errors */
async function handleError(message) {
  const settings = await getSettings(settingsPath)
  await writeSettings(settingsPath, { ...settings, installDir: '' })
  await sendSettings()
  sendTaskEvent({ error: true, message })
}

/**
 * IPC Handlers
 */
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
      console.log(
        'selected install dir is the same as the current install dir - skipping to verification step'
      )
      return installDir
    }

    // check if the selected dir is empty, and then ask user to confirm install
    const isEmpty = await isInstallDirEmpty(selectedDir)
    if (isEmpty) {
      // if the dir is empty, display confirmation to install in empty dir
      const canInstall = await confirmEmptyDirInstallDialog(selectedDir)
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
      const canInstall = await confirmExistingDirInstallDialog(selectedDir)
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
async function confirmEmptyDirInstallDialog(dir) {
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
async function confirmExistingDirInstallDialog(dir) {
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

/* Confirm Repair (main process only) */
async function confirmRepairDialog(dir, numFiles) {
  const { response } = await dialog.showMessageBox({
    title: dialogMessages.confirmFileRepair_title,
    message: dialogMessages.confirmFileRepair(dir, numFiles),
    type: 'none',
    buttons: ['Proceed', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    noLink: true
  })
  return response
}

/* Verify Client */
function handleVerifyClientIPC() {
  ipcMain.on('verifyClient', async () => {
    const settings = await getSettings(settingsPath)
    const { installDir } = settings
    const win = BrowserWindow.getAllWindows()[0]

    if (!win) {
      console.error('window not found in handleVerifyClientIPC')
      await handleError(errorMessages.general)
    }

    // Do File Downloads
    async function doDownloadFiles(filesToDownload) {
      console.log('starting file downloads...')

      const downloadResult = await downloadFiles(
        filesToDownload,
        installDir,
        session,
        sendTaskEvent
      )

      if (downloadResult.success) {
        // downloads succeeded!
        console.log('downloads succeeded! re-verify now')
        await doVerifyFiles()
      } else {
        // download(s) failed, handle errors
        console.log('DOWNLAOAD TASK FAILED - handle error here')
        console.log(downloadResult)
        await handleError(errorMessages.download)
      }
    }

    // Do File Verification
    async function doVerifyFiles() {
      console.log('directory not empty - starting verification')
      const verificationResults = await verifyFiles(installDir, sendTaskEvent)

      console.log('--- Verification results ---')
      // console.log(verificationResults)
      const { totalFiles, missingFiles, badHashFiles } = verificationResults
      console.log(`totalFiles: ${totalFiles.length}`)
      console.log(`missingFiles: ${missingFiles.length}`)
      console.log(`badHashFiles: ${badHashFiles.length}`)

      if (missingFiles.length || badHashFiles.length) {
        // missing or mismatched hash files were detected
        // get files array for files that need to be repaired
        const totalToRepair = missingFiles.length + badHashFiles.length
        let filesToRepair = []

        if (missingFiles) filesToRepair = [...filesToRepair, ...missingFiles]
        if (badHashFiles) filesToRepair = [...filesToRepair, ...badHashFiles]
        sendTaskEvent({ message: `${totalToRepair}/${totalFiles} files need to be repaired` })

        // ask user if they want to repair files
        console.log('user needs to repair files - opening repair dialog')

        const canRepair = await confirmRepairDialog(installDir, filesToRepair.length)
        if (canRepair === 0) {
          console.log('CAN REPAIR!')
          await doDownloadFiles(filesToRepair)
        } else {
          console.log('USER SAID NO TO REPAIR - reset the installDir')
          await writeSettings(settingsPath, { ...settings, installDir: '' })
          await sendSettings()
          sendTaskEvent({ message: taskMessages.selectInstallDir })
        }
      } else {
        // verification succeeded - play button!
        sendTaskEvent({ ready: true })
      }
    }

    // Kick off verification process
    try {
      const isEmpty = await isInstallDirEmpty(installDir)
      if (isEmpty) {
        const makeDirs = await makeDirectories(installDir, sendTaskEvent)
        if (makeDirs.success) {
          // handle makedirs success
          console.log('makedirs success!')

          // download all files
          await doDownloadFiles(null)
        } else {
          // handle makedirs error
          console.log('makedirs error =[')
        }
      } else {
        await doVerifyFiles()
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        handleError(errorMessages.installDir(installDir))
        await writeSettings(settingsPath, { ...settings, installDir: '' })
        await sendSettings()
      } else {
        console.error('Error in handleVerifyClientIPC', err)
        await handleError(errorMessages.verify)
      }
    }
  })
}

/**
 * IPC Functions
 */
// Get Settings IPC
function getStatusIPC() {
  ipcMain.handle('getStatus', handleGetStatus)
}

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

// Set Disable Verification IPC
function setServerIPC() {
  ipcMain.on('setServer', async (event, server) => {
    const settings = await getSettings(settingsPath)

    await writeSettings(settingsPath, { ...settings, server })
    await setServer(settings.installDir, server)
  })
}

// SWG Settings IPC
function SWGSettingsIPC() {
  ipcMain.on('SWGSettings', async () => {
    const settings = await getSettings(settingsPath)
    const win = BrowserWindow.getAllWindows()[0]

    if (win) {
      shell.openPath(join(settings.installDir, 'SWGEmu_Setup.exe'))
    }
  })
}

// SWG Settings IPC
function clientFolderIPC() {
  ipcMain.on('clientFolder', async () => {
    const settings = await getSettings(settingsPath)
    const win = BrowserWindow.getAllWindows()[0]

    if (win) {
      shell.openPath(settings.installDir)
    }
  })
}

// Play Game IPC
function playGameIPC() {
  ipcMain.on('playGame', async () => {
    const settings = await getSettings(settingsPath)
    const win = BrowserWindow.getAllWindows()[0]

    if (win) {
      shell.openPath(join(settings.installDir, 'SWGEmu.exe'))
      if (settings.minimizeOnPlay) win.minimize()
    }
  })
}
