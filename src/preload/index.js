import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getSettings: () => ipcRenderer.invoke('getSettings'),
  selectInstallDir: (dir) => ipcRenderer.invoke('dialog:selectInstallDir', dir),
  setMinimizeToTray: (isChecked) => ipcRenderer.send('setMinimizeToTray', isChecked),
  setMinimizeOnPlay: (isChecked) => ipcRenderer.send('setMinimizeOnPlay', isChecked),
  setDisableVideo: (isChecked) => ipcRenderer.send('setDisableVideo', isChecked),
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
