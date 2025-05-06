const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  getSettings: () => ipcRenderer.invoke('getSettings'),
  selectInstallDir: () => ipcRenderer.invoke('selectInstallDir'),
  nodeVersion: () => process.versions.node,
  chromeVersion: () => process.versions.chrome,
  electronVersion: () => process.versions.electron,
});