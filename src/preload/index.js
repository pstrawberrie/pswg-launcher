import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // dialogs
  selectInstallDir: (dir) => ipcRenderer.invoke('dialog:selectInstallDir', dir),

  // settings
  getStatus: () => ipcRenderer.invoke('getStatus'),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  setMinimizeToTray: (isChecked) => ipcRenderer.send('setMinimizeToTray', isChecked),
  setMinimizeOnPlay: (isChecked) => ipcRenderer.send('setMinimizeOnPlay', isChecked),
  setDisableVideo: (isChecked) => ipcRenderer.send('setDisableVideo', isChecked),
  setServer: (server) => ipcRenderer.send('setServer', server),
  setFPS: (server) => ipcRenderer.send('setFPS', server),

  // events
  onStatusEvent: (callback) => ipcRenderer.on('status', (_event, value) => callback(value)),
  onSettingsEvent: (callback) => ipcRenderer.on('settings', (_event, value) => callback(value)),
  onTaskEvent: (callback) => ipcRenderer.on('task', (_event, value) => callback(value))
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
