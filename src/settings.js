import { readFileSync, writeFileSync } from 'node:fs'

/* User Settings */
const defaultSettings = {
  installDir: '',
  minimizeOnPlay: true,
  minimizeToTray: true
}

export function getSettings(settingsPath) {
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

export function writeSettings(settingsPath, json) {
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
