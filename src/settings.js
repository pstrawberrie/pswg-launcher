import { join } from 'path'
import { readFileSync, writeFileSync } from 'node:fs'

/* User Settings */
const defaultSettings = {
  installDir: '',
  server: 'live',
  minimizeToTray: true,
  minimizeOnPlay: true,
  disableVideo: false,
  disableVerification: false
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

export async function setServer(installDir, serverChoice) {
  let server = 'swg.pstraw.net'

  switch (serverChoice) {
    case 'local':
      server = '172.23.219.155'
      break
    default:
      server = 'swg.pstraw.net'
  }

  return new Promise((resolve, reject) => {
    try {
      writeFileSync(
        join(installDir, 'swgemu_login.cfg'),
        `[ClientGame]\nloginServerAddress0=${server}\nloginServerPort0=44453`
      )

      resolve()
    } catch (err) {
      console.error('Error setting server in setServer', err)
      reject()
    }
  })
}
