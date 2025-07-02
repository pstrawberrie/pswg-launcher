import { readFileSync, writeFileSync } from 'node:fs'

/* User Settings */
const defaultSettings = {
  installDir: '',
  minimizeToTray: true,
  minimizeOnPlay: true,
  disableVideo: false
}

export function getSettings(settingsPath) {
  return new Promise((resolve, reject) => {
    try {
      const settings = readFileSync(settingsPath, 'utf8')
      resolve(JSON.parse(settings))
    } catch (err) {
      if (err.code === 'ENOENT') {
        writeFileSync(settingsPath, JSON.stringify(defaultSettings), 'utf8')
        resolve(defaultSettings)
      } else {
        console.error('Error reading file in getSettings', err)
        reject(null)
      }
    }
  })
}

export function writeSettings(settingsPath, json) {
  return new Promise((resolve, reject) => {
    try {
      writeFileSync(settingsPath, JSON.stringify(json), 'utf8')
      resolve()
    } catch (err) {
      console.error('Error writing to file in getSettings', err)
      reject()
    }
  })
}
